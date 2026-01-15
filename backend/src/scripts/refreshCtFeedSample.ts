/**
 * Refresh CT Feed Sample
 * Fetches tweets from a sample of influencers from each tier
 */
import db from '../utils/db';
import twitterApiIo from '../services/twitterApiIoService';
import { calculateEngagementScore } from '../services/ctFeedService';

async function refreshSample() {
  console.log('Fetching sample influencers from each tier...\n');

  // Get 3 from each tier (12 total)
  const influencers = await db('influencers')
    .where('is_active', true)
    .whereIn('tier', ['S', 'A', 'B', 'C'])
    .orderByRaw("CASE tier WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 ELSE 4 END")
    .limit(12)
    .select('id', 'twitter_handle', 'display_name', 'tier');

  console.log(`Found ${influencers.length} influencers to fetch\n`);

  let success = 0;
  let failed = 0;
  let tweetsStored = 0;

  for (const inf of influencers) {
    console.log(`Fetching @${inf.twitter_handle} (${inf.tier}-tier)...`);
    try {
      const result = await twitterApiIo.getUserTweets(inf.twitter_handle, 5, { influencerId: inf.id });

      if (!result.success || !result.data) {
        console.log(`  Failed: ${result.error}`);
        failed++;
        continue;
      }

      for (const tweet of result.data) {
        const score = calculateEngagementScore({
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          quotes: tweet.quotes,
          views: tweet.views,
          bookmarks: tweet.bookmarks,
        });

        await db('ct_tweets')
          .insert({
            tweet_id: tweet.id,
            influencer_id: inf.id,
            text: tweet.text,
            created_at: tweet.createdAt,
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
            quotes: tweet.quotes,
            views: tweet.views,
            bookmarks: tweet.bookmarks,
            engagement_score: score,
            is_reply: tweet.isReply,
            fetched_at: new Date(),
            updated_at: new Date(),
          })
          .onConflict('tweet_id')
          .merge({
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
            quotes: tweet.quotes,
            views: tweet.views,
            bookmarks: tweet.bookmarks,
            engagement_score: score,
            updated_at: new Date(),
          });

        tweetsStored++;
      }

      console.log(`  Stored ${result.data.length} tweets`);
      success++;

      // Rate limit - wait 1 second between influencers
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log(`  Error: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log('\n=== REFRESH COMPLETE ===');
  console.log(`Influencers: ${success} success, ${failed} failed`);
  console.log(`Tweets stored: ${tweetsStored}`);

  await db.destroy();
  process.exit(0);
}

refreshSample().catch(e => {
  console.error(e);
  process.exit(1);
});
