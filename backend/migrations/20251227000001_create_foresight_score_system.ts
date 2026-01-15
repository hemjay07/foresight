import type { Knex } from 'knex';

/**
 * Foresight Score System
 *
 * Creates the unified points economy:
 * - foresight_scores: User's FS totals
 * - foresight_score_transactions: Audit trail
 * - Adds signup_number to users for early adopter tracking
 */

export async function up(knex: Knex): Promise<void> {
  // 1. Add signup_number to users table for early adopter tier determination
  const hasSignupNumber = await knex.schema.hasColumn('users', 'signup_number');
  if (!hasSignupNumber) {
    await knex.schema.table('users', (table) => {
      table.integer('signup_number').nullable();
      table.string('early_adopter_tier', 20).nullable(); // 'founding', 'early', 'bird', 'standard'
      table.timestamp('multiplier_expires_at').nullable();
      table.decimal('current_multiplier', 4, 2).defaultTo(1.0);

      table.index('signup_number');
      table.index('early_adopter_tier');
    });

    // Assign signup numbers to existing users based on created_at order
    await knex.raw(`
      WITH numbered_users AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as signup_num
        FROM users
      )
      UPDATE users
      SET signup_number = numbered_users.signup_num
      FROM numbered_users
      WHERE users.id = numbered_users.id
    `);

    // Set early adopter tiers based on signup number
    await knex.raw(`
      UPDATE users SET
        early_adopter_tier = CASE
          WHEN signup_number <= 1000 THEN 'founding'
          WHEN signup_number <= 5000 THEN 'early'
          WHEN signup_number <= 10000 THEN 'bird'
          ELSE 'standard'
        END,
        current_multiplier = CASE
          WHEN signup_number <= 1000 THEN 1.5
          WHEN signup_number <= 5000 THEN 1.25
          WHEN signup_number <= 10000 THEN 1.1
          ELSE 1.0
        END,
        multiplier_expires_at = CASE
          WHEN signup_number <= 1000 THEN created_at + INTERVAL '90 days'
          WHEN signup_number <= 5000 THEN created_at + INTERVAL '60 days'
          WHEN signup_number <= 10000 THEN created_at + INTERVAL '30 days'
          ELSE NULL
        END,
        is_founding_member = (signup_number <= 1000),
        founding_member_number = CASE WHEN signup_number <= 1000 THEN signup_number ELSE NULL END
    `);
  }

  // 2. Create foresight_scores table - stores user's FS totals
  await knex.schema.createTable('foresight_scores', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Score totals
    table.bigInteger('total_score').defaultTo(0).notNullable();        // All-time FS
    table.bigInteger('season_score').defaultTo(0).notNullable();       // Current season (monthly)
    table.bigInteger('week_score').defaultTo(0).notNullable();         // Current week
    table.bigInteger('referral_score').defaultTo(0).notNullable();     // FS from referrals only

    // Breakdown by source
    table.bigInteger('fantasy_score').defaultTo(0).notNullable();      // From contests
    table.bigInteger('engagement_score').defaultTo(0).notNullable();   // From daily actions
    table.bigInteger('social_score').defaultTo(0).notNullable();       // From social tasks
    table.bigInteger('achievement_score').defaultTo(0).notNullable();  // From achievements

    // Tier tracking
    table.string('tier', 20).defaultTo('bronze').notNullable();        // bronze/silver/gold/platinum/diamond
    table.decimal('tier_multiplier', 4, 2).defaultTo(1.0);
    table.timestamp('tier_updated_at').nullable();

    // Season tracking
    table.string('current_season', 20).nullable();   // '2025-01' format
    table.integer('current_week').nullable();        // ISO week number

    // Rankings (cached, updated by cron)
    table.integer('all_time_rank').nullable();
    table.integer('season_rank').nullable();
    table.integer('week_rank').nullable();
    table.integer('rank_change_week').defaultTo(0);  // +5 or -3 this week

    // Timestamps
    table.timestamp('last_earned_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique constraint
    table.unique(['user_id']);

    // Indexes for leaderboards
    table.index('total_score');
    table.index('season_score');
    table.index('week_score');
    table.index('tier');
    table.index('all_time_rank');
    table.index('season_rank');
  });

  // 3. Create foresight_score_transactions - audit trail
  await knex.schema.createTable('foresight_score_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Transaction details
    table.integer('base_amount').notNullable();            // Raw amount before multipliers
    table.integer('multiplied_amount').notNullable();      // Final amount after multipliers
    table.decimal('multiplier_applied', 4, 2).defaultTo(1.0);

    // Categorization
    table.string('reason', 50).notNullable();              // 'contest_win', 'daily_login', 'referral_signup', etc.
    table.string('category', 20).notNullable();            // 'fantasy', 'engagement', 'social', 'achievement'

    // Context
    table.string('source_type', 50).nullable();            // 'contest', 'quest', 'referral', etc.
    table.string('source_id', 100).nullable();             // ID of related entity
    table.jsonb('metadata').nullable();                    // Extra context data

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('reason');
    table.index('category');
    table.index('created_at');
    table.index(['user_id', 'created_at']);
  });

  // 4. Create leaderboard_snapshots for historical tracking
  await knex.schema.createTable('leaderboard_snapshots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('leaderboard_type', 20).notNullable();  // 'all_time', 'season', 'weekly', 'referral'
    table.string('period_key', 20).nullable();           // '2025-01' for season, '2025-W52' for weekly
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.integer('rank').notNullable();
    table.bigInteger('score').notNullable();
    table.string('tier', 20).nullable();
    table.string('username', 50).nullable();             // Denormalized for fast reads

    table.timestamp('snapshot_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['leaderboard_type', 'period_key']);
    table.index(['leaderboard_type', 'period_key', 'rank']);
    table.unique(['leaderboard_type', 'period_key', 'user_id']);
  });

  // 5. Create FS config table for dynamic configuration
  await knex.schema.createTable('foresight_score_config', (table) => {
    table.string('key', 50).primary();
    table.string('category', 30).notNullable();
    table.integer('base_amount').notNullable();
    table.text('description').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Seed FS earning config
  await knex('foresight_score_config').insert([
    // Fantasy Performance
    { key: 'contest_1st_place', category: 'fantasy', base_amount: 1000, description: 'Win 1st place in contest' },
    { key: 'contest_2nd_place', category: 'fantasy', base_amount: 750, description: 'Win 2nd place in contest' },
    { key: 'contest_3rd_place', category: 'fantasy', base_amount: 500, description: 'Win 3rd place in contest' },
    { key: 'contest_top_10_pct', category: 'fantasy', base_amount: 300, description: 'Finish in top 10%' },
    { key: 'contest_top_25_pct', category: 'fantasy', base_amount: 150, description: 'Finish in top 25%' },
    { key: 'contest_top_50_pct', category: 'fantasy', base_amount: 75, description: 'Finish in top 50%' },
    { key: 'contest_entry', category: 'fantasy', base_amount: 25, description: 'Enter any contest' },
    { key: 'captain_top_3', category: 'fantasy', base_amount: 100, description: 'Captain finishes in top 3 of contest' },
    { key: 'daily_flash_win', category: 'fantasy', base_amount: 200, description: 'Win daily flash contest' },
    { key: 'daily_flash_top_10', category: 'fantasy', base_amount: 50, description: 'Top 10 in daily flash' },

    // Daily Engagement
    { key: 'daily_login', category: 'engagement', base_amount: 10, description: 'Daily login' },
    { key: 'login_streak_bonus', category: 'engagement', base_amount: 5, description: 'Per day of streak (caps at +50)' },
    { key: 'daily_prediction_correct', category: 'engagement', base_amount: 25, description: 'Correct daily prediction' },
    { key: 'check_live_scores', category: 'engagement', base_amount: 5, description: 'View live scores' },
    { key: 'browse_ct_feed', category: 'engagement', base_amount: 5, description: 'Browse CT Feed for 30s' },
    { key: 'share_take', category: 'engagement', base_amount: 20, description: 'Share a take on CT Feed' },

    // Social Tasks
    { key: 'follow_twitter', category: 'social', base_amount: 100, description: 'Follow on Twitter (one-time)' },
    { key: 'follow_farcaster', category: 'social', base_amount: 100, description: 'Follow on Farcaster (one-time)' },
    { key: 'tweet_about_us', category: 'social', base_amount: 50, description: 'Tweet about CT Draft (2x/week max)' },
    { key: 'cast_about_us', category: 'social', base_amount: 50, description: 'Cast about CT Draft (2x/week max)' },
    { key: 'referral_signup', category: 'social', base_amount: 100, description: 'Referred user signs up' },
    { key: 'referral_contest', category: 'social', base_amount: 200, description: 'Referred user enters contest' },
    { key: 'referral_win', category: 'social', base_amount: 100, description: 'Referred user wins prize' },

    // Achievements
    { key: 'founding_member_bonus', category: 'achievement', base_amount: 1000, description: 'Founding member one-time bonus' },
    { key: 'first_win', category: 'achievement', base_amount: 500, description: 'Win first contest' },
    { key: 'streak_7_day', category: 'achievement', base_amount: 200, description: '7-day login streak' },
    { key: 'streak_30_day', category: 'achievement', base_amount: 1000, description: '30-day login streak' },
    { key: 'refer_5_friends', category: 'achievement', base_amount: 500, description: 'Refer 5 active friends' },
    { key: 'reach_gold', category: 'achievement', base_amount: 1000, description: 'Reach Gold tier' },
    { key: 'reach_diamond', category: 'achievement', base_amount: 5000, description: 'Reach Diamond tier' },
  ]);

  // 6. Create trigger function to auto-assign signup_number to new users
  await knex.raw(`
    CREATE OR REPLACE FUNCTION assign_signup_number()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.signup_number := (SELECT COALESCE(MAX(signup_number), 0) + 1 FROM users);

      -- Determine early adopter tier
      IF NEW.signup_number <= 1000 THEN
        NEW.early_adopter_tier := 'founding';
        NEW.current_multiplier := 1.5;
        NEW.multiplier_expires_at := NEW.created_at + INTERVAL '90 days';
        NEW.is_founding_member := TRUE;
        NEW.founding_member_number := NEW.signup_number;
      ELSIF NEW.signup_number <= 5000 THEN
        NEW.early_adopter_tier := 'early';
        NEW.current_multiplier := 1.25;
        NEW.multiplier_expires_at := NEW.created_at + INTERVAL '60 days';
      ELSIF NEW.signup_number <= 10000 THEN
        NEW.early_adopter_tier := 'bird';
        NEW.current_multiplier := 1.1;
        NEW.multiplier_expires_at := NEW.created_at + INTERVAL '30 days';
      ELSE
        NEW.early_adopter_tier := 'standard';
        NEW.current_multiplier := 1.0;
        NEW.multiplier_expires_at := NULL;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Check if trigger exists before creating
  const triggerExists = await knex.raw(`
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_signup_number_trigger'
  `);

  if (triggerExists.rows.length === 0) {
    await knex.raw(`
      CREATE TRIGGER set_signup_number_trigger
      BEFORE INSERT ON users
      FOR EACH ROW
      WHEN (NEW.signup_number IS NULL)
      EXECUTE FUNCTION assign_signup_number();
    `);
  }

  // 7. Create function to calculate tier from score
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_fs_tier(score BIGINT)
    RETURNS VARCHAR(20) AS $$
    BEGIN
      RETURN CASE
        WHEN score >= 50000 THEN 'diamond'
        WHEN score >= 20000 THEN 'platinum'
        WHEN score >= 5000 THEN 'gold'
        WHEN score >= 1000 THEN 'silver'
        ELSE 'bronze'
      END;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);

  // 8. Create function to get tier multiplier
  await knex.raw(`
    CREATE OR REPLACE FUNCTION get_tier_multiplier(tier VARCHAR(20))
    RETURNS DECIMAL(4,2) AS $$
    BEGIN
      RETURN CASE tier
        WHEN 'diamond' THEN 1.2
        WHEN 'platinum' THEN 1.15
        WHEN 'gold' THEN 1.1
        WHEN 'silver' THEN 1.05
        ELSE 1.0
      END;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger first
  await knex.raw(`DROP TRIGGER IF EXISTS set_signup_number_trigger ON users`);
  await knex.raw(`DROP FUNCTION IF EXISTS assign_signup_number()`);
  await knex.raw(`DROP FUNCTION IF EXISTS calculate_fs_tier(BIGINT)`);
  await knex.raw(`DROP FUNCTION IF EXISTS get_tier_multiplier(VARCHAR)`);

  // Drop tables
  await knex.schema.dropTableIfExists('foresight_score_config');
  await knex.schema.dropTableIfExists('leaderboard_snapshots');
  await knex.schema.dropTableIfExists('foresight_score_transactions');
  await knex.schema.dropTableIfExists('foresight_scores');

  // Remove columns from users
  await knex.schema.table('users', (table) => {
    table.dropColumn('signup_number');
    table.dropColumn('early_adopter_tier');
    table.dropColumn('multiplier_expires_at');
    table.dropColumn('current_multiplier');
  });
}
