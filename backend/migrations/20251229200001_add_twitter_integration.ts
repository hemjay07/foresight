import type { Knex } from 'knex';

/**
 * Add Twitter integration fields to users table
 *
 * Enables:
 * - Twitter OAuth 2.0 authentication
 * - Quest verification (follow @Foresight, tweet about app)
 * - Profile enhancement with Twitter credentials
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // Twitter OAuth fields (twitter_handle already exists)
    table.string('twitter_id', 50).unique().nullable();
    table.integer('twitter_followers').defaultTo(0);
    table.text('twitter_access_token').nullable(); // Encrypted
    table.text('twitter_refresh_token').nullable(); // Encrypted
    table.timestamp('twitter_connected_at').nullable();
    table.timestamp('twitter_token_expires_at').nullable();

    // Twitter verification flags (for quests)
    table.boolean('twitter_follows_foresight').defaultTo(false);
    table.timestamp('twitter_last_verified_at').nullable();
  });

  console.log('[Migration] Added Twitter integration fields to users table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // Note: twitter_handle was pre-existing, don't drop it
    table.dropColumn('twitter_id');
    table.dropColumn('twitter_followers');
    table.dropColumn('twitter_access_token');
    table.dropColumn('twitter_refresh_token');
    table.dropColumn('twitter_connected_at');
    table.dropColumn('twitter_token_expires_at');
    table.dropColumn('twitter_follows_foresight');
    table.dropColumn('twitter_last_verified_at');
  });

  console.log('[Migration] Removed Twitter integration fields from users table');
}
