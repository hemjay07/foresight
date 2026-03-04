/**
 * Refresh All Influencers
 * Fetches latest Twitter data for all active influencers and updates the database.
 *
 * Connects to whichever database DATABASE_URL points to (local or production).
 *
 * Usage:
 *   NODE_OPTIONS='--import tsx' npx tsx src/scripts/refreshAllInfluencers.ts
 */

import db, { closeConnection } from "../utils/db";
import * as twitterApi from "../services/twitterApiIoService";

async function refreshAllInfluencers() {
  console.log("\n=== REFRESHING ALL INFLUENCERS ===\n");
  console.log(twitterApi.getConfigInfo());

  if (!twitterApi.isConfigured()) {
    console.error("ERROR: Twitter API IO not configured");
    process.exit(1);
  }

  // Get all active influencers
  const influencers = await db("influencers")
    .where("is_active", true)
    .orderByRaw("CASE tier WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 ELSE 4 END")
    .select("id", "display_name", "twitter_handle", "tier");

  console.log(`Found ${influencers.length} active influencers\n`);

  let success = 0,
    failed = 0;
  const results: Array<{
    handle: string;
    tier: string;
    followers: number;
    avgLikes: number;
    score: number;
  }> = [];

  for (let i = 0; i < influencers.length; i++) {
    const inf = influencers[i];
    console.log(`[${i + 1}/${influencers.length}] Fetching @${inf.twitter_handle}...`);

    try {
      const { profile, tweets } = await twitterApi.getInfluencerData(inf.twitter_handle, {
        influencerId: inf.id,
      });

      if (!profile.success || !profile.data) {
        console.log(`  ❌ Profile fetch failed: ${profile.error}`);
        failed++;
        continue;
      }

      const tweetData = tweets.data || [];
      const tweetsAnalyzed = tweetData.length;

      // Calculate metrics
      let totalLikes = 0,
        totalRTs = 0;

      for (const t of tweetData) {
        totalLikes += t.likes || 0;
        totalRTs += t.retweets || 0;
      }

      const avgLikesPerTweet = tweetsAnalyzed > 0 ? totalLikes / tweetsAnalyzed : 0;
      const engagementRate =
        profile.data.followers > 0
          ? ((totalLikes + totalRTs) / (profile.data.followers * Math.max(1, tweetsAnalyzed))) * 100
          : 0;

      // Update influencer basic info
      await db("influencers").where("id", inf.id).update({
        follower_count: profile.data.followers,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        daily_tweets: Math.round(tweetsAnalyzed / 7),
        updated_at: new Date(),
      });

      // Calculate score
      const activityScore = Math.min(35, tweetsAnalyzed * 1.5);
      const engagementScore = Math.min(60, Math.sqrt(avgLikesPerTweet) * 1.5);
      const totalScore = Math.round(activityScore + engagementScore);

      await db("influencers").where("id", inf.id).update({
        total_points: totalScore,
        form_score: Math.min(100, totalScore + 30),
      });

      results.push({
        handle: inf.twitter_handle,
        tier: inf.tier,
        followers: profile.data.followers,
        avgLikes: Math.round(avgLikesPerTweet),
        score: totalScore,
      });

      console.log(
        `  ✅ ${profile.data.followers.toLocaleString()} followers | ${tweetsAnalyzed} tweets | ${Math.round(avgLikesPerTweet).toLocaleString()} avg likes | Score: ${totalScore}`
      );
      success++;
    } catch (err) {
      console.log(`  ❌ Error: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log("\n=== REFRESH COMPLETE ===");
  console.log(`Success: ${success} | Failed: ${failed}\n`);

  // Summary by tier
  for (const tier of ["S", "A", "B", "C"]) {
    const tierResults = results.filter((r) => r.tier === tier);
    if (tierResults.length > 0) {
      console.log(`\n${tier}-TIER (${tierResults.length}):`);
      tierResults.forEach((r) =>
        console.log(
          `  @${r.handle}: ${r.followers.toLocaleString()} followers | ${r.avgLikes.toLocaleString()} avg likes | Score: ${r.score}`
        )
      );
    }
  }

  await closeConnection();
}

refreshAllInfluencers().catch((e) => {
  console.error(e);
  process.exit(1);
});
