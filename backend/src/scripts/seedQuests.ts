import db from '../utils/db';

async function seedQuests() {
  console.log('Seeding quest definitions...\n');

  try {
    // Clear existing quests
    await db('quests').del();
    console.log('🗑️  Cleared existing quests\n');

    // Insert quest definitions
    const quests = [
      // ========================================
      // TIER 1: BEGINNER QUESTS (Points Only)
      // ========================================
      {
        quest_id: 'first_login',
        name: 'First Login',
        description: 'Connect your wallet and join Foresight',
        category: 'beginner',
        points_reward: 50,
        eth_reward_wei: 0,
        eth_reward_enabled: false,
        requirements: JSON.stringify({ type: 'login', value: 1 }),
        min_reputation: 0,
        min_account_age_days: 0,
        min_wallet_age_days: 0,
        min_games_played: 0,
        max_completions_per_user: 1,
        max_total_completions: null,
        cooldown_hours: 0,
        active: true,
      },
      {
        quest_id: 'first_draft',
        name: 'First Draft',
        description: 'Draft your first CT Fantasy team',
        category: 'beginner',
        points_reward: 100,
        eth_reward_wei: 0,
        eth_reward_enabled: false,
        requirements: JSON.stringify({ type: 'draft_created', value: 1 }),
        min_reputation: 0,
        min_account_age_days: 0,
        min_wallet_age_days: 0,
        min_games_played: 0,
        max_completions_per_user: 1,
        max_total_completions: null,
        cooldown_hours: 0,
        active: true,
      },
      {
        quest_id: 'first_vote',
        name: 'First Vote',
        description: 'Cast your first vote on CT takes',
        category: 'beginner',
        points_reward: 50,
        eth_reward_wei: 0,
        eth_reward_enabled: false,
        requirements: JSON.stringify({ type: 'vote_cast', value: 1 }),
        min_reputation: 0,
        min_account_age_days: 0,
        min_wallet_age_days: 0,
        min_games_played: 0,
        max_completions_per_user: 1,
        max_total_completions: null,
        cooldown_hours: 0,
        active: true,
      },

      // ========================================
      // TIER 2: INTERMEDIATE QUESTS (Small ETH Rewards)
      // ========================================
      {
        quest_id: 'daily_login_7',
        name: '7-Day Login Streak',
        description: 'Log in for 7 consecutive days',
        category: 'intermediate',
        points_reward: 100,
        eth_reward_wei: 1000000000000000, // 0.001 ETH
        eth_reward_enabled: true,
        requirements: JSON.stringify({ type: 'login_streak', value: 7 }),
        min_reputation: 0,
        min_account_age_days: 7,
        min_wallet_age_days: 7,
        min_games_played: 3,
        max_completions_per_user: null,
        max_total_completions: null,
        cooldown_hours: 168, // 7 days
        active: true,
      },
      {
        quest_id: 'weekly_draft_streak',
        name: 'Weekly Draft Streak',
        description: 'Draft a team for 4 consecutive weeks',
        category: 'intermediate',
        points_reward: 200,
        eth_reward_wei: 5000000000000000, // 0.005 ETH
        eth_reward_enabled: true,
        requirements: JSON.stringify({ type: 'draft_streak', value: 4 }),
        min_reputation: 50,
        min_account_age_days: 7,
        min_wallet_age_days: 7,
        min_games_played: 3,
        max_completions_per_user: null,
        max_total_completions: null,
        cooldown_hours: 168,
        active: true,
      },
      {
        quest_id: 'top_100_score',
        name: 'Top 100 Finish',
        description: 'Finish in the top 100 of weekly fantasy league',
        category: 'intermediate',
        points_reward: 150,
        eth_reward_wei: 3000000000000000, // 0.003 ETH
        eth_reward_enabled: true,
        requirements: JSON.stringify({ type: 'weekly_rank', max_rank: 100 }),
        min_reputation: 50,
        min_account_age_days: 7,
        min_wallet_age_days: 7,
        min_games_played: 5,
        max_completions_per_user: null,
        max_total_completions: null,
        cooldown_hours: 168,
        active: true,
      },

      // ========================================
      // TIER 3: ADVANCED QUESTS (Larger ETH Rewards)
      // ========================================
      {
        quest_id: 'reputation_500',
        name: 'Reputation Milestone: 500',
        description: 'Reach 500 reputation points',
        category: 'advanced',
        points_reward: 0,
        eth_reward_wei: 20000000000000000, // 0.02 ETH
        eth_reward_enabled: true,
        requirements: JSON.stringify({ type: 'reputation', value: 500 }),
        min_reputation: 500,
        min_account_age_days: 14,
        min_wallet_age_days: 14,
        min_games_played: 20,
        max_completions_per_user: 1,
        max_total_completions: 200,
        cooldown_hours: 0,
        active: true,
      },
      {
        quest_id: 'top_10_finish',
        name: 'Top 10 Finish',
        description: 'Finish in the top 10 of weekly fantasy league',
        category: 'advanced',
        points_reward: 400,
        eth_reward_wei: 30000000000000000, // 0.03 ETH
        eth_reward_enabled: true,
        requirements: JSON.stringify({ type: 'weekly_rank', max_rank: 10 }),
        min_reputation: 300,
        min_account_age_days: 14,
        min_wallet_age_days: 14,
        min_games_played: 20,
        max_completions_per_user: null,
        max_total_completions: 100,
        cooldown_hours: 168,
        active: true,
      },

      // ========================================
      // TIER 4: REFERRAL QUESTS (Anti-Sybil)
      // ========================================
      {
        quest_id: 'refer_friend',
        name: 'Refer a Friend',
        description: 'Refer 1 active friend who drafts a team',
        category: 'referral',
        points_reward: 200,
        eth_reward_wei: 10000000000000000, // 0.01 ETH
        eth_reward_enabled: true,
        requirements: JSON.stringify({
          type: 'referral',
          referee_min_games: 3,
          referee_min_deposit_wei: '50000000000000000', // 0.05 ETH
          waiting_period_days: 30,
        }),
        min_reputation: 100,
        min_account_age_days: 30,
        min_wallet_age_days: 30,
        min_games_played: 10,
        max_completions_per_user: 10, // Max 10 referrals per user
        max_total_completions: 500,
        cooldown_hours: 168,
        active: true,
      },
    ];

    const inserted = await db('quests').insert(quests);
    console.log(`✅ Inserted ${quests.length} quest definitions\n`);

    // Display summary
    console.log('📊 Quest Summary:');
    console.log(`   - Tier 1 (Beginner): 3 quests (points only)`);
    console.log(`   - Tier 2 (Intermediate): 3 quests (0.001-0.005 ETH)`);
    console.log(`   - Tier 3 (Advanced): 2 quests (0.02-0.03 ETH)`);
    console.log(`   - Tier 4 (Referral): 1 quest (0.01 ETH)`);
    console.log(`\n✨ Total: ${quests.length} CT Fantasy quests seeded successfully!`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedQuests();
