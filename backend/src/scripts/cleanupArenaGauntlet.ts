/**
 * Cleanup Arena & Gauntlet Modes - Remove All Traces
 * These were part of the old Timecaster multi-game project
 * Foresight is ONLY CT Draft (fantasy league), not Arena battles or Gauntlet predictions
 */

import db from '../utils/db';

async function cleanupArenaGauntlet() {
  console.log('🧹 Removing all Arena & Gauntlet traces from Foresight...\n');

  try {
    // Drop all Arena tables
    console.log('📊 Dropping Arena database tables...');

    await db.schema.dropTableIfExists('arena_leaderboard');
    console.log('   ✅ Dropped arena_leaderboard');

    await db.schema.dropTableIfExists('arena_results');
    console.log('   ✅ Dropped arena_results');

    await db.schema.dropTableIfExists('arena_votes');
    console.log('   ✅ Dropped arena_votes');

    await db.schema.dropTableIfExists('arena_duels');
    console.log('   ✅ Dropped arena_duels');

    console.log('\n📊 Dropping Gauntlet database tables...');

    // Drop all Gauntlet tables
    await db.schema.dropTableIfExists('gauntlet_leaderboard');
    console.log('   ✅ Dropped gauntlet_leaderboard');

    await db.schema.dropTableIfExists('gauntlet_results');
    console.log('   ✅ Dropped gauntlet_results');

    await db.schema.dropTableIfExists('gauntlet_entries');
    console.log('   ✅ Dropped gauntlet_entries');

    await db.schema.dropTableIfExists('gauntlet_predictions');
    console.log('   ✅ Dropped gauntlet_predictions');

    await db.schema.dropTableIfExists('gauntlet_days');
    console.log('   ✅ Dropped gauntlet_days');

    console.log('\n✨ Database cleanup complete!');
    console.log('\n⚠️  Next steps (manual):');
    console.log('   1. Delete Arena migration file: migrations/20250115000003_create_arena_tables.ts');
    console.log('   2. Delete Gauntlet migration file: migrations/20250115000004_create_gauntlet_tables.ts');
    console.log('   3. Delete Arena components: frontend/src/components/arena/');
    console.log('   4. Delete Gauntlet components: frontend/src/components/gauntlet/');
    console.log('   5. Delete Arena contract hooks: frontend/src/contracts/hooks/useTimecasterArena.ts');
    console.log('   6. Delete Gauntlet contract hooks: frontend/src/contracts/hooks/useDailyGauntlet.ts');
    console.log('   7. Update seedQuests.ts to remove Arena/Gauntlet quests');
    console.log('   8. Remove contract ABIs: TimecasterArena.json, DailyGauntlet.json');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupArenaGauntlet();
