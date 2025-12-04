/**
 * Cleanup CT Whisperer - Remove All Traces
 * This was part of the old Timecaster multi-game project
 * Foresight is ONLY CT Draft (fantasy league), not Whisperer
 */

import db from '../utils/db';

async function cleanupWhisperer() {
  console.log('🧹 Removing all CT Whisperer traces from Foresight...\n');

  try {
    // Drop all Whisperer tables
    console.log('📊 Dropping Whisperer database tables...');

    await db.schema.dropTableIfExists('whisperer_user_answers');
    console.log('   ✅ Dropped whisperer_user_answers');

    await db.schema.dropTableIfExists('whisperer_daily_challenges');
    console.log('   ✅ Dropped whisperer_daily_challenges');

    await db.schema.dropTableIfExists('whisperer_user_stats');
    console.log('   ✅ Dropped whisperer_user_stats');

    await db.schema.dropTableIfExists('whisperer_questions');
    console.log('   ✅ Dropped whisperer_questions');

    console.log('\n✨ Database cleanup complete!');
    console.log('\n⚠️  Next steps (manual):');
    console.log('   1. Delete Whisperer migration files');
    console.log('   2. Delete Whisperer seed files');
    console.log('   3. Delete Whisperer documentation');
    console.log('   4. Remove Whisperer code references');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupWhisperer();
