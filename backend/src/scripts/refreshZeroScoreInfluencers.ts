/**
 * Refresh influencers with zero scores
 */

import db from '../utils/db';

const API_KEY = process.env.TWITTER_API_IO_KEY;

const handles = ['rovercrc', 'nic__carter', 'beast_ico', 'LightCrypto', 'looloompapa', 'CryptoMessiah', 'Cryptotoad1'];

async function refreshInfluencer(handle: string) {
  try {
    // Fetch tweets
    const tweetsRes = await fetch(`https://api.twitterapi.io/twitter/user/timeline?userName=${handle}&count=20`, {
      headers: { 'X-API-Key': API_KEY! }
    });
    const tweetsData = await tweetsRes.json() as { data?: { tweets?: any[] } };

    if (!tweetsData.data?.tweets?.length) {
      console.log(`❌ @${handle} - No tweets found`);
      return;
    }

    const tweets = tweetsData.data.tweets;
    let totalLikes = 0, totalRTs = 0, totalReplies = 0;

    for (const t of tweets) {
      totalLikes += t.likeCount || 0;
      totalRTs += t.retweetCount || 0;
      totalReplies += t.replyCount || 0;
    }

    const avgLikes = totalLikes / tweets.length;
    const activityScore = Math.min(35, tweets.length * 1.5);
    const engagementScore = Math.min(60, Math.sqrt(avgLikes) * 1.5);
    const totalScore = Math.round(activityScore + engagementScore);

    // Update database - handle case insensitive
    await db('influencers')
      .whereRaw('LOWER(twitter_handle) = LOWER(?)', [handle])
      .update({
        total_points: totalScore,
        form_score: Math.min(100, totalScore + 30),
        last_scraped_at: db.fn.now()
      });

    console.log(`✓ @${handle} | ${tweets.length} tweets | ${Math.round(avgLikes)} avg likes | Score: ${totalScore}`);
  } catch (e: any) {
    console.log(`❌ @${handle} - Error: ${e.message}`);
  }
}

async function main() {
  console.log(`Refreshing ${handles.length} influencers with zero scores...`);
  console.log('');

  for (const h of handles) {
    await refreshInfluencer(h);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('');
  console.log('Done!');
  process.exit(0);
}

main();
