import type { Knex } from 'knex';

/**
 * Prized Leagues V2 Schema
 * - Contest types configuration table
 * - Updated contests table with type reference
 * - Prize distribution rules
 * - Influencer snapshots for scoring
 */
export async function up(knex: Knex): Promise<void> {
  // Contest Types - Configuration reference table
  await knex.schema.createTable('contest_types', (table) => {
    table.increments('id').primary();
    table.string('code', 30).unique().notNullable(); // WEEKLY_STARTER, DAILY_FLASH, etc.
    table.string('name', 50).notNullable();
    table.text('description');
    table.decimal('entry_fee', 18, 8).notNullable(); // ETH amount
    table.integer('team_size').notNullable().defaultTo(5); // 3 for daily, 5 for weekly
    table.boolean('has_captain').defaultTo(true);
    table.integer('duration_hours').notNullable(); // 24 for daily, 168 for weekly
    table.decimal('rake_percent', 4, 2).notNullable(); // 8-12%
    table.integer('min_players').defaultTo(2);
    table.integer('max_players').defaultTo(0); // 0 = unlimited
    table.integer('winners_percent').defaultTo(40); // Top X% win prizes
    table.boolean('is_free').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.integer('display_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Insert default contest types
  await knex('contest_types').insert([
    {
      code: 'FREE_LEAGUE',
      name: 'Free League',
      description: 'Practice mode - no entry fee, real prizes funded by platform',
      entry_fee: 0,
      team_size: 5,
      has_captain: true,
      duration_hours: 168, // 7 days
      rake_percent: 0,
      min_players: 10,
      max_players: 0,
      winners_percent: 10,
      is_free: true,
      display_order: 1,
    },
    {
      code: 'WEEKLY_STARTER',
      name: 'Weekly Starter',
      description: 'Low stakes weekly contest - perfect for beginners',
      entry_fee: 0.002,
      team_size: 5,
      has_captain: true,
      duration_hours: 168,
      rake_percent: 10,
      min_players: 10,
      max_players: 100,
      winners_percent: 40,
      is_free: false,
      display_order: 2,
    },
    {
      code: 'WEEKLY_STANDARD',
      name: 'Weekly Standard',
      description: 'The main event - compete for serious prizes',
      entry_fee: 0.01,
      team_size: 5,
      has_captain: true,
      duration_hours: 168,
      rake_percent: 12,
      min_players: 20,
      max_players: 100,
      winners_percent: 40,
      is_free: false,
      display_order: 3,
    },
    {
      code: 'WEEKLY_PRO',
      name: 'Weekly Pro',
      description: 'High stakes for experienced players',
      entry_fee: 0.05,
      team_size: 5,
      has_captain: true,
      duration_hours: 168,
      rake_percent: 8,
      min_players: 10,
      max_players: 50,
      winners_percent: 40,
      is_free: false,
      display_order: 4,
    },
    {
      code: 'DAILY_FLASH',
      name: 'Daily Flash',
      description: 'Quick 24-hour contest - pick 3 influencers, no captain',
      entry_fee: 0.001,
      team_size: 3,
      has_captain: false,
      duration_hours: 24,
      rake_percent: 10,
      min_players: 10,
      max_players: 0,
      winners_percent: 30,
      is_free: false,
      display_order: 5,
    },
  ]);

  // Prize Distribution Rules
  await knex.schema.createTable('prize_distribution_rules', (table) => {
    table.increments('id').primary();
    table.integer('min_players').notNullable();
    table.integer('max_players').notNullable(); // 0 = no max
    table.integer('rank').notNullable(); // 1, 2, 3, etc. or 0 for "rest"
    table.decimal('percentage', 5, 2).notNullable(); // % of prize pool
    table.string('label', 20); // "1st", "2nd", "4th-10th", etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['min_players', 'max_players']);
  });

  // Insert prize distribution rules
  // Small contests (10-20 players) - Top 30%
  await knex('prize_distribution_rules').insert([
    { min_players: 10, max_players: 20, rank: 1, percentage: 40, label: '1st' },
    { min_players: 10, max_players: 20, rank: 2, percentage: 25, label: '2nd' },
    { min_players: 10, max_players: 20, rank: 3, percentage: 15, label: '3rd' },
    { min_players: 10, max_players: 20, rank: 4, percentage: 7, label: '4th' },
    { min_players: 10, max_players: 20, rank: 5, percentage: 5, label: '5th' },
    { min_players: 10, max_players: 20, rank: 6, percentage: 4, label: '6th' },
    { min_players: 10, max_players: 20, rank: 0, percentage: 4, label: 'Rest' }, // Split among remaining winners
  ]);

  // Medium contests (21-50 players) - Top 35%
  await knex('prize_distribution_rules').insert([
    { min_players: 21, max_players: 50, rank: 1, percentage: 30, label: '1st' },
    { min_players: 21, max_players: 50, rank: 2, percentage: 20, label: '2nd' },
    { min_players: 21, max_players: 50, rank: 3, percentage: 12, label: '3rd' },
    { min_players: 21, max_players: 50, rank: 4, percentage: 6, label: '4th' },
    { min_players: 21, max_players: 50, rank: 5, percentage: 5, label: '5th' },
    { min_players: 21, max_players: 50, rank: 6, percentage: 4, label: '6th' },
    { min_players: 21, max_players: 50, rank: 7, percentage: 3, label: '7th' },
    { min_players: 21, max_players: 50, rank: 8, percentage: 3, label: '8th' },
    { min_players: 21, max_players: 50, rank: 9, percentage: 2, label: '9th' },
    { min_players: 21, max_players: 50, rank: 10, percentage: 2, label: '10th' },
    { min_players: 21, max_players: 50, rank: 0, percentage: 13, label: 'Rest' },
  ]);

  // Large contests (51+ players) - Top 40%
  await knex('prize_distribution_rules').insert([
    { min_players: 51, max_players: 0, rank: 1, percentage: 25, label: '1st' },
    { min_players: 51, max_players: 0, rank: 2, percentage: 15, label: '2nd' },
    { min_players: 51, max_players: 0, rank: 3, percentage: 10, label: '3rd' },
    { min_players: 51, max_players: 0, rank: 4, percentage: 5, label: '4th' },
    { min_players: 51, max_players: 0, rank: 5, percentage: 5, label: '5th' },
    { min_players: 51, max_players: 0, rank: 6, percentage: 3, label: '6th' },
    { min_players: 51, max_players: 0, rank: 7, percentage: 3, label: '7th' },
    { min_players: 51, max_players: 0, rank: 8, percentage: 2.5, label: '8th' },
    { min_players: 51, max_players: 0, rank: 9, percentage: 2.5, label: '9th' },
    { min_players: 51, max_players: 0, rank: 10, percentage: 2, label: '10th' },
    { min_players: 51, max_players: 0, rank: 0, percentage: 27, label: 'Rest' }, // 11th-40th split this
  ]);

  // Add contest_type_id to prized_contests table
  await knex.schema.alterTable('prized_contests', (table) => {
    table.integer('contest_type_id').references('id').inTable('contest_types');
    table.integer('team_size').defaultTo(5);
    table.boolean('has_captain').defaultTo(true);
    table.boolean('is_free').defaultTo(false);
    table.decimal('rake_percent', 4, 2).defaultTo(12);
    table.integer('winners_count').defaultTo(0); // Calculated after finalization
    table.jsonb('prize_breakdown'); // Detailed breakdown of who won what
  });

  // Influencer Snapshots for delta scoring
  await knex.schema.createTable('influencer_snapshots', (table) => {
    table.increments('id').primary();
    table.integer('influencer_id').references('id').inTable('influencers').onDelete('CASCADE');
    table.integer('contest_id').references('id').inTable('prized_contests').onDelete('CASCADE');
    table.enum('snapshot_type', ['start', 'end']).notNullable();
    table.timestamp('snapshot_time').notNullable();

    // Twitter metrics at snapshot time
    table.integer('followers').defaultTo(0);
    table.integer('following').defaultTo(0);
    table.integer('tweet_count').defaultTo(0);
    table.integer('listed_count').defaultTo(0);

    // Engagement metrics (from recent tweets)
    table.integer('likes_received').defaultTo(0);
    table.integer('retweets_received').defaultTo(0);
    table.integer('replies_received').defaultTo(0);
    table.integer('quotes_received').defaultTo(0);
    table.integer('impressions').defaultTo(0);

    // Calculated metrics
    table.decimal('engagement_rate', 8, 4).defaultTo(0);
    table.integer('viral_tweets').defaultTo(0); // Tweets with >1000 likes

    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['influencer_id', 'contest_id', 'snapshot_type']);
    table.index('contest_id');
  });

  // Free league entries (no blockchain, separate tracking)
  await knex.schema.createTable('free_league_entries', (table) => {
    table.increments('id').primary();
    table.integer('contest_id').references('id').inTable('prized_contests').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users');
    table.string('wallet_address', 42).notNullable();
    table.specificType('team_ids', 'integer[]').notNullable();
    table.integer('captain_id');
    table.decimal('score', 10, 2);
    table.jsonb('score_breakdown');
    table.integer('rank');
    table.decimal('prize_won', 18, 8);
    table.boolean('claimed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['contest_id', 'wallet_address']);
    table.index('user_id');
  });

  // Entry limits for free leagues
  await knex.schema.createTable('free_league_limits', (table) => {
    table.increments('id').primary();
    table.string('wallet_address', 42).notNullable();
    table.date('week_start').notNullable(); // Monday of the week
    table.integer('entries_used').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['wallet_address', 'week_start']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('free_league_limits');
  await knex.schema.dropTableIfExists('free_league_entries');
  await knex.schema.dropTableIfExists('influencer_snapshots');

  await knex.schema.alterTable('prized_contests', (table) => {
    table.dropColumn('contest_type_id');
    table.dropColumn('team_size');
    table.dropColumn('has_captain');
    table.dropColumn('is_free');
    table.dropColumn('rake_percent');
    table.dropColumn('winners_count');
    table.dropColumn('prize_breakdown');
  });

  await knex.schema.dropTableIfExists('prize_distribution_rules');
  await knex.schema.dropTableIfExists('contest_types');
}
