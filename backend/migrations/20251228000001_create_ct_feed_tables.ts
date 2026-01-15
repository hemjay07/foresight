import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create ct_tweets table
  await knex.schema.createTable('ct_tweets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('tweet_id', 255).unique().notNullable();
    table.integer('influencer_id').references('id').inTable('influencers').onDelete('CASCADE');

    // Tweet content
    table.text('text').notNullable();
    table.timestamp('created_at').notNullable();

    // Engagement metrics
    table.integer('likes').defaultTo(0);
    table.integer('retweets').defaultTo(0);
    table.integer('replies').defaultTo(0);
    table.integer('quotes').defaultTo(0);
    table.bigInteger('views').defaultTo(0);
    table.integer('bookmarks').defaultTo(0);

    // Calculated scores
    table.decimal('engagement_score', 12, 2).defaultTo(0);
    table.decimal('viral_score', 12, 2).defaultTo(0);

    // Metadata
    table.boolean('is_reply').defaultTo(false);
    table.boolean('is_retweet').defaultTo(false);
    table.boolean('has_media').defaultTo(false);

    // Future: prediction tracking
    table.boolean('is_prediction').nullable();
    table.string('prediction_outcome', 50).nullable();

    // Timestamps
    table.timestamp('fetched_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create indexes for ct_tweets
  await knex.schema.raw('CREATE INDEX idx_ct_tweets_influencer ON ct_tweets(influencer_id)');
  await knex.schema.raw('CREATE INDEX idx_ct_tweets_engagement ON ct_tweets(engagement_score DESC)');
  await knex.schema.raw('CREATE INDEX idx_ct_tweets_created ON ct_tweets(created_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_ct_tweets_viral ON ct_tweets(viral_score DESC)');

  // Create rising_stars table
  await knex.schema.createTable('rising_stars', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('twitter_handle', 255).unique().notNullable();
    table.string('twitter_id', 255).nullable();

    // Profile data
    table.string('name', 255).nullable();
    table.text('bio').nullable();
    table.text('profile_image_url').nullable();

    // Growth metrics
    table.integer('followers_count').defaultTo(0);
    table.integer('followers_7d_ago').defaultTo(0);
    table.decimal('follower_growth_rate', 8, 4).defaultTo(0);

    // Engagement metrics
    table.decimal('avg_likes_per_tweet', 10, 2).defaultTo(0);
    table.decimal('avg_retweets_per_tweet', 10, 2).defaultTo(0);
    table.integer('viral_tweet_count').defaultTo(0);

    // Discovery tracking
    table.timestamp('discovered_at').defaultTo(knex.fn.now());
    table.string('discovery_source', 50).nullable();

    // Pipeline status
    table.string('status', 50).defaultTo('discovered');
    table.integer('votes_for').defaultTo(0);
    table.integer('votes_against').defaultTo(0);
    table.timestamp('added_to_game_at').nullable();

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create feed_interactions table
  await knex.schema.createTable('feed_interactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Interaction type
    table.string('interaction_type', 50).notNullable();

    // Target (nullable - one of these should be set)
    table.uuid('tweet_id').references('id').inTable('ct_tweets').onDelete('SET NULL').nullable();
    table.uuid('rising_star_id').references('id').inTable('rising_stars').onDelete('SET NULL').nullable();

    // Session tracking
    table.string('session_id', 255).nullable();
    table.integer('time_spent_seconds').defaultTo(0);
    table.integer('tweets_viewed').defaultTo(0);

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create index for feed_interactions
  await knex.schema.raw('CREATE INDEX idx_feed_interactions_user ON feed_interactions(user_id)');
  await knex.schema.raw('CREATE INDEX idx_feed_interactions_type ON feed_interactions(interaction_type)');
  await knex.schema.raw('CREATE INDEX idx_feed_interactions_created ON feed_interactions(created_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feed_interactions');
  await knex.schema.dropTableIfExists('rising_stars');
  await knex.schema.dropTableIfExists('ct_tweets');
}
