import type { Knex } from 'knex';

/**
 * Add contest finalization tracking
 * - is_finalized flag on contests
 * - contest_wins counter on users
 */
export async function up(knex: Knex): Promise<void> {
  // Add finalization fields to fantasy_contests
  await knex.schema.alterTable('fantasy_contests', (table) => {
    table.boolean('is_finalized').defaultTo(false);
    table.timestamp('finalized_at').nullable();
  });

  // Add contest win counter to users
  await knex.schema.alterTable('users', (table) => {
    table.integer('contest_wins').defaultTo(0);
    table.integer('contests_entered').defaultTo(0);
  });

  console.log('[Migration] Added contest finalization fields');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('fantasy_contests', (table) => {
    table.dropColumn('is_finalized');
    table.dropColumn('finalized_at');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('contest_wins');
    table.dropColumn('contests_entered');
  });

  console.log('[Migration] Removed contest finalization fields');
}
