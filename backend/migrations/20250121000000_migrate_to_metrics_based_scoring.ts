import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Add base_price column to influencers (for scoring formula)
  await knex.schema.alterTable('influencers', (table) => {
    table.decimal('base_price', 10, 2).defaultTo(20);
  });

  // 2. Update influencer pricing for metrics-based system
  // Budget: 100 points for 5 influencers
  // Tiers: S=28pts, A=22pts, B=18pts, C=12pts

  // Update S-Tier influencers
  await knex('influencers')
    .where('tier', 'S')
    .update({
      price: 28.00,
      base_price: 28.00,
    });

  // Update A-Tier influencers
  await knex('influencers')
    .where('tier', 'A')
    .update({
      price: 22.00,
      base_price: 22.00,
    });

  // Update B-Tier influencers
  await knex('influencers')
    .where('tier', 'B')
    .update({
      price: 18.00,
      base_price: 18.00,
    });

  // Update C-Tier influencers
  await knex('influencers')
    .where('tier', 'C')
    .update({
      price: 12.00,
      base_price: 12.00,
    });

  // 3. Modify user_teams for metrics-based scoring
  await knex.schema.alterTable('user_teams', (table) => {
    // Add columns for metrics-based system
    table.decimal('budget_used', 10, 2).defaultTo(0);
    table.integer('current_score').defaultTo(0);
    table.integer('previous_score').defaultTo(0);
    table.integer('score_change').defaultTo(0);
    table.timestamp('last_score_update').nullable();
  });

  // 4. Add prize league columns to fantasy_contests
  await knex.schema.alterTable('fantasy_contests', (table) => {
    table.decimal('entry_fee', 10, 4).defaultTo(0.000); // ETH
    table.decimal('prize_pool', 10, 4).defaultTo(0.000); // ETH
    table.boolean('is_prize_league').defaultTo(false);
    table.jsonb('prize_distribution').nullable(); // Store distribution percentages
  });

  // 5. Add payment tracking to user_teams
  await knex.schema.alterTable('user_teams', (table) => {
    table.boolean('entry_fee_paid').defaultTo(false);
    table.string('payment_tx_hash', 66).nullable();
    table.timestamp('payment_confirmed_at').nullable();
    table.decimal('prize_won', 10, 4).nullable();
    table.boolean('prize_claimed').defaultTo(false);
    table.string('prize_claim_tx_hash', 66).nullable();
  });

  // 6. Create index on base_price
  await knex.schema.alterTable('influencers', (table) => {
    table.index('base_price');
  });

  // 7. Update existing contest to be prize league
  const activeContest = await knex('fantasy_contests')
    .where('status', 'active')
    .first();

  if (activeContest) {
    await knex('fantasy_contests')
      .where('id', activeContest.id)
      .update({
        is_prize_league: false, // Start with free league
        entry_fee: 0.000,
        prize_pool: 0.000,
        prize_distribution: JSON.stringify({
          '1': 40, // 1st place: 40%
          '2': 25, // 2nd place: 25%
          '3': 15, // 3rd place: 15%
          '4': 5,  // 4th place: 5%
          '5': 5,  // 5th place: 5%
          '6-10': 2, // 6th-10th: 2% each
        }),
      });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove columns in reverse order
  await knex.schema.alterTable('user_teams', (table) => {
    table.dropColumn('prize_claim_tx_hash');
    table.dropColumn('prize_claimed');
    table.dropColumn('prize_won');
    table.dropColumn('payment_confirmed_at');
    table.dropColumn('payment_tx_hash');
    table.dropColumn('entry_fee_paid');
    table.dropColumn('last_score_update');
    table.dropColumn('score_change');
    table.dropColumn('previous_score');
    table.dropColumn('current_score');
    table.dropColumn('budget_used');
  });

  await knex.schema.alterTable('fantasy_contests', (table) => {
    table.dropColumn('prize_distribution');
    table.dropColumn('is_prize_league');
    table.dropColumn('prize_pool');
    table.dropColumn('entry_fee');
  });

  await knex.schema.alterTable('influencers', (table) => {
    table.dropIndex('base_price');
    table.dropColumn('base_price');
  });

  // Revert pricing
  await knex('influencers')
    .where('tier', 'S')
    .update({ price: 12.00 });

  await knex('influencers')
    .where('tier', 'A')
    .update({ price: 8.00 });

  await knex('influencers')
    .where('tier', 'B')
    .update({ price: 5.00 });

  await knex('influencers')
    .where('tier', 'C')
    .update({ price: 3.00 });
}
