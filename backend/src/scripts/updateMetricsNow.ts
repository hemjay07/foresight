/**
 * Manual Twitter Metrics Update
 * Run this to immediately update influencer metrics
 */

import twitterApiService from '../services/twitterApiService';
import db from '../utils/db';

async function updateMetricsNow() {
  console.log('🔄 Starting manual metrics update...\n');

  try {
    if (!twitterApiService.isConfigured()) {
      console.error('❌ Twitter API not configured');
      process.exit(1);
    }

    console.log('✅ Twitter API configured');
    console.log('📊 Fetching influencers...\n');

    const influencers = await db('influencers')
      .where({ is_active: true })
      .select('id', 'twitter_handle', 'display_name')
      .limit(10); // Test with 10 first

    console.log(`Found ${influencers.length} influencers to update\n`);

    for (const inf of influencers) {
      console.log(`Updating @${inf.twitter_handle}...`);
    }

    console.log('\n🚀 Calling batchUpdateInfluencers with ALL 50 influencers...\n');
    await twitterApiService.batchUpdateInfluencers(50);

    console.log('\n✅ All influencers updated!');

    // Show updated data
    const updated = await db('influencer_metrics')
      .where('scraped_at', '>', db.raw("NOW() - INTERVAL '5 minutes'"))
      .count('* as count');

    console.log(`📊 ${updated[0].count} influencers updated in last 5 minutes`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  }
}

updateMetricsNow();
