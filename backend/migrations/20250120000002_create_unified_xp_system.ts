import type { Knex } from 'knex';

/**
 * Unified XP System
 * Tracks ALL user actions and rewards micro-dopamine hits
 */

export async function up(knex: Knex): Promise<void> {
  // 1. XP Action Types - Defines rewards for each action
  await knex.schema.createTable('xp_actions', (table) => {
    table.increments('id').primary();
    table.string('action_key').unique().notNullable(); // e.g., 'app_open', 'foresight_read'
    table.string('action_name').notNullable(); // Display name
    table.string('category').notNullable(); // 'engagement', 'skill', 'social', 'achievement'
    table.integer('xp_amount').notNullable(); // Base XP reward
    table.text('description').nullable();

    // Cooldown/limits
    table.integer('cooldown_minutes').defaultTo(0); // Min time between same action
    table.integer('max_per_day').nullable(); // Max times per day (null = unlimited)
    table.boolean('is_active').defaultTo(true);

    table.timestamps(true, true);
    table.index('action_key');
    table.index('category');
  });

  // 2. User XP Ledger - Every XP transaction
  await knex.schema.createTable('user_xp_ledger', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('action_id').unsigned().notNullable().references('id').inTable('xp_actions').onDelete('CASCADE');

    table.integer('xp_amount').notNullable(); // Actual XP earned (can have multipliers)
    table.integer('base_xp').notNullable(); // Base amount before multipliers
    table.decimal('multiplier', 5, 2).defaultTo(1.0); // Streak/bonus multipliers

    // Context
    table.string('source_type').nullable(); // 'foresight', 'whisperer', 'draft', etc.
    table.string('source_id').nullable(); // ID of the related entity
    table.json('metadata').nullable(); // Extra context data

    table.timestamp('earned_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('action_id');
    table.index('earned_at');
    table.index(['user_id', 'earned_at']);
  });

  // 3. User XP Totals - Aggregated XP per user
  await knex.schema.createTable('user_xp_totals', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');

    table.integer('total_xp').defaultTo(0).notNullable();
    table.integer('lifetime_xp').defaultTo(0).notNullable(); // Never decreases
    table.integer('current_level').defaultTo(1).notNullable();
    table.integer('xp_to_next_level').defaultTo(100).notNullable();

    // Breakdown by category
    table.integer('engagement_xp').defaultTo(0);
    table.integer('skill_xp').defaultTo(0);
    table.integer('social_xp').defaultTo(0);
    table.integer('achievement_xp').defaultTo(0);

    // Stats
    table.integer('actions_today').defaultTo(0);
    table.date('last_action_date').nullable();
    table.timestamp('last_xp_at').nullable();

    table.timestamps(true, true);

    table.index('total_xp');
    table.index('current_level');
    table.index('lifetime_xp');
  });

  // 4. Daily XP Summary (for analytics)
  await knex.schema.createTable('daily_xp_summary', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('summary_date').notNullable();

    table.integer('total_xp_earned').defaultTo(0);
    table.integer('actions_count').defaultTo(0);
    table.json('action_breakdown').nullable(); // { 'foresight_read': 2, 'whisperer_play': 5 }

    table.timestamps(true, true);

    table.unique(['user_id', 'summary_date']);
    table.index('summary_date');
  });

  // Seed initial XP actions
  await knex('xp_actions').insert([
    // Engagement (low XP, frequent)
    {
      action_key: 'app_open',
      action_name: 'Open App',
      category: 'engagement',
      xp_amount: 1,
      description: 'Daily app login',
      cooldown_minutes: 60,
      max_per_day: 10,
    },
    {
      action_key: 'foresight_read',
      action_name: 'Read Foresight Drop',
      category: 'engagement',
      xp_amount: 2,
      description: 'Read daily foresight drop',
      max_per_day: 1,
    },
    {
      action_key: 'profile_view',
      action_name: 'View Profile',
      category: 'engagement',
      xp_amount: 1,
      description: 'Check your stats',
      cooldown_minutes: 30,
    },

    // Skill (medium XP, game actions)
    {
      action_key: 'whisperer_play',
      action_name: 'Play CT Whisperer',
      category: 'skill',
      xp_amount: 3,
      description: 'Answer a whisperer question',
    },
    {
      action_key: 'whisperer_correct',
      action_name: 'Whisperer Correct Answer',
      category: 'skill',
      xp_amount: 7,
      description: 'Get whisperer question right',
    },
    {
      action_key: 'draft_set_team',
      action_name: 'Set Draft Team',
      category: 'skill',
      xp_amount: 5,
      description: 'Update your CT Draft team',
      max_per_day: 5,
    },
    {
      action_key: 'gauntlet_entry',
      action_name: 'Enter Daily Gauntlet',
      category: 'skill',
      xp_amount: 10,
      description: 'Participate in Daily Gauntlet',
      max_per_day: 1,
    },
    {
      action_key: 'arena_duel',
      action_name: 'Arena Duel',
      category: 'skill',
      xp_amount: 8,
      description: 'Complete an Arena duel',
    },

    // Achievement (high XP, rare)
    {
      action_key: 'gauntlet_perfect',
      action_name: 'Perfect Gauntlet Score',
      category: 'achievement',
      xp_amount: 50,
      description: 'Get 5/5 on Daily Gauntlet',
    },
    {
      action_key: 'streak_7_day',
      action_name: '7-Day Streak',
      category: 'achievement',
      xp_amount: 100,
      description: 'Maintain 7-day login streak',
    },
    {
      action_key: 'streak_30_day',
      action_name: '30-Day Streak',
      category: 'achievement',
      xp_amount: 500,
      description: 'Maintain 30-day login streak',
    },

    // Social (medium XP, growth)
    {
      action_key: 'share_stats',
      action_name: 'Share Stats',
      category: 'social',
      xp_amount: 5,
      description: 'Share your achievements',
      max_per_day: 3,
    },
    {
      action_key: 'refer_friend',
      action_name: 'Refer Friend',
      category: 'social',
      xp_amount: 25,
      description: 'Successful friend referral',
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('daily_xp_summary');
  await knex.schema.dropTableIfExists('user_xp_totals');
  await knex.schema.dropTableIfExists('user_xp_ledger');
  await knex.schema.dropTableIfExists('xp_actions');
}
