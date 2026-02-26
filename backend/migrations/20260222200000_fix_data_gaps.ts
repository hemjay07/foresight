/**
 * Fix Data Gaps Migration
 *
 * 1. Set avatar_url for the 49 original influencers that are missing it
 * 2. Seed foresight_scores for the 15 demo users (so FS leaderboard isn't empty)
 * 3. Add tapestry_user_id + avatar_url to the 15 demo users
 */
import { Knex } from 'knex';

// The 15 demo users from seed_demo_entries migration
const DEMO_WALLETS = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
  '0x5555555555555555555555555555555555555555',
  '0x6666666666666666666666666666666666666666',
  '0x7777777777777777777777777777777777777777',
  '0x8888888888888888888888888888888888888888',
  '0x9999999999999999999999999999999999999999',
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  '0xcccccccccccccccccccccccccccccccccccccccc',
  '0xdddddddddddddddddddddddddddddddddddddd',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0xffffffffffffffffffffffffffffffffffff0001',
];

// Realistic FS leaderboard scores — varied tiers to make it interesting
const DEMO_FS_SCORES = [
  { total: 2850, season: 1200, week: 380, referral: 150, tier: 'gold', fantasy: 1800, engagement: 500, social: 350, achievement: 200 },
  { total: 2400, season: 980, week: 310, referral: 120, tier: 'gold', fantasy: 1500, engagement: 420, social: 300, achievement: 180 },
  { total: 2100, season: 850, week: 270, referral: 90, tier: 'silver', fantasy: 1300, engagement: 380, social: 260, achievement: 160 },
  { total: 1850, season: 720, week: 240, referral: 80, tier: 'silver', fantasy: 1100, engagement: 350, social: 240, achievement: 160 },
  { total: 1620, season: 650, week: 210, referral: 70, tier: 'silver', fantasy: 980, engagement: 300, social: 200, achievement: 140 },
  { total: 1400, season: 560, week: 180, referral: 60, tier: 'bronze', fantasy: 850, engagement: 260, social: 170, achievement: 120 },
  { total: 1200, season: 480, week: 160, referral: 50, tier: 'bronze', fantasy: 720, engagement: 230, social: 150, achievement: 100 },
  { total: 1050, season: 420, week: 140, referral: 40, tier: 'bronze', fantasy: 630, engagement: 200, social: 130, achievement: 90 },
  { total: 920, season: 370, week: 120, referral: 35, tier: 'bronze', fantasy: 550, engagement: 180, social: 110, achievement: 80 },
  { total: 780, season: 310, week: 100, referral: 30, tier: 'bronze', fantasy: 470, engagement: 150, social: 90, achievement: 70 },
  { total: 650, season: 260, week: 85, referral: 25, tier: 'bronze', fantasy: 390, engagement: 130, social: 75, achievement: 55 },
  { total: 520, season: 210, week: 70, referral: 20, tier: 'bronze', fantasy: 310, engagement: 100, social: 65, achievement: 45 },
  { total: 410, season: 170, week: 55, referral: 15, tier: 'bronze', fantasy: 250, engagement: 80, social: 50, achievement: 30 },
  { total: 310, season: 130, week: 40, referral: 10, tier: 'bronze', fantasy: 190, engagement: 60, social: 35, achievement: 25 },
  { total: 200, season: 80, week: 25, referral: 5, tier: 'bronze', fantasy: 120, engagement: 40, social: 25, achievement: 15 },
];

