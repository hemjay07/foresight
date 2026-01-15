import type { Knex } from 'knex';

/**
 * Create table to track verified tweets (for weekly_tweet quest)
 * Prevents users from claiming the same tweet multiple times
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('twitter_verified_tweets', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('tweet_id', 50).notNullable().unique();
    table.text('tweet_text').nullable();
    table.timestamp('verified_at').notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('tweet_id');
  });

  console.log('[Migration] Created twitter_verified_tweets table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('twitter_verified_tweets');
  console.log('[Migration] Dropped twitter_verified_tweets table');
}
