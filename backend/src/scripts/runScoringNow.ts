/**
 * Manual Scoring Trigger
 * Run this to immediately calculate scores
 */

import { runFantasyScoringCycle } from '../services/fantasyScoringService';
import db from '../utils/db';

async function runScoringNow() {
  console.log('🏆 Running scoring cycle manually...\n');

  try {
    await runFantasyScoringCycle();

    console.log('\n✅ Scoring complete!');

    // Check results
    const influencersWithPoints = await db('influencers')
      .where('total_points', '>', 0)
      .count('* as count');

    console.log(`\n📊 Influencers with points: ${influencersWithPoints[0].count}`);

    const topInfluencers = await db('influencers')
      .where('total_points', '>', 0)
      .orderBy('total_points', 'desc')
      .limit(5)
      .select('display_name', 'total_points');

    if (topInfluencers.length > 0) {
      console.log('\n🏆 Top 5 Influencers:');
      topInfluencers.forEach((inf, i) => {
        console.log(`  ${i+1}. ${inf.display_name}: ${inf.total_points} pts`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Scoring failed:', error);
    process.exit(1);
  }
}

runScoringNow();
