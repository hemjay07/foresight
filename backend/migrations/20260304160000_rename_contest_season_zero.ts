import type { Knex } from 'knex';

/**
 * Rename "The Call" contest to "Season 0" and update its description.
 */
export async function up(knex: Knex): Promise<void> {
  await knex('prized_contests')
    .where('name', 'The Call')
    .update({
      name: 'Season 0',
      description: 'Draft 5 CT influencers. Captain gets 2x. $100 in prizes: $50 / $30 / $20 to top 3. Free entry. Welcome to Season 0.',
      updated_at: knex.fn.now(),
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex('prized_contests')
    .where('name', 'Season 0')
    .update({
      name: 'The Call',
      description: 'Draft 5 CT influencers. Captain gets 2x. $100 in prizes: $50 / $30 / $20 to top 3. Free entry. This is your call.',
      updated_at: knex.fn.now(),
    });
}
