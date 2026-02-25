import type { Knex } from 'knex';

/**
 * Local persistence for user follows.
 *
 * Follows are stored here first (source of truth).
 * Tapestry Protocol is synced async as a secondary layer.
 *
 * This prevents the "follows not persisting" bug where
 * 100% Tapestry-dependence caused data loss on API failures.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_follows', (table) => {
    table.increments('id').primary();
    table.uuid('follower_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('following_tapestry_profile_id', 255).notNullable();
    table.string('following_username', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['follower_user_id', 'following_tapestry_profile_id']);
    table.index('follower_user_id');
    table.index('following_tapestry_profile_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_follows');
}
