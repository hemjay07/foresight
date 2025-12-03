import db from '../utils/db';

async function checkCurrentData() {
  console.log('📊 Current Influencer Data Status\n');
  console.log('='.repeat(70));

  const influencers = await db('influencers')
    .where({ is_active: true })
    .select('display_name', 'twitter_handle', 'follower_count', 'last_scraped_at')
    .orderBy('follower_count', 'desc');

  let withData = 0;
  let withoutData = 0;
  let recentData = 0;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  console.log('\n🏆 ALL 50 Influencers (Sorted by Followers):\n');
  influencers.forEach((inf, i) => {
    const followers = inf.follower_count?.toLocaleString() || 'NO DATA';
    const isRecent = inf.last_scraped_at && new Date(inf.last_scraped_at) > oneDayAgo;
    const indicator = isRecent ? '🟢' : (inf.follower_count ? '🟡' : '🔴');
    console.log(`${(i+1).toString().padStart(2)}. ${indicator} ${inf.display_name.padEnd(25)} @${inf.twitter_handle.padEnd(20)} ${followers.padStart(15)}`);

    if (inf.follower_count) {
      withData++;
      if (isRecent) recentData++;
    } else {
      withoutData++;
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n📈 Data Status:`);
  console.log(`   🟢 Fresh (<24h): ${recentData}/${influencers.length}`);
  console.log(`   🟡 Has data (older): ${withData - recentData}/${influencers.length}`);
  console.log(`   🔴 No data: ${withoutData}/${influencers.length}`);
  console.log(`   ✅ Total with data: ${withData}/${influencers.length} (${((withData/influencers.length)*100).toFixed(1)}%)`);

  console.log('\n📊 Legend:');
  console.log('   🟢 = Updated within last 24 hours');
  console.log('   🟡 = Has data but older than 24 hours');
  console.log('   🔴 = No follower data');

  process.exit(0);
}

checkCurrentData();
