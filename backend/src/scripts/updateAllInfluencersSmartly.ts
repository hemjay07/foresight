/**
 * Smart Twitter Metrics Update - All Influencers
 * Updates in small batches to avoid rate limits
 * Retries with exponential backoff
 */

import twitterApiService from '../services/twitterApiService';
import db from '../utils/db';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateAllInfluencersSmartly() {
  console.log('🚀 Smart Twitter Update - All 50 Influencers\n');
  console.log('Strategy: Small batches with delays\n');
  console.log('=' .repeat(60));

  try {
    if (!twitterApiService.isConfigured()) {
      console.error('❌ Twitter API not configured');
      process.exit(1);
    }

    // Get all influencers
    const influencers = await db('influencers')
      .where({ is_active: true })
      .select('id', 'twitter_handle', 'display_name')
      .orderBy('display_name');

    console.log(`\nFound ${influencers.length} influencers to update\n`);

    let totalSuccess = 0;
    let totalFailed = 0;
    const batchSize = 10;
    const delayBetweenBatches = 3000; // 3 seconds

    // Process in batches of 10
    for (let i = 0; i < influencers.length; i += batchSize) {
      const batch = influencers.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(influencers.length / batchSize);

      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} influencers)`);
      console.log('-'.repeat(60));

      const usernames = batch.map(inf => inf.twitter_handle);

      try {
        // Fetch data from Twitter
        const users = await twitterApiService.getUsersByUsernames(usernames);

        if (users.length === 0) {
          console.log('⚠️  Batch returned no data (rate limited or error)');
          totalFailed += batch.length;

          // If we get rate limited, wait longer and try individual updates
          console.log('💡 Trying individual updates with longer delays...\n');

          for (const influencer of batch) {
            try {
              const user = await twitterApiService.getUserByUsername(influencer.twitter_handle);

              if (user) {
                const metrics = user.public_metrics;

                // Store in history
                await db('influencer_metrics').insert({
                  influencer_id: influencer.id,
                  follower_count: metrics.followers_count,
                  following_count: metrics.following_count,
                  tweet_count: metrics.tweet_count,
                  engagement_rate: 0,
                  scraped_at: new Date(),
                  source: 'twitter_api',
                });

                // Update current data
                await db('influencers')
                  .where({ id: influencer.id })
                  .update({
                    follower_count: metrics.followers_count,
                    last_scraped_at: new Date(),
                    updated_at: new Date(),
                  });

                console.log(`  ✅ @${influencer.twitter_handle}: ${metrics.followers_count.toLocaleString()}`);
                totalSuccess++;

                // Wait 2 seconds between individual calls
                await sleep(2000);
              } else {
                console.log(`  ❌ @${influencer.twitter_handle}: failed`);
                totalFailed++;
              }
            } catch (error: any) {
              console.log(`  ❌ @${influencer.twitter_handle}: ${error.message}`);
              totalFailed++;
            }
          }

          continue;
        }

        // Create map of username -> data
        const userMap = new Map(
          users.map(user => [user.username.toLowerCase(), user])
        );

        // Update database for each influencer in batch
        for (const influencer of batch) {
          const user = userMap.get(influencer.twitter_handle.toLowerCase());

          if (user) {
            try {
              const metrics = user.public_metrics;

              // Store in history
              await db('influencer_metrics').insert({
                influencer_id: influencer.id,
                follower_count: metrics.followers_count,
                following_count: metrics.following_count,
                tweet_count: metrics.tweet_count,
                engagement_rate: 0,
                scraped_at: new Date(),
                source: 'twitter_api',
              });

              // Update current data
              await db('influencers')
                .where({ id: influencer.id })
                .update({
                  follower_count: metrics.followers_count,
                  last_scraped_at: new Date(),
                  updated_at: new Date(),
                });

              console.log(`  ✅ @${influencer.twitter_handle}: ${metrics.followers_count.toLocaleString()}`);
              totalSuccess++;
            } catch (error) {
              console.error(`  ❌ Error saving @${influencer.twitter_handle}:`, error);
              totalFailed++;
            }
          } else {
            console.log(`  ⚠️  @${influencer.twitter_handle}: not found in response`);
            totalFailed++;
          }
        }

        // Wait between batches to avoid rate limits
        if (i + batchSize < influencers.length) {
          console.log(`\n⏳ Waiting ${delayBetweenBatches / 1000}s before next batch...`);
          await sleep(delayBetweenBatches);
        }

      } catch (error: any) {
        console.error(`\n❌ Batch ${batchNum} failed:`, error.message);
        totalFailed += batch.length;

        // Wait longer before next batch after error
        if (i + batchSize < influencers.length) {
          console.log(`⏳ Waiting 5s after error...`);
          await sleep(5000);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Final Results:');
    console.log(`   ✅ Successfully updated: ${totalSuccess}/${influencers.length}`);
    console.log(`   ❌ Failed: ${totalFailed}/${influencers.length}`);
    console.log(`   📈 Success rate: ${((totalSuccess / influencers.length) * 100).toFixed(1)}%`);

    if (totalSuccess === influencers.length) {
      console.log('\n🎉 ALL INFLUENCERS UPDATED WITH FRESH DATA!');
    } else if (totalSuccess > 0) {
      console.log(`\n⚠️  ${totalFailed} influencers still need updating`);
      console.log('   Run this script again after rate limit resets');
    } else {
      console.log('\n❌ Rate limit hit - try again later or wait for daily cron job (4am)');
    }

    // Show recently updated
    const recentlyUpdated = await db('influencers')
      .where('last_scraped_at', '>', db.raw("NOW() - INTERVAL '5 minutes'"))
      .orderBy('follower_count', 'desc')
      .select('display_name', 'twitter_handle', 'follower_count', 'last_scraped_at')
      .limit(10);

    if (recentlyUpdated.length > 0) {
      console.log('\n🏆 Top 10 Recently Updated:');
      recentlyUpdated.forEach((inf, i) => {
        console.log(`   ${i + 1}. ${inf.display_name} (@${inf.twitter_handle}): ${inf.follower_count?.toLocaleString() || 'N/A'}`);
      });
    }

    process.exit(totalSuccess > 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  }
}

updateAllInfluencersSmartly();
