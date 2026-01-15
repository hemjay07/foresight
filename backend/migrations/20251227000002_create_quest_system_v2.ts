import type { Knex } from 'knex';

/**
 * Quest System V2
 *
 * Creates comprehensive quest tracking:
 * - quest_definitions: What quests exist
 * - user_quests: User progress on quests
 * - Daily/Weekly/Achievement categories
 */

export async function up(knex: Knex): Promise<void> {
  // 1. Quest definitions table
  await knex.schema.createTable('quest_definitions_v2', (table) => {
    table.string('id', 50).primary();                    // e.g., 'daily_login', 'weekly_contest_entry'
    table.string('name', 100).notNullable();
    table.text('description').nullable();

    // Type and category
    table.string('quest_type', 20).notNullable();        // 'onboarding', 'daily', 'weekly', 'achievement'
    table.string('category', 30).nullable();             // 'engagement', 'fantasy', 'social', etc.

    // Requirements
    table.integer('target').defaultTo(1);                // How many times to complete
    table.string('target_type', 30).nullable();          // 'count', 'streak', 'threshold'

    // Rewards
    table.integer('fs_reward').notNullable();            // Foresight Score reward
    table.integer('xp_reward').defaultTo(0);             // Legacy XP (optional)

    // Display
    table.string('icon', 50).nullable();                 // Icon name or emoji
    table.integer('display_order').defaultTo(0);

    // Status
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('quest_type');
    table.index('is_active');
  });

  // 2. User quest progress table
  await knex.schema.createTable('user_quests_v2', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('quest_id', 50).notNullable().references('id').inTable('quest_definitions_v2').onDelete('CASCADE');

    // Progress tracking
    table.integer('progress').defaultTo(0);              // Current progress
    table.integer('target').notNullable();               // Target to complete (copied from definition)

    // State
    table.boolean('is_completed').defaultTo(false);
    table.timestamp('completed_at').nullable();
    table.boolean('is_claimed').defaultTo(false);
    table.timestamp('claimed_at').nullable();

    // Reward tracking
    table.integer('fs_reward').notNullable();            // FS earned (copied from definition)
    table.integer('fs_earned').defaultTo(0);             // Actual FS earned (after multipliers)

    // Period tracking (for daily/weekly)
    table.string('period_type', 10).nullable();          // 'daily', 'weekly', 'monthly', null for one-time
    table.date('period_start').nullable();
    table.date('period_end').nullable();

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique constraint for one active quest per type per period
    table.unique(['user_id', 'quest_id', 'period_start']);

    // Indexes
    table.index('user_id');
    table.index('quest_id');
    table.index('is_completed');
    table.index('is_claimed');
    table.index(['user_id', 'is_completed']);
    table.index(['period_start', 'period_end']);
  });

  // 3. Seed quest definitions

  // Onboarding quests (one-time)
  await knex('quest_definitions_v2').insert([
    {
      id: 'onboard_connect_wallet',
      name: 'Connect Wallet',
      description: 'Connect your wallet to get started',
      quest_type: 'onboarding',
      category: 'engagement',
      target: 1,
      fs_reward: 50,
      icon: 'wallet',
      display_order: 1
    },
    {
      id: 'onboard_set_username',
      name: 'Set Username',
      description: 'Create your unique username',
      quest_type: 'onboarding',
      category: 'engagement',
      target: 1,
      fs_reward: 25,
      icon: 'user',
      display_order: 2
    },
    {
      id: 'onboard_create_team',
      name: 'Create Your Team',
      description: 'Draft your first fantasy team',
      quest_type: 'onboarding',
      category: 'fantasy',
      target: 1,
      fs_reward: 100,
      icon: 'users',
      display_order: 3
    },
    {
      id: 'onboard_enter_contest',
      name: 'Enter First Contest',
      description: 'Join your first competition',
      quest_type: 'onboarding',
      category: 'fantasy',
      target: 1,
      fs_reward: 100,
      icon: 'trophy',
      display_order: 4
    },
    {
      id: 'onboard_follow_twitter',
      name: 'Follow on Twitter',
      description: 'Follow us on Twitter for updates',
      quest_type: 'onboarding',
      category: 'social',
      target: 1,
      fs_reward: 100,
      icon: 'twitter',
      display_order: 5
    },
    {
      id: 'onboard_invite_friend',
      name: 'Invite a Friend',
      description: 'Share your referral link',
      quest_type: 'onboarding',
      category: 'social',
      target: 1,
      fs_reward: 200,
      icon: 'share',
      display_order: 6
    },
    {
      id: 'onboard_complete_all',
      name: 'Complete Onboarding',
      description: 'Finish all onboarding quests',
      quest_type: 'onboarding',
      category: 'achievement',
      target: 6,
      target_type: 'count',
      fs_reward: 500,
      icon: 'star',
      display_order: 7
    }
  ]);

  // Daily quests
  await knex('quest_definitions_v2').insert([
    {
      id: 'daily_login',
      name: 'Log In',
      description: 'Open the app today',
      quest_type: 'daily',
      category: 'engagement',
      target: 1,
      fs_reward: 10,
      icon: 'sun',
      display_order: 1
    },
    {
      id: 'daily_check_scores',
      name: 'Check Live Scores',
      description: 'View your team\'s performance',
      quest_type: 'daily',
      category: 'engagement',
      target: 1,
      fs_reward: 10,
      icon: 'chart',
      display_order: 2
    },
    {
      id: 'daily_browse_feed',
      name: 'Browse CT Feed',
      description: 'Spend 30 seconds on CT Feed',
      quest_type: 'daily',
      category: 'engagement',
      target: 1,
      fs_reward: 10,
      icon: 'newspaper',
      display_order: 3
    },
    {
      id: 'daily_prediction',
      name: 'Make Prediction',
      description: 'Submit a daily prediction',
      quest_type: 'daily',
      category: 'fantasy',
      target: 1,
      fs_reward: 25,
      icon: 'target',
      display_order: 4
    },
    {
      id: 'daily_share_take',
      name: 'Share a Take',
      description: 'Post your thoughts on CT Feed',
      quest_type: 'daily',
      category: 'social',
      target: 1,
      fs_reward: 20,
      icon: 'message',
      display_order: 5
    },
    {
      id: 'daily_complete_all',
      name: 'Daily Sweep',
      description: 'Complete all daily quests',
      quest_type: 'daily',
      category: 'achievement',
      target: 5,
      target_type: 'count',
      fs_reward: 25,
      icon: 'check-circle',
      display_order: 6
    }
  ]);

  // Weekly quests
  await knex('quest_definitions_v2').insert([
    {
      id: 'weekly_enter_contest',
      name: 'Enter a Contest',
      description: 'Join at least one contest this week',
      quest_type: 'weekly',
      category: 'fantasy',
      target: 1,
      fs_reward: 50,
      icon: 'trophy',
      display_order: 1
    },
    {
      id: 'weekly_top_50',
      name: 'Finish Top 50%',
      description: 'Place in the top half of any contest',
      quest_type: 'weekly',
      category: 'fantasy',
      target: 1,
      fs_reward: 100,
      icon: 'medal',
      display_order: 2
    },
    {
      id: 'weekly_top_10',
      name: 'Finish Top 10%',
      description: 'Place in the top 10% of any contest',
      quest_type: 'weekly',
      category: 'fantasy',
      target: 1,
      fs_reward: 250,
      icon: 'crown',
      display_order: 3
    },
    {
      id: 'weekly_tweet',
      name: 'Tweet About Us',
      description: 'Share CT Draft on Twitter',
      quest_type: 'weekly',
      category: 'social',
      target: 1,
      fs_reward: 50,
      icon: 'twitter',
      display_order: 4
    },
    {
      id: 'weekly_referral',
      name: 'Refer a Friend',
      description: 'Get a friend to sign up',
      quest_type: 'weekly',
      category: 'social',
      target: 1,
      fs_reward: 200,
      icon: 'users',
      display_order: 5
    },
    {
      id: 'weekly_complete_all',
      name: 'Weekly Champion',
      description: 'Complete all weekly quests',
      quest_type: 'weekly',
      category: 'achievement',
      target: 5,
      target_type: 'count',
      fs_reward: 100,
      icon: 'star',
      display_order: 6
    }
  ]);

  // Achievement quests (one-time milestones)
  await knex('quest_definitions_v2').insert([
    {
      id: 'achieve_first_win',
      name: 'First Blood',
      description: 'Win your first contest',
      quest_type: 'achievement',
      category: 'fantasy',
      target: 1,
      fs_reward: 500,
      icon: 'trophy',
      display_order: 1
    },
    {
      id: 'achieve_streak_7',
      name: 'Consistent',
      description: 'Maintain a 7-day login streak',
      quest_type: 'achievement',
      category: 'engagement',
      target: 7,
      target_type: 'streak',
      fs_reward: 200,
      icon: 'fire',
      display_order: 2
    },
    {
      id: 'achieve_streak_30',
      name: 'Ironman',
      description: 'Maintain a 30-day login streak',
      quest_type: 'achievement',
      category: 'engagement',
      target: 30,
      target_type: 'streak',
      fs_reward: 1000,
      icon: 'fire',
      display_order: 3
    },
    {
      id: 'achieve_refer_3',
      name: 'Networker',
      description: 'Refer 3 friends who enter contests',
      quest_type: 'achievement',
      category: 'social',
      target: 3,
      fs_reward: 300,
      icon: 'users',
      display_order: 4
    },
    {
      id: 'achieve_refer_10',
      name: 'Influencer',
      description: 'Refer 10 friends who enter contests',
      quest_type: 'achievement',
      category: 'social',
      target: 10,
      fs_reward: 1000,
      icon: 'megaphone',
      display_order: 5
    },
    {
      id: 'achieve_viral_pick',
      name: 'Whale Whisperer',
      description: 'Pick 10 influencers who go viral',
      quest_type: 'achievement',
      category: 'fantasy',
      target: 10,
      fs_reward: 500,
      icon: 'trending',
      display_order: 6
    },
    {
      id: 'achieve_oracle',
      name: 'Oracle',
      description: 'Get 5 daily predictions correct in a row',
      quest_type: 'achievement',
      category: 'fantasy',
      target: 5,
      target_type: 'streak',
      fs_reward: 250,
      icon: 'eye',
      display_order: 7
    },
    {
      id: 'achieve_diamond_hands',
      name: 'Diamond Hands',
      description: 'Keep the same team for an entire week',
      quest_type: 'achievement',
      category: 'fantasy',
      target: 1,
      fs_reward: 200,
      icon: 'diamond',
      display_order: 8
    },
    {
      id: 'achieve_champion',
      name: 'Champion',
      description: 'Win 5 contests',
      quest_type: 'achievement',
      category: 'fantasy',
      target: 5,
      fs_reward: 1000,
      icon: 'crown',
      display_order: 9
    },
    {
      id: 'achieve_legend',
      name: 'Legend',
      description: 'Win 20 contests',
      quest_type: 'achievement',
      category: 'fantasy',
      target: 20,
      fs_reward: 5000,
      icon: 'star',
      display_order: 10
    },
    {
      id: 'achieve_tier_gold',
      name: 'Gold Rush',
      description: 'Reach Gold tier',
      quest_type: 'achievement',
      category: 'progression',
      target: 5000,
      target_type: 'threshold',
      fs_reward: 1000,
      icon: 'medal',
      display_order: 11
    },
    {
      id: 'achieve_tier_diamond',
      name: 'Diamond Standard',
      description: 'Reach Diamond tier',
      quest_type: 'achievement',
      category: 'progression',
      target: 50000,
      target_type: 'threshold',
      fs_reward: 5000,
      icon: 'diamond',
      display_order: 12
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_quests_v2');
  await knex.schema.dropTableIfExists('quest_definitions_v2');
}
