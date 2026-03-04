import type { Knex } from 'knex';

/**
 * Update Season 0 prize pool from $100 to $225 ($100/$75/$50 for top 3).
 */
export async function up(knex: Knex): Promise<void> {
  await knex('prized_contests')
    .where('name', 'Season 0')
    .update({
      prize_pool: '225',
      distributable_pool: '225',
      description: 'Draft 5 CT influencers. Captain gets 2x. $225 in prizes: $100 / $75 / $50 to top 3. Free entry. Welcome to Season 0.',
      updated_at: knex.fn.now(),
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex('prized_contests')
    .where('name', 'Season 0')
    .update({
      prize_pool: '100',
      distributable_pool: '100',
      description: 'Draft 5 CT influencers. Captain gets 2x. $100 in prizes: $50 / $30 / $20 to top 3. Free entry. Welcome to Season 0.',
      updated_at: knex.fn.now(),
    });
}