// Avatar URLs for demo users — crypto-themed robot/identicon avatars
const DEMO_AVATARS = [
  'https://api.dicebear.com/7.x/identicon/svg?seed=SolanaWhale',
  'https://api.dicebear.com/7.x/identicon/svg?seed=DeFi_Degen',
  'https://api.dicebear.com/7.x/identicon/svg?seed=AlphaHunter',
  'https://api.dicebear.com/7.x/identicon/svg?seed=CT_Maxi',
  'https://api.dicebear.com/7.x/identicon/svg?seed=GigaBrain',
  'https://api.dicebear.com/7.x/identicon/svg?seed=NFT_Flipper',
  'https://api.dicebear.com/7.x/identicon/svg?seed=OnChainAnon',
  'https://api.dicebear.com/7.x/identicon/svg?seed=MevBot_Chad',
  'https://api.dicebear.com/7.x/identicon/svg?seed=YieldFarmer',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Ser_Ngmi',
  'https://api.dicebear.com/7.x/identicon/svg?seed=ApeDegen',
  'https://api.dicebear.com/7.x/identicon/svg?seed=ChartMaster',
  'https://api.dicebear.com/7.x/identicon/svg?seed=DiamondHand',
  'https://api.dicebear.com/7.x/identicon/svg?seed=RektProof',
  'https://api.dicebear.com/7.x/identicon/svg?seed=TokenSniper',
];

export async function up(knex: Knex): Promise<void> {
  const now = new Date();

  // ─── Fix 1: Set avatar_url for influencers missing it ────────────────
  await knex.raw(`
    UPDATE influencers
    SET avatar_url = 'https://unavatar.io/twitter/' || twitter_handle,
        updated_at = NOW()
    WHERE avatar_url IS NULL
  `);
  console.log('Fixed influencer avatar URLs');

  // ─── Fix 2: Add tapestry_user_id + avatar_url to demo users ─────────
  for (let i = 0; i < DEMO_WALLETS.length; i++) {
    // Update tapestry info (always safe to overwrite)
    await knex('users')
      .where('wallet_address', DEMO_WALLETS[i])
      .update({
        tapestry_user_id: `demo_tapestry_${i + 1}`,
        avatar_url: DEMO_AVATARS[i],
        is_founding_member: true,
      });
    // Only set founding_member_number if not already set (trigger may have set it)
    await knex('users')
      .where('wallet_address', DEMO_WALLETS[i])
      .whereNull('founding_member_number')
      .update({ founding_member_number: i + 2 });
  }
  console.log('Updated demo users with tapestry IDs and avatars');

  // ─── Fix 3: Seed foresight_scores for demo users ────────────────────
  const demoUsers = await knex('users')
    .whereIn('wallet_address', DEMO_WALLETS)
    .select('id', 'wallet_address');

  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    const score = DEMO_FS_SCORES[i];
    if (!user || !score) continue;

    // Check if FS record already exists
    const existing = await knex('foresight_scores').where('user_id', user.id).first();
    if (existing) continue;

    await knex('foresight_scores').insert({
      user_id: user.id,
      total_score: score.total,
      season_score: score.season,
      week_score: score.week,
      referral_score: score.referral,
      tier: score.tier,
      tier_multiplier: score.tier === 'gold' ? 1.5 : score.tier === 'silver' ? 1.25 : 1.0,
      fantasy_score: score.fantasy,
      engagement_score: score.engagement,
      social_score: score.social,
      achievement_score: score.achievement,
      all_time_rank: i + 1,
      season_rank: i + 1,
      week_rank: i + 1,
      current_season: '2026-02',
      current_week: 8,
      last_earned_at: new Date(now.getTime() - Math.random() * 86400000 * 3), // Random within last 3 days
      created_at: now,
      updated_at: now,
    });
  }
  console.log(`Seeded ${demoUsers.length} foresight_scores entries`);
}

export async function down(knex: Knex): Promise<void> {
  // Remove FS scores for demo users
  const demoUsers = await knex('users')
    .whereIn('wallet_address', DEMO_WALLETS)
    .select('id');

  const ids = demoUsers.map(u => u.id);
  if (ids.length > 0) {
    await knex('foresight_scores').whereIn('user_id', ids).del();
  }

  // Clear tapestry IDs and avatars from demo users
  await knex('users')
    .whereIn('wallet_address', DEMO_WALLETS)
    .update({
      tapestry_user_id: null,
      avatar_url: null,
    });

  // Clear avatar_url for original influencers
  await knex('influencers')
    .where('id', '<=', 49)
    .update({ avatar_url: null });
}
