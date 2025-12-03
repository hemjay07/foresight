/**
 * Test Twitter API with Elon Musk
 * Verify we can get REAL follower count
 */

import twitterApiService from '../services/twitterApiService';

async function testElonUpdate() {
  console.log('🧪 Testing Twitter API with @elonmusk...\n');

  try {
    const user = await twitterApiService.getUserByUsername('elonmusk');

    if (!user) {
      console.error('❌ Could not fetch Elon Musk data');
      process.exit(1);
    }

    console.log('✅ Successfully fetched Elon Musk:');
    console.log(`   Username: @${user.username}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Followers: ${user.public_metrics.followers_count.toLocaleString()}`);
    console.log(`   Following: ${user.public_metrics.following_count.toLocaleString()}`);
    console.log(`   Tweets: ${user.public_metrics.tweet_count.toLocaleString()}`);

    const expected = 229300000;
    const actual = user.public_metrics.followers_count;
    const diff = Math.abs(expected - actual);
    const percentDiff = (diff / expected) * 100;

    if (percentDiff < 1) {
      console.log(`\n✅ Data is ACCURATE (within 1% of expected 229.3M)`);
    } else {
      console.log(`\n⚠️  Data differs from expected by ${percentDiff.toFixed(2)}%`);
      console.log(`   Expected: ${expected.toLocaleString()}`);
      console.log(`   Got: ${actual.toLocaleString()}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  }
}

testElonUpdate();
