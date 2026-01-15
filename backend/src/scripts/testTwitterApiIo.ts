/**
 * TwitterAPI.io Test Script
 *
 * This script tests whether TwitterAPI.io can provide the data we need
 * for our fantasy league scoring system.
 *
 * WHAT WE NEED TO VERIFY:
 * 1. Can we get user profile data (follower count, following, tweet count)?
 * 2. Can we get recent tweets with engagement (likes, RTs, replies, views)?
 * 3. What does the data actually look like?
 * 4. How much does it cost per request?
 * 5. Can we calculate our scoring formula from this data?
 *
 * BEFORE RUNNING:
 * 1. Sign up at https://twitterapi.io (get $1 free credit)
 * 2. Get your API key
 * 3. Set it as environment variable: export TWITTER_API_IO_KEY=your_key
 *
 * RUN WITH:
 * npx tsx src/scripts/testTwitterApiIo.ts
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = 'https://api.twitterapi.io';
const API_KEY = process.env.TWITTER_API_IO_KEY || '';

// Test subjects - known active accounts
// Using just 1 for initial test to save credits and time
const TEST_HANDLES = [
  'VitalikButerin',  // Ethereum founder - very active
  // 'cz_binance',      // CZ - crypto figure (uncomment to test more)
  // 'saylor',          // Michael Saylor - Bitcoin maxi (uncomment to test more)
];

interface ProfileResponse {
  id: string;
  userName: string;
  name: string;
  followers: number;
  following: number;
  statusesCount: number;
  verified: boolean;
  profileImageUrl: string;
  description: string;
  createdAt: string;
  [key: string]: unknown;
}

interface TweetResponse {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
  bookmarkCount: number;
  [key: string]: unknown;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: string;
}

// Helpers
function log(message: string) {
  console.log(message);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
}

function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

function logData(label: string, value: unknown) {
  console.log(`   ${label}: ${JSON.stringify(value)}`);
}

// API Functions
async function getUserProfile(username: string): Promise<ProfileResponse | null> {
  try {
    log(`   Calling: GET ${API_BASE_URL}/twitter/user/info?userName=${username}`);
    const response = await axios.get(`${API_BASE_URL}/twitter/user/info`, {
      headers: {
        'X-API-Key': API_KEY,
      },
      params: {
        userName: username,
      },
    });
    log(`   Response status: ${response.status}`);
    // API returns { data: {...}, status: "success" }
    return response.data?.data || response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`API Error for @${username}:`, error.response?.status, error.response?.data || error.message);
    }
    return null;
  }
}

async function getUserTweets(username: string, count: number = 10): Promise<TweetResponse[]> {
  try {
    log(`   Calling: GET ${API_BASE_URL}/twitter/user/last_tweets?userName=${username}`);
    const response = await axios.get(`${API_BASE_URL}/twitter/user/last_tweets`, {
      headers: {
        'X-API-Key': API_KEY,
      },
      params: {
        userName: username,
      },
    });
    log(`   Response status: ${response.status}`);
    // API returns { tweets: [...], has_next_page: bool, status: "success" }
    const tweets = response.data?.tweets || response.data?.data || [];
    // Return only the requested count
    return tweets.slice(0, count);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`API Error for @${username} tweets:`, error.response?.status, error.response?.data || error.message);
    }
    return [];
  }
}

// Calculate scoring data from API responses
function calculateScoringData(profile: ProfileResponse, tweets: TweetResponse[]) {
  // Follower data
  const followerCount = profile.followers || 0;

  // Tweet activity (number of tweets we got)
  const tweetCount = tweets.length;

  // Engagement totals
  let totalLikes = 0;
  let totalRetweets = 0;
  let totalReplies = 0;
  let totalViews = 0;
  let totalQuotes = 0;

  for (const tweet of tweets) {
    totalLikes += tweet.likeCount || 0;
    totalRetweets += tweet.retweetCount || 0;
    totalReplies += tweet.replyCount || 0;
    totalViews += tweet.viewCount || 0;
    totalQuotes += tweet.quoteCount || 0;
  }

  // Calculate engagement rate
  const totalEngagement = totalLikes + totalRetweets + totalReplies + totalQuotes;
  const engagementRate = followerCount > 0
    ? (totalEngagement / tweetCount / followerCount) * 100
    : 0;

  return {
    followerCount,
    tweetCount,
    totalLikes,
    totalRetweets,
    totalReplies,
    totalViews,
    totalQuotes,
    totalEngagement,
    engagementRate: Math.round(engagementRate * 100) / 100,
    avgLikesPerTweet: Math.round(totalLikes / tweetCount),
    avgViewsPerTweet: Math.round(totalViews / tweetCount),
  };
}

// Calculate fantasy score using our formula
function calculateFantasyScore(
  basePrice: number,
  scoringData: ReturnType<typeof calculateScoringData>
) {
  // Base score from tier pricing
  const baseScore = basePrice;

  // Follower bonus: 5 points per million followers
  const followerBonus = (scoringData.followerCount / 1_000_000) * 5;

  // Tweet activity bonus: 2 points per tweet
  const tweetBonus = scoringData.tweetCount * 2;

  // Engagement bonus: 0.01 points per interaction
  const engagementBonus = scoringData.totalEngagement * 0.01;

  // Engagement rate multiplier (1.0 to 2.0x)
  const engagementMultiplier = 1 + (scoringData.engagementRate / 100);

  // Calculate total
  const rawScore = baseScore + followerBonus + tweetBonus + engagementBonus;
  const totalScore = rawScore * Math.min(engagementMultiplier, 2); // Cap at 2x

  return {
    baseScore,
    followerBonus: Math.round(followerBonus * 100) / 100,
    tweetBonus,
    engagementBonus: Math.round(engagementBonus * 100) / 100,
    engagementMultiplier: Math.round(engagementMultiplier * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
  };
}

// Main test function
async function runTests() {
  logSection('TwitterAPI.io Integration Test');

  // Check API key
  if (!API_KEY) {
    logError('TWITTER_API_IO_KEY environment variable not set!');
    log('\nTo run this test:');
    log('1. Sign up at https://twitterapi.io (get $1 free credit)');
    log('2. Get your API key from the dashboard');
    log('3. Run: export TWITTER_API_IO_KEY=your_key_here');
    log('4. Run: npx tsx src/scripts/testTwitterApiIo.ts');
    process.exit(1);
  }

  logSuccess('API key found');
  log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);

  // Track results
  const results: {
    handle: string;
    profileSuccess: boolean;
    tweetsSuccess: boolean;
    profile?: ProfileResponse;
    tweets?: TweetResponse[];
    scoringData?: ReturnType<typeof calculateScoringData>;
    fantasyScore?: ReturnType<typeof calculateFantasyScore>;
  }[] = [];

  // Test each handle
  for (const handle of TEST_HANDLES) {
    logSection(`Testing @${handle}`);

    const result: typeof results[0] = {
      handle,
      profileSuccess: false,
      tweetsSuccess: false,
    };

    // Test 1: Get profile
    log('\n📋 TEST 1: Fetching user profile...');
    const profile = await getUserProfile(handle);

    if (profile) {
      result.profileSuccess = true;
      result.profile = profile;
      logSuccess('Profile fetched successfully!');
      log('\nProfile data received:');
      logData('ID', profile.id);
      logData('Username', profile.userName);
      logData('Name', profile.name);
      logData('Followers', profile.followers?.toLocaleString());
      logData('Following', profile.following?.toLocaleString());
      logData('Tweet Count', profile.statusesCount?.toLocaleString());
      logData('Verified', profile.verified);
      logData('Created At', profile.createdAt);

      // Show raw response for debugging
      log('\n📦 Raw profile response (first 500 chars):');
      log(JSON.stringify(profile, null, 2).substring(0, 500) + '...');
    } else {
      logError('Failed to fetch profile');
    }

    // Wait before tweets request (rate limit)
    log('\n⏳ Waiting 6 seconds before tweets request (rate limit)...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Test 2: Get tweets
    log('\n📋 TEST 2: Fetching recent tweets...');
    const tweets = await getUserTweets(handle, 10);

    if (tweets && tweets.length > 0) {
      result.tweetsSuccess = true;
      result.tweets = tweets;
      logSuccess(`Fetched ${tweets.length} tweets!`);

      // Show first tweet details
      const firstTweet = tweets[0];
      log('\nFirst tweet data:');
      logData('ID', firstTweet.id);
      logData('Text', (firstTweet.text || '').substring(0, 100) + '...');
      logData('Created At', firstTweet.createdAt);
      logData('Likes', firstTweet.likeCount?.toLocaleString());
      logData('Retweets', firstTweet.retweetCount?.toLocaleString());
      logData('Replies', firstTweet.replyCount?.toLocaleString());
      logData('Quotes', firstTweet.quoteCount?.toLocaleString());
      logData('Views', firstTweet.viewCount?.toLocaleString());
      logData('Bookmarks', firstTweet.bookmarkCount?.toLocaleString());

      // Show raw response for debugging
      log('\n📦 Raw first tweet (first 500 chars):');
      log(JSON.stringify(firstTweet, null, 2).substring(0, 500) + '...');
    } else {
      logError('Failed to fetch tweets or no tweets returned');
      log(`Response was: ${JSON.stringify(tweets)}`);
    }

    // Test 3: Calculate scoring data
    if (result.profileSuccess && result.tweetsSuccess && profile && tweets.length > 0) {
      log('\n📋 TEST 3: Calculating scoring data...');

      const scoringData = calculateScoringData(profile, tweets);
      result.scoringData = scoringData;

      logSuccess('Scoring data calculated!');
      log('\nScoring metrics:');
      logData('Follower Count', scoringData.followerCount.toLocaleString());
      logData('Tweets Analyzed', scoringData.tweetCount);
      logData('Total Likes', scoringData.totalLikes.toLocaleString());
      logData('Total Retweets', scoringData.totalRetweets.toLocaleString());
      logData('Total Replies', scoringData.totalReplies.toLocaleString());
      logData('Total Views', scoringData.totalViews.toLocaleString());
      logData('Total Engagement', scoringData.totalEngagement.toLocaleString());
      logData('Engagement Rate', `${scoringData.engagementRate}%`);
      logData('Avg Likes/Tweet', scoringData.avgLikesPerTweet.toLocaleString());
      logData('Avg Views/Tweet', scoringData.avgViewsPerTweet.toLocaleString());

      // Test 4: Calculate fantasy score
      log('\n📋 TEST 4: Calculating fantasy score (assuming S-tier, base_price=28)...');

      const fantasyScore = calculateFantasyScore(28, scoringData);
      result.fantasyScore = fantasyScore;

      logSuccess('Fantasy score calculated!');
      log('\nScore breakdown:');
      logData('Base Score (tier)', fantasyScore.baseScore);
      logData('Follower Bonus', `+${fantasyScore.followerBonus}`);
      logData('Tweet Bonus', `+${fantasyScore.tweetBonus}`);
      logData('Engagement Bonus', `+${fantasyScore.engagementBonus}`);
      logData('Engagement Multiplier', `×${fantasyScore.engagementMultiplier}`);
      logData('TOTAL SCORE', fantasyScore.totalScore);
    }

    results.push(result);

    // Delay between users (free tier = 1 request per 5 seconds)
    log('\n⏳ Waiting 6 seconds before next user (rate limit)...');
    await new Promise(resolve => setTimeout(resolve, 6000));
  }

  // Summary
  logSection('TEST SUMMARY');

  const profileSuccesses = results.filter(r => r.profileSuccess).length;
  const tweetsSuccesses = results.filter(r => r.tweetsSuccess).length;

  log(`\nProfile endpoint: ${profileSuccesses}/${results.length} successful`);
  log(`Tweets endpoint: ${tweetsSuccesses}/${results.length} successful`);

  // Data availability check
  logSection('DATA AVAILABILITY FOR SCORING');

  const requiredFields = [
    { field: 'Follower Count', available: results.some(r => r.profile?.followers !== undefined) },
    { field: 'Tweet Count (profile)', available: results.some(r => r.profile?.statusesCount !== undefined) },
    { field: 'Like Count (tweets)', available: results.some(r => r.tweets?.[0]?.likeCount !== undefined) },
    { field: 'Retweet Count', available: results.some(r => r.tweets?.[0]?.retweetCount !== undefined) },
    { field: 'Reply Count', available: results.some(r => r.tweets?.[0]?.replyCount !== undefined) },
    { field: 'View Count', available: results.some(r => r.tweets?.[0]?.viewCount !== undefined) },
    { field: 'Quote Count', available: results.some(r => r.tweets?.[0]?.quoteCount !== undefined) },
    { field: 'Tweet Created At', available: results.some(r => r.tweets?.[0]?.createdAt !== undefined) },
  ];

  for (const { field, available } of requiredFields) {
    if (available) {
      logSuccess(`${field}: AVAILABLE`);
    } else {
      logError(`${field}: NOT AVAILABLE`);
    }
  }

  // Cost estimation
  logSection('COST ESTIMATION');

  log(`
Based on TwitterAPI.io pricing:
- User profiles: $0.18 per 1,000 requests
- User tweets: $0.15 per 1,000 tweets (charged per tweet returned)

For your use case (50 influencers, weekly scoring):

OPTION A: Weekly snapshots (start + end of week)
  - 50 profiles × 2 = 100 profile requests = $0.018
  - 50 influencers × 10 tweets × 2 = 1,000 tweets = $0.15
  - Weekly total: ~$0.17
  - Monthly total: ~$0.70
  - Yearly total: ~$8.50

OPTION B: Daily updates
  - 50 profiles × 7 = 350 profile requests = $0.063
  - 50 influencers × 10 tweets × 7 = 3,500 tweets = $0.525
  - Weekly total: ~$0.59
  - Monthly total: ~$2.36
  - Yearly total: ~$28.30

Free credit ($1) covers: ~5-6 weeks of Option A, or ~1.5 weeks of Option B
`);

  // Final verdict
  logSection('VERDICT');

  const allProfilesWork = profileSuccesses === results.length;
  const allTweetsWork = tweetsSuccesses === results.length;
  const allFieldsAvailable = requiredFields.every(f => f.available);

  if (allProfilesWork && allTweetsWork && allFieldsAvailable) {
    logSuccess('ALL TESTS PASSED!');
    log('\nTwitterAPI.io provides ALL the data needed for your scoring formula:');
    log('- Follower counts for growth tracking');
    log('- Tweet timestamps to count weekly activity');
    log('- Full engagement data (likes, RTs, replies, views)');
    log('- Calculated engagement rate');
    log('\nRecommendation: PROCEED with TwitterAPI.io integration');
  } else {
    logWarning('SOME TESTS FAILED');
    log('\nIssues found:');
    if (!allProfilesWork) log('- Profile endpoint not fully working');
    if (!allTweetsWork) log('- Tweets endpoint not fully working');
    if (!allFieldsAvailable) log('- Some required fields missing');
    log('\nRecommendation: Investigate issues before proceeding');
  }

  log('\n');
}

// Run the tests
runTests().catch(console.error);
