/**
 * Seed Influencer Metrics
 * Populates influencer_metrics table with realistic test data
 */

import db from '../utils/db';

async function seedMetrics() {
  console.log('🌱 Seeding influencer metrics...\n');

  try {
    // Get all influencers
    const influencers = await db('influencers').select('*');

    console.log(`Found ${influencers.length} influencers to seed\n`);

    for (const influencer of influencers) {
      // Generate realistic metrics based on tier
      let followerCount: number;
      let dailyTweets: number;
      let likesCount: number;
      let retweetsCount: number;
      let repliesCount: number;

      switch (influencer.tier) {
        case 'S':
          followerCount = Math.floor(Math.random() * 2000000) + 1000000; // 1M-3M
          dailyTweets = Math.floor(Math.random() * 10) + 5; // 5-15 tweets
          likesCount = Math.floor(Math.random() * 50000) + 20000; // 20k-70k
          retweetsCount = Math.floor(Math.random() * 10000) + 5000; // 5k-15k
          repliesCount = Math.floor(Math.random() * 5000) + 1000; // 1k-6k
          break;
        case 'A':
          followerCount = Math.floor(Math.random() * 800000) + 300000; // 300k-1.1M
          dailyTweets = Math.floor(Math.random() * 8) + 3; // 3-11 tweets
          likesCount = Math.floor(Math.random() * 30000) + 10000; // 10k-40k
          retweetsCount = Math.floor(Math.random() * 6000) + 2000; // 2k-8k
          repliesCount = Math.floor(Math.random() * 3000) + 500; // 500-3.5k
          break;
        case 'B':
          followerCount = Math.floor(Math.random() * 200000) + 100000; // 100k-300k
          dailyTweets = Math.floor(Math.random() * 6) + 2; // 2-8 tweets
          likesCount = Math.floor(Math.random() * 15000) + 5000; // 5k-20k
          retweetsCount = Math.floor(Math.random() * 3000) + 1000; // 1k-4k
          repliesCount = Math.floor(Math.random() * 1500) + 300; // 300-1.8k
          break;
        default: // C tier
          followerCount = Math.floor(Math.random() * 80000) + 20000; // 20k-100k
          dailyTweets = Math.floor(Math.random() * 5) + 1; // 1-6 tweets
          likesCount = Math.floor(Math.random() * 8000) + 2000; // 2k-10k
          retweetsCount = Math.floor(Math.random() * 1500) + 500; // 500-2k
          repliesCount = Math.floor(Math.random() * 800) + 200; // 200-1k
          break;
      }

      // Calculate engagement rate (2-5% typically)
      const totalEngagement = likesCount + retweetsCount + repliesCount;
      const engagementRate = (totalEngagement / followerCount) * 100;

      // Check if metrics already exist
      const existing = await db('influencer_metrics')
        .where({ influencer_id: influencer.id })
        .first();

      if (existing) {
        // Update existing metrics
        await db('influencer_metrics')
          .where({ influencer_id: influencer.id })
          .update({
            follower_count: followerCount,
            daily_tweets: dailyTweets,
            likes_count: likesCount,
            retweets_count: retweetsCount,
            replies_count: repliesCount,
            engagement_rate: parseFloat(engagementRate.toFixed(2)),
            scraped_at: new Date(),
          });
      } else {
        // Insert new metrics
        await db('influencer_metrics').insert({
          influencer_id: influencer.id,
          follower_count: followerCount,
          daily_tweets: dailyTweets,
          likes_count: likesCount,
          retweets_count: retweetsCount,
          replies_count: repliesCount,
          engagement_rate: parseFloat(engagementRate.toFixed(2)),
          scraped_at: new Date(),
        });
      }

      console.log(
        `✓ ${influencer.display_name.padEnd(25)} | Tier ${influencer.tier} | ${followerCount.toLocaleString().padStart(10)} followers | ${dailyTweets} tweets | ${engagementRate.toFixed(2)}% engagement`
      );
    }

    console.log(`\n✅ Successfully seeded metrics for ${influencers.length} influencers`);
  } catch (error) {
    console.error('❌ Error seeding metrics:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  seedMetrics()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seedMetrics;
