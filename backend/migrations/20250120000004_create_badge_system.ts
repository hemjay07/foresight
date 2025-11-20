import type { Knex } from 'knex';

/**
 * Badge & Achievement System
 * Visual identity layer - makes users collectors
 */

export async function up(knex: Knex): Promise<void> {
  // 1. Badges - All available badges
  await knex.schema.createTable('badges', (table) => {
    table.increments('id').primary();
    table.string('badge_key').unique().notNullable(); // e.g., 'streak_7_day'
    table.string('badge_name').notNullable();
    table.text('description').notNullable();
    table.string('category').notNullable(); // 'streak', 'xp', 'achievement', 'social', 'seasonal'

    // Visual
    table.string('emoji').notNullable();
    table.string('color').notNullable(); // hex color for background
    table.string('rarity').notNullable(); // 'common', 'uncommon', 'rare', 'epic', 'legendary'

    // Earning criteria
    table.json('requirements').nullable(); // { type: 'streak_days', value: 7 }
    table.boolean('is_secret').defaultTo(false); // Hidden until earned
    table.boolean('is_limited').defaultTo(false); // Limited quantity
    table.integer('max_earners').nullable(); // Max users who can earn (for limited badges)
    table.integer('current_earners').defaultTo(0);

    // Rewards
    table.integer('xp_reward').defaultTo(0);

    // Display
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);

    table.timestamps(true, true);
    table.index('badge_key');
    table.index('category');
    table.index('rarity');
  });

  // 2. User Badges - Earned badges
  await knex.schema.createTable('user_badges', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('badge_id').unsigned().notNullable().references('id').inTable('badges').onDelete('CASCADE');

    table.timestamp('earned_at').defaultTo(knex.fn.now());
    table.boolean('is_showcased').defaultTo(false); // Pin to profile
    table.integer('showcase_order').nullable(); // Order in showcase
    table.boolean('is_new').defaultTo(true); // Show "NEW!" indicator
    table.timestamp('viewed_at').nullable(); // When user saw the badge

    table.unique(['user_id', 'badge_id']);
    table.index('user_id');
    table.index('badge_id');
    table.index('earned_at');
    table.index(['user_id', 'is_showcased']);
  });

  // Seed initial badges
  await knex('badges').insert([
    // === STREAK BADGES ===
    {
      badge_key: 'streak_first_day',
      badge_name: 'First Steps',
      description: 'Started your first streak',
      category: 'streak',
      emoji: '🔥',
      color: '#FF6B35',
      rarity: 'common',
      requirements: JSON.stringify({ type: 'any_streak', value: 1 }),
      xp_reward: 10,
      display_order: 1,
    },
    {
      badge_key: 'streak_7_day',
      badge_name: 'Week Warrior',
      description: 'Maintained a 7-day streak',
      category: 'streak',
      emoji: '🔥',
      color: '#FF8C42',
      rarity: 'uncommon',
      requirements: JSON.stringify({ type: 'any_streak', value: 7 }),
      xp_reward: 50,
      display_order: 2,
    },
    {
      badge_key: 'streak_30_day',
      badge_name: 'Monthly Master',
      description: 'Maintained a 30-day streak',
      category: 'streak',
      emoji: '🔥',
      color: '#FFA500',
      rarity: 'rare',
      requirements: JSON.stringify({ type: 'any_streak', value: 30 }),
      xp_reward: 200,
      display_order: 3,
    },
    {
      badge_key: 'streak_100_day',
      badge_name: 'Century Club',
      description: 'Maintained a 100-day streak',
      category: 'streak',
      emoji: '🔥',
      color: '#FFD700',
      rarity: 'epic',
      requirements: JSON.stringify({ type: 'any_streak', value: 100 }),
      xp_reward: 1000,
      display_order: 4,
    },
    {
      badge_key: 'streak_365_day',
      badge_name: 'Year Legend',
      description: 'Maintained a 365-day streak',
      category: 'streak',
      emoji: '🔥',
      color: '#FF0000',
      rarity: 'legendary',
      requirements: JSON.stringify({ type: 'any_streak', value: 365 }),
      xp_reward: 5000,
      display_order: 5,
    },

    // === XP LEVEL BADGES ===
    {
      badge_key: 'level_5',
      badge_name: 'Rising Star',
      description: 'Reached Level 5',
      category: 'xp',
      emoji: '⭐',
      color: '#4A90E2',
      rarity: 'common',
      requirements: JSON.stringify({ type: 'level', value: 5 }),
      xp_reward: 25,
      display_order: 10,
    },
    {
      badge_key: 'level_10',
      badge_name: 'Skilled Player',
      description: 'Reached Level 10',
      category: 'xp',
      emoji: '⭐',
      color: '#5B9BD5',
      rarity: 'uncommon',
      requirements: JSON.stringify({ type: 'level', value: 10 }),
      xp_reward: 50,
      display_order: 11,
    },
    {
      badge_key: 'level_25',
      badge_name: 'Elite Member',
      description: 'Reached Level 25',
      category: 'xp',
      emoji: '⭐',
      color: '#7030A0',
      rarity: 'rare',
      requirements: JSON.stringify({ type: 'level', value: 25 }),
      xp_reward: 250,
      display_order: 12,
    },
    {
      badge_key: 'level_50',
      badge_name: 'Master',
      description: 'Reached Level 50',
      category: 'xp',
      emoji: '⭐',
      color: '#C55A11',
      rarity: 'epic',
      requirements: JSON.stringify({ type: 'level', value: 50 }),
      xp_reward: 1000,
      display_order: 13,
    },
    {
      badge_key: 'level_100',
      badge_name: 'Grand Master',
      description: 'Reached Level 100',
      category: 'xp',
      emoji: '⭐',
      color: '#FF00FF',
      rarity: 'legendary',
      requirements: JSON.stringify({ type: 'level', value: 100 }),
      xp_reward: 5000,
      display_order: 14,
    },

    // === FIRST-TIME ACHIEVEMENTS ===
    {
      badge_key: 'first_foresight',
      badge_name: 'Foresight Initiate',
      description: 'Read your first daily foresight drop',
      category: 'achievement',
      emoji: '👁️',
      color: '#00CED1',
      rarity: 'common',
      requirements: JSON.stringify({ type: 'action_count', action: 'foresight_read', value: 1 }),
      xp_reward: 10,
      display_order: 20,
    },
    {
      badge_key: 'foresight_devotee',
      badge_name: 'Foresight Devotee',
      description: 'Read 100 foresight drops',
      category: 'achievement',
      emoji: '👁️',
      color: '#00BFFF',
      rarity: 'rare',
      requirements: JSON.stringify({ type: 'action_count', action: 'foresight_read', value: 100 }),
      xp_reward: 500,
      display_order: 21,
    },
    {
      badge_key: 'first_whisperer',
      badge_name: 'CT Apprentice',
      description: 'Played your first CT Whisperer',
      category: 'achievement',
      emoji: '🧠',
      color: '#9370DB',
      rarity: 'common',
      requirements: JSON.stringify({ type: 'action_count', action: 'whisperer_play', value: 1 }),
      xp_reward: 10,
      display_order: 22,
    },
    {
      badge_key: 'whisperer_master',
      badge_name: 'CT Oracle',
      description: 'Answered 100 whisperer questions correctly',
      category: 'achievement',
      emoji: '🧠',
      color: '#8A2BE2',
      rarity: 'epic',
      requirements: JSON.stringify({ type: 'action_count', action: 'whisperer_correct', value: 100 }),
      xp_reward: 1000,
      display_order: 23,
    },

    // === SOCIAL BADGES ===
    {
      badge_key: 'social_butterfly',
      badge_name: 'Social Butterfly',
      description: 'Shared your stats 10 times',
      category: 'social',
      emoji: '🦋',
      color: '#FF69B4',
      rarity: 'uncommon',
      requirements: JSON.stringify({ type: 'action_count', action: 'share_stats', value: 10 }),
      xp_reward: 100,
      display_order: 30,
    },
    {
      badge_key: 'recruiter',
      badge_name: 'Recruiter',
      description: 'Referred 5 active friends',
      category: 'social',
      emoji: '🤝',
      color: '#32CD32',
      rarity: 'rare',
      requirements: JSON.stringify({ type: 'action_count', action: 'refer_friend', value: 5 }),
      xp_reward: 500,
      display_order: 31,
    },

    // === SPECIAL/SEASONAL ===
    {
      badge_key: 'early_adopter',
      badge_name: 'Early Adopter',
      description: 'Joined during the first month',
      category: 'seasonal',
      emoji: '🎖️',
      color: '#FFD700',
      rarity: 'legendary',
      requirements: JSON.stringify({ type: 'special', value: 'early_adopter' }),
      xp_reward: 1000,
      is_limited: true,
      display_order: 40,
    },
    {
      badge_key: 'season_1_participant',
      badge_name: 'Season 1 Veteran',
      description: 'Participated in Season 1',
      category: 'seasonal',
      emoji: '🏆',
      color: '#C0C0C0',
      rarity: 'rare',
      requirements: JSON.stringify({ type: 'special', value: 'season_1' }),
      xp_reward: 250,
      display_order: 41,
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_badges');
  await knex.schema.dropTableIfExists('badges');
}
