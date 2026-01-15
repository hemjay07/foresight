import { Knex } from 'knex';

/**
 * Migration: Create weekly_snapshots table
 * Stores start/end of week metrics for delta-based scoring
 */
export async function up(knex: Knex): Promise<void> {
  // 1. Create weekly_snapshots table
  await knex.schema.createTable('weekly_snapshots', (table) => {
    table.increments('id').primary();
    table.integer('influencer_id').notNullable();
    table.integer('contest_id').notNullable();
    table.string('snapshot_type', 10).notNullable(); // 'start' or 'end'

    // Profile metrics
    table.bigInteger('follower_count').notNullable().defaultTo(0);
    table.integer('following_count').defaultTo(0);
    table.bigInteger('tweet_count').notNullable().defaultTo(0);

    // Engagement metrics (from recent tweets at snapshot time)
    table.integer('tweets_analyzed').defaultTo(0);
    table.bigInteger('total_likes').defaultTo(0);
    table.bigInteger('total_retweets').defaultTo(0);
    table.bigInteger('total_replies').defaultTo(0);
    table.bigInteger('total_views').defaultTo(0);
    table.bigInteger('total_quotes').defaultTo(0);
    table.bigInteger('total_bookmarks').defaultTo(0);
    table.decimal('avg_engagement_rate', 8, 4).defaultTo(0);

    // Metadata
    table.timestamp('captured_at').notNullable().defaultTo(knex.fn.now());
    table.string('source', 30).defaultTo('twitterapi.io');
    table.jsonb('raw_profile_response'); // Store full API response for debugging
    table.jsonb('raw_tweets_response'); // Store tweets response for debugging

    // Status tracking
    table.boolean('is_valid').defaultTo(true);
    table.text('error_message');

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('influencer_id').references('influencers.id').onDelete('CASCADE');
    table.foreign('contest_id').references('fantasy_contests.id').onDelete('CASCADE');

    // Unique constraint: one snapshot per influencer per contest per type
    table.unique(['influencer_id', 'contest_id', 'snapshot_type']);
  });

  // Indexes for common queries
  await knex.schema.alterTable('weekly_snapshots', (table) => {
    table.index('contest_id');
    table.index('influencer_id');
    table.index('snapshot_type');
    table.index(['contest_id', 'snapshot_type']);
  });

  // 2. Create api_fetch_logs table for tracking API calls
  await knex.schema.createTable('api_fetch_logs', (table) => {
    table.increments('id').primary();
    table.string('fetch_type', 50).notNullable(); // 'profile', 'tweets', 'batch_profiles', 'batch_tweets'
    table.integer('influencer_id').references('influencers.id').onDelete('SET NULL');
    table.integer('contest_id').references('fantasy_contests.id').onDelete('SET NULL');

    // Request details
    table.string('endpoint', 200).notNullable();
    table.jsonb('request_params');

    // Response details
    table.integer('status_code');
    table.boolean('success').notNullable();
    table.text('error_message');
    table.integer('response_time_ms');
    table.integer('retry_count').defaultTo(0);

    // Cost tracking
    table.decimal('estimated_credits', 10, 6);

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Indexes for api_fetch_logs
  await knex.schema.alterTable('api_fetch_logs', (table) => {
    table.index('created_at');
    table.index('fetch_type');
    table.index('success');
    table.index(['created_at', 'success']);
  });

  // 3. Add twitter_id and tracking columns to influencers table (if they don't exist)
  const hasTwitterId = await knex.schema.hasColumn('influencers', 'twitter_id');
  if (!hasTwitterId) {
    await knex.schema.alterTable('influencers', (table) => {
      table.string('twitter_id', 30); // Twitter's numeric ID
    });
  }

  const hasIsActive = await knex.schema.hasColumn('influencers', 'is_active');
  if (!hasIsActive) {
    await knex.schema.alterTable('influencers', (table) => {
      table.boolean('is_active').defaultTo(true);
    });
  }

  const hasLastFetchError = await knex.schema.hasColumn('influencers', 'last_fetch_error');
  if (!hasLastFetchError) {
    await knex.schema.alterTable('influencers', (table) => {
      table.text('last_fetch_error');
    });
  }

  const hasConsecutiveFailures = await knex.schema.hasColumn('influencers', 'consecutive_failures');
  if (!hasConsecutiveFailures) {
    await knex.schema.alterTable('influencers', (table) => {
      table.integer('consecutive_failures').defaultTo(0);
    });
  }

  const hasLastSuccessfulFetch = await knex.schema.hasColumn('influencers', 'last_successful_fetch');
  if (!hasLastSuccessfulFetch) {
    await knex.schema.alterTable('influencers', (table) => {
      table.timestamp('last_successful_fetch');
    });
  }

  console.log('✅ Created weekly_snapshots and api_fetch_logs tables');
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables
  await knex.schema.dropTableIfExists('api_fetch_logs');
  await knex.schema.dropTableIfExists('weekly_snapshots');

  // Remove added columns from influencers (only columns added by this migration)
  const hasTwitterId = await knex.schema.hasColumn('influencers', 'twitter_id');
  if (hasTwitterId) {
    await knex.schema.alterTable('influencers', (table) => {
      table.dropColumn('twitter_id');
    });
  }

  // Note: is_active may have existed before, so only drop the new columns we added
  const hasLastFetchError = await knex.schema.hasColumn('influencers', 'last_fetch_error');
  if (hasLastFetchError) {
    await knex.schema.alterTable('influencers', (table) => {
      table.dropColumn('last_fetch_error');
    });
  }

  const hasConsecutiveFailures = await knex.schema.hasColumn('influencers', 'consecutive_failures');
  if (hasConsecutiveFailures) {
    await knex.schema.alterTable('influencers', (table) => {
      table.dropColumn('consecutive_failures');
    });
  }

  const hasLastSuccessfulFetch = await knex.schema.hasColumn('influencers', 'last_successful_fetch');
  if (hasLastSuccessfulFetch) {
    await knex.schema.alterTable('influencers', (table) => {
      table.dropColumn('last_successful_fetch');
    });
  }
}
