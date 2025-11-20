import type { Knex } from 'knex';

/**
 * Unified Streak System
 * The MOST POWERFUL retention mechanism
 * Fear of losing streaks = daily logins
 */

export async function up(knex: Knex): Promise<void> {
  // 1. Streak Types - Define all trackable streaks
  await knex.schema.createTable('streak_types', (table) => {
    table.increments('id').primary();
    table.string('streak_key').unique().notNullable(); // e.g., 'daily_login', 'foresight_read'
    table.string('streak_name').notNullable();
    table.text('description').nullable();
    table.string('category').notNullable(); // 'engagement', 'skill', 'social'

    // XP multiplier bonuses
    table.json('milestone_multipliers').nullable(); // { 7: 1.5, 30: 2.0, 100: 3.0 }

    // Display
    table.string('emoji').defaultTo('🔥');
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);

    table.timestamps(true, true);
    table.index('streak_key');
  });

  // 2. User Streaks - Track ALL user streaks
  await knex.schema.createTable('user_streaks', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('streak_type_id').unsigned().notNullable().references('id').inTable('streak_types').onDelete('CASCADE');

    // Streak data
    table.integer('current_streak').defaultTo(0).notNullable();
    table.integer('best_streak').defaultTo(0).notNullable();
    table.date('last_activity_date').nullable();
    table.timestamp('last_activity_at').nullable();

    // Freeze system
    table.integer('freezes_available').defaultTo(1).comment('Saves from breaking streak (1 per month)');
    table.date('last_freeze_used').nullable();
    table.boolean('is_frozen').defaultTo(false);
    table.date('freeze_expires').nullable();

    // Stats
    table.integer('total_days_active').defaultTo(0).comment('Lifetime total');
    table.integer('times_broken').defaultTo(0);
    table.date('streak_started_date').nullable();

    // Multipliers
    table.decimal('current_multiplier', 5, 2).defaultTo(1.0);

    table.timestamps(true, true);

    table.unique(['user_id', 'streak_type_id']);
    table.index('user_id');
    table.index('current_streak');
    table.index('last_activity_date');
  });

  // 3. Streak Milestones - Track when users hit milestones
  await knex.schema.createTable('streak_milestones', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('streak_type_id').unsigned().notNullable().references('id').inTable('streak_types').onDelete('CASCADE');

    table.integer('milestone_days').notNullable(); // 7, 30, 100, etc.
    table.timestamp('achieved_at').defaultTo(knex.fn.now());
    table.boolean('reward_claimed').defaultTo(false);
    table.integer('xp_awarded').defaultTo(0);

    table.unique(['user_id', 'streak_type_id', 'milestone_days']);
    table.index(['user_id', 'streak_type_id']);
  });

  // 4. Streak Activity Log (for verification/analytics)
  await knex.schema.createTable('streak_activity_log', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('streak_type_id').unsigned().notNullable().references('id').inTable('streak_types').onDelete('CASCADE');

    table.date('activity_date').notNullable();
    table.timestamp('activity_at').defaultTo(knex.fn.now());
    table.boolean('counted_for_streak').defaultTo(true);
    table.string('action_type').nullable(); // What specific action triggered it

    table.unique(['user_id', 'streak_type_id', 'activity_date']);
    table.index(['user_id', 'activity_date']);
  });

  // Seed initial streak types
  await knex('streak_types').insert([
    {
      streak_key: 'daily_login',
      streak_name: 'Daily Login',
      category: 'engagement',
      description: 'Log in every day',
      milestone_multipliers: JSON.stringify({ 7: 1.2, 30: 1.5, 100: 2.0 }),
      emoji: '🔥',
      display_order: 1,
    },
    {
      streak_key: 'foresight_read',
      streak_name: 'Foresight Reader',
      category: 'engagement',
      description: 'Read daily foresight drops',
      milestone_multipliers: JSON.stringify({ 7: 1.3, 30: 1.7, 100: 2.5 }),
      emoji: '👁️',
      display_order: 2,
    },
    {
      streak_key: 'whisperer_play',
      streak_name: 'CT Whisperer',
      category: 'skill',
      description: 'Play CT Whisperer daily',
      milestone_multipliers: JSON.stringify({ 7: 1.3, 30: 1.8, 100: 3.0 }),
      emoji: '🧠',
      display_order: 3,
    },
    {
      streak_key: 'draft_update',
      streak_name: 'Draft Manager',
      category: 'skill',
      description: 'Update your Draft team daily',
      milestone_multipliers: JSON.stringify({ 7: 1.2, 30: 1.6, 100: 2.5 }),
      emoji: '🏆',
      display_order: 4,
    },
    {
      streak_key: 'active_player',
      streak_name: 'Active Player',
      category: 'engagement',
      description: 'Do ANY action daily',
      milestone_multipliers: JSON.stringify({ 7: 1.5, 30: 2.0, 100: 3.5 }),
      emoji: '⚡',
      display_order: 0,
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('streak_activity_log');
  await knex.schema.dropTableIfExists('streak_milestones');
  await knex.schema.dropTableIfExists('user_streaks');
  await knex.schema.dropTableIfExists('streak_types');
}
