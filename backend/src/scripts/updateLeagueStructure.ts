/**
 * Update league structure for flexible prizes and monthly duration
 */

import db from '../utils/db';

async function updateStructure() {
  try {
    console.log('Updating league structure...');

    // 1. Add prize distribution column
    await db.raw(`
      ALTER TABLE private_leagues
      ADD COLUMN IF NOT EXISTS prize_distribution VARCHAR(50) DEFAULT 'winner_takes_all'
        CHECK (prize_distribution IN ('winner_takes_all', 'top_3', 'top_5'));

      ALTER TABLE private_leagues
      ADD COLUMN IF NOT EXISTS duration VARCHAR(50) DEFAULT 'monthly'
        CHECK (duration IN ('weekly', 'monthly', 'season'));
    `);
    console.log('✓ Added prize_distribution and duration columns');

    // 2. Update fantasy_contests for monthly duration
    await db.raw(`
      ALTER TABLE fantasy_contests
      ADD COLUMN IF NOT EXISTS duration VARCHAR(50) DEFAULT 'monthly';
    `);
    console.log('✓ Updated fantasy_contests table');

    // 3. Create monthly contest (delete old weekly one)
    await db.raw(`DELETE FROM fantasy_contests WHERE contest_key = 'week_1';`);

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    await db('fantasy_contests').insert({
      contest_key: `month_${today.getMonth() + 1}_${today.getFullYear()}`,
      start_date: startOfMonth,
      end_date: endOfMonth,
      status: 'active',
      duration: 'monthly',
      total_participants: 0,
      max_participants: 10000,
    });
    console.log('✓ Created monthly contest');

    console.log('\n✅ League structure updated!');
    console.log('\nPrize Distribution Options:');
    console.log('  - winner_takes_all: 85% to 1st place');
    console.log('  - top_3: 1st: 50%, 2nd: 30%, 3rd: 20%');
    console.log('  - top_5: 1st: 40%, 2nd: 25%, 3rd: 20%, 4th: 10%, 5th: 5%');
    console.log('\nDuration: Monthly (30 days)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStructure();
