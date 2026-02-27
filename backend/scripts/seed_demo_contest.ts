/**
 * seed_demo_contest.ts
 *
 * Creates a demo FREE_LEAGUE contest for the Foresight demo.
 *
 * Usage:
 *   NODE_OPTIONS='--import tsx' npx tsx backend/scripts/seed_demo_contest.ts
 *
 * Flags:
 *   --quick     Sets lock in 2 min, end in 4 min (for demo recording)
 *   --clean     Deactivates any previously seeded demo contests first
 *
 * To speed-run an existing contest for demo recording, use:
 *   NODE_OPTIONS='--import tsx' npx tsx backend/scripts/seed_demo_contest.ts --quick
 */

import db from '../src/utils/db';

const DEMO_CONTEST_NAME = '🎯 CT Draft — Free League';
const DEMO_DESCRIPTION = 'Draft 5 CT influencers and compete for prizes. Free to enter!';

const args = process.argv.slice(2);
const QUICK_MODE = args.includes('--quick');
const CLEAN_MODE = args.includes('--clean');

async function run(): Promise<void> {
  console.log(`🚀 Seeding demo contest${QUICK_MODE ? ' [QUICK MODE — ends in ~4 min]' : ''}...`);

  // Look up the FREE_LEAGUE contest type
  const contestType = await db('contest_types').where('code', 'FREE_LEAGUE').first();
  if (!contestType) {
    throw new Error('FREE_LEAGUE contest type not found. Run migrations first.');
  }
  console.log(`   Contest type: FREE_LEAGUE (id=${contestType.id})`);

  // Optionally clean up old demo contests
  if (CLEAN_MODE) {
    const deactivated = await db('prized_contests')
      .where('name', DEMO_CONTEST_NAME)
      .whereIn('status', ['open', 'locked'])
      .update({ status: 'cancelled', updated_at: new Date() });
    if (deactivated > 0) {
      console.log(`   Cancelled ${deactivated} old demo contest(s).`);
    }
  }

  // Check if a demo contest is already open (avoid duplicates)
  const existing = await db('prized_contests')
    .where('name', DEMO_CONTEST_NAME)
    .whereIn('status', ['open', 'locked', 'scoring'])
    .first();

  if (existing && !QUICK_MODE) {
    console.log(`\n⚠️  A demo contest is already active (id=${existing.id}, status=${existing.status}).`);
    console.log(`   Lock time:  ${existing.lock_time}`);
    console.log(`   End time:   ${existing.end_time}`);
    console.log(`   To replace: run with --clean flag`);
    console.log(`   To speed up for demo: run with --quick flag`);
    await db.destroy();
    process.exit(0);
  }

  const now = new Date();
  let lockTime: Date;
  let endTime: Date;

  if (QUICK_MODE) {
    // Speed-run mode: 2 min to lock, 4 min to end
    // Also update any existing open demo contest rather than creating a new one
    lockTime = new Date(now.getTime() + 2 * 60 * 1000);
    endTime  = new Date(now.getTime() + 4 * 60 * 1000);

    if (existing) {
      await db('prized_contests')
        .where('id', existing.id)
        .update({ lock_time: lockTime, end_time: endTime, updated_at: new Date() });
      console.log(`\n⚡ Speed-run mode: Updated contest id=${existing.id}`);
      console.log(`   Lock time:  ${lockTime.toISOString()} (in ~2 min)`);
      console.log(`   End time:   ${endTime.toISOString()} (in ~4 min)`);
      console.log(`\n🎬 Demo recording checklist:`);
      console.log(`   1. Open /compete → "CT Draft — Free League" shows with ~2 min timer`);
      console.log(`   2. Enter the contest — shows your team`);
      console.log(`   3. After ~2 min: status flips to "locked" (timer gone, scoring starts)`);
      console.log(`   4. After ~4 min: status flips to "scoring" then "finalized"`);
      console.log(`   5. Leaderboard appears at /contest/${existing.id}`);
      await db.destroy();
      process.exit(0);
    }
  } else {
    // Normal mode: locks next Monday 12:00 UTC, ends following Sunday 23:59 UTC
    const nextMonday = getNextMonday();
    lockTime = new Date(nextMonday);
    lockTime.setUTCHours(12, 0, 0, 0);
    endTime = new Date(lockTime.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000); // +7 days - 1s
  }

  // Insert the contest
  const [contest] = await db('prized_contests').insert({
    contest_type_id: contestType.id,
    contract_contest_id: null,
    contract_address: null,
    name: DEMO_CONTEST_NAME,
    description: DEMO_DESCRIPTION,
    entry_fee: '0',
    team_size: contestType.team_size || 5,
    has_captain: contestType.has_captain ?? true,
    is_free: true,
    rake_percent: '0',
    min_players: contestType.min_players || 2,
    max_players: contestType.max_players || 0,
    lock_time: lockTime,
    end_time: endTime,
    status: 'open',
    prize_pool: '0.05',
    distributable_pool: '0.05',
    player_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning('*');

  console.log(`\n✅ Demo contest created!`);
  console.log(`   ID:         ${contest.id}`);
  console.log(`   Name:       ${contest.name}`);
  console.log(`   Lock time:  ${lockTime.toISOString()}`);
  console.log(`   End time:   ${endTime.toISOString()}`);
  console.log(`   Prize pool: 0.05 SOL`);
  console.log(`\n🔗 Contest URL: /contest/${contest.id}`);
  if (QUICK_MODE) {
    console.log(`\n⚡ Quick mode: locks in ~2 min, ends in ~4 min`);
  } else {
    console.log(`\n💡 To speed-run for demo: run with --quick flag`);
  }

  await db.destroy();
}

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday;
}

run().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
