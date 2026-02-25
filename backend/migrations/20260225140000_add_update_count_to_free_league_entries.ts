import type { Knex } from 'knex';

/**
 * Add update_count to free_league_entries
 *
 * Tracks how many times a user has updated their team for a given contest.
 * Used to enforce XP-level-based transfer limits:
 *   NOVICE: 1 update/contest window
 *   APPRENTICE: 2
 *   SKILLED: 3
 *   EXPERT: 4
 *   MASTER: 5
 *   LEGENDARY: unlimited (999)
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('free_league_entries', (table) => {
    table.integer('update_count').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('free_league_entries', (table) => {
    table.dropColumn('update_count');
  });
}
