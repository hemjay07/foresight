import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Quest definitions table
  await knex.schema.createTable('quests', (table) => {
    table.increments('id').primary();
    table.string('quest_id').unique().notNullable(); // e.g., 'daily_login', 'win_streak_5'
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['daily', 'weekly', 'monthly', 'one_time', 'repeatable']).notNullable();
    table.enum('category', ['engagement', 'skill', 'social', 'achievement']).notNullable();

    // Rewards
    table.integer('points_reward').defaultTo(0);
    table.bigInteger('eth_reward_wei').defaultTo(0); // Wei amount (BigInt)
    table.boolean('eth_reward_enabled').defaultTo(false);

    // Requirements
    table.jsonb('requirements').notNullable(); // { type: 'games_played', value: 5 }
    table.integer('min_reputation').defaultTo(0);
    table.integer('min_account_age_days').defaultTo(0);
    table.decimal('min_wallet_balance_eth', 18, 8).defaultTo(0);
    table.integer('min_wallet_age_days').defaultTo(0);
    table.integer('min_games_played').defaultTo(0);

    // Limits
    table.integer('max_completions_per_user').nullable(); // null = unlimited
    table.integer('max_completions_per_day').nullable();
    table.integer('max_total_completions').nullable(); // Global cap
    table.integer('current_completions').defaultTo(0);

    // Timing
    table.timestamp('start_date').nullable();
    table.timestamp('end_date').nullable();
    table.integer('cooldown_hours').defaultTo(0); // Hours before can repeat

    // Status
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(0); // Display order

    table.timestamps(true, true);

    table.index('quest_id');
    table.index('type');
    table.index('is_active');
  });

  // User quest progress/completions
  await knex.schema.createTable('user_quest_completions', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('quest_id').notNullable().references('id').inTable('quests').onDelete('CASCADE');

    table.timestamp('completed_at').notNullable();
    table.integer('points_earned').defaultTo(0);
    table.bigInteger('eth_earned_wei').defaultTo(0);

    // Vesting for ETH rewards
    table.timestamp('eth_unlock_date').nullable();
    table.boolean('eth_claimed').defaultTo(false);
    table.string('claim_tx_hash').nullable(); // On-chain transaction hash

    // Verification
    table.jsonb('verification_data').nullable(); // Proof of completion
    table.boolean('verified').defaultTo(false);
    table.timestamp('verified_at').nullable();

    table.timestamps(true, true);

    table.index('user_id');
    table.index('quest_id');
    table.index('completed_at');
    table.index(['user_id', 'quest_id']);
    table.index(['eth_claimed', 'eth_unlock_date']);
  });

  // User quest progress (for multi-step quests)
  await knex.schema.createTable('user_quest_progress', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('quest_id').notNullable().references('id').inTable('quests').onDelete('CASCADE');

    table.integer('current_progress').defaultTo(0); // e.g., 3/5 games won
    table.integer('target_progress').notNullable(); // e.g., 5
    table.jsonb('progress_data').nullable(); // Extra tracking data

    table.timestamp('started_at').notNullable();
    table.timestamp('last_updated').notNullable();

    table.unique(['user_id', 'quest_id']);
    table.index('user_id');
  });

  // Quest reward pool (tracks available funds)
  await knex.schema.createTable('quest_reward_pool', (table) => {
    table.increments('id').primary();
    table.integer('month').notNullable(); // YYYYMM format (e.g., 202501)

    table.bigInteger('allocated_wei').notNullable(); // From protocol fees
    table.bigInteger('distributed_wei').defaultTo(0);
    table.bigInteger('pending_wei').defaultTo(0); // Vesting
    table.bigInteger('remaining_wei').defaultTo(0);

    table.integer('total_completions').defaultTo(0);
    table.integer('eth_claims').defaultTo(0);

    table.timestamps(true, true);

    table.unique('month');
  });

  // Referral tracking (separate from quests for security)
  await knex.schema.createTable('referrals', (table) => {
    table.increments('id').primary();
    table.uuid('referrer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('referee_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.string('referral_code').notNullable();
    table.timestamp('referred_at').notNullable();

    // Validation
    table.boolean('referee_active').defaultTo(false); // Played 3+ games
    table.boolean('referee_deposited').defaultTo(false); // Deposited 0.05+ ETH
    table.integer('referee_games_played').defaultTo(0);
    table.decimal('referee_total_deposited', 18, 8).defaultTo(0);

    // Reward tracking
    table.boolean('reward_eligible').defaultTo(false);
    table.timestamp('reward_eligible_date').nullable(); // 30 days from referred_at
    table.boolean('reward_paid').defaultTo(false);
    table.bigInteger('reward_amount_wei').defaultTo(0);

    // Anti-fraud
    table.string('referee_ip_hash').nullable(); // Hashed IP for comparison
    table.boolean('flagged').defaultTo(false);
    table.string('flag_reason').nullable();

    table.timestamps(true, true);

    table.index('referrer_id');
    table.index('referee_id');
    table.index(['reward_eligible', 'reward_paid']);
    table.unique(['referrer_id', 'referee_id']);
  });

  // Daily activity tracking (for streak quests)
  await knex.schema.createTable('daily_activity', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('activity_date').notNullable();

    table.integer('games_played').defaultTo(0);
    table.integer('predictions_made').defaultTo(0);
    table.integer('time_spent_seconds').defaultTo(0);

    table.timestamp('first_activity').notNullable();
    table.timestamp('last_activity').notNullable();

    table.unique(['user_id', 'activity_date']);
    table.index('user_id');
    table.index('activity_date');
  });

  // Add quest-related fields to users table
  await knex.schema.alterTable('users', (table) => {
    table.integer('total_points').defaultTo(0);
    table.integer('current_streak_days').defaultTo(0);
    table.integer('longest_streak_days').defaultTo(0);
    table.date('last_active_date').nullable();
    table.integer('total_referrals').defaultTo(0);
    table.string('referral_code').unique().nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('total_points');
    table.dropColumn('current_streak_days');
    table.dropColumn('longest_streak_days');
    table.dropColumn('last_active_date');
    table.dropColumn('total_referrals');
    table.dropColumn('referral_code');
  });

  await knex.schema.dropTableIfExists('daily_activity');
  await knex.schema.dropTableIfExists('referrals');
  await knex.schema.dropTableIfExists('quest_reward_pool');
  await knex.schema.dropTableIfExists('user_quest_progress');
  await knex.schema.dropTableIfExists('user_quest_completions');
  await knex.schema.dropTableIfExists('quests');
}
