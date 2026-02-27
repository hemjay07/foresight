import { Knex } from 'knex';

/**
 * Fix: make contract_contest_id and contract_address nullable on prized_contests.
 *
 * The original schema had both as NOT NULL because all contests were expected to
 * come from a smart contract. Now we have free (off-chain) contests, so they must
 * be nullable.
 *
 * After fixing the schema, seeds the demo FREE_LEAGUE contest if one doesn't exist.
 */
export async function up(knex: Knex): Promise<void> {
  // ── Step 1: Make contract columns nullable ────────────────────────────────
  await knex.schema.alterTable('prized_contests', (table) => {
    table.integer('contract_contest_id').nullable().alter();
    table.string('contract_address', 42).nullable().alter();
  });
  console.log('✅ Made contract_contest_id and contract_address nullable.');

  // ── Step 2: Ensure FREE_LEAGUE contest type exists ────────────────────────
  let contestType = await knex('contest_types').where('code', 'FREE_LEAGUE').first();
  if (!contestType) {
    await knex('contest_types').insert({
      code: 'FREE_LEAGUE',
      name: 'Free League',
      description: 'Practice mode - no entry fee, real prizes funded by platform',
      entry_fee: 0,
      team_size: 5,
      has_captain: true,
      duration_hours: 168,
      rake_percent: 0,
      min_players: 10,
      max_players: 0,
      winners_percent: 10,
      is_free: true,
      display_order: 1,
    });
    contestType = await knex('contest_types').where('code', 'FREE_LEAGUE').first();
    console.log('✅ Inserted FREE_LEAGUE contest type.');
  }

  // ── Step 3: Skip if a demo contest already exists ─────────────────────────
  const existing = await knex('prized_contests')
    .where('name', '🎯 CT Draft — Free League')
    .whereIn('status', ['open', 'locked', 'scoring'])
    .first();

  if (existing) {
    console.log(`⏭  Demo contest already active (id=${existing.id}) — skipping.`);
    return;
  }

  // ── Step 4: Create demo contest ────────────────────────────────────────────
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const lockTime = new Date(now);
  lockTime.setUTCDate(now.getUTCDate() + daysUntilMonday);
  lockTime.setUTCHours(12, 0, 0, 0);
  const endTime = new Date(lockTime.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);

  const [contest] = await knex('prized_contests').insert({
    contest_type_id: contestType.id,
    contract_contest_id: null,
    contract_address: null,
    name: '🎯 CT Draft — Free League',
    description: 'Draft 5 CT influencers and compete for prizes. Free to enter!',
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

  console.log(`✅ Demo contest created (id=${contest.id})`);
  console.log(`   Lock: ${lockTime.toISOString()}`);
  console.log(`   End:  ${endTime.toISOString()}`);
}

export async function down(knex: Knex): Promise<void> {
  // Cancel the demo contest (don't reverse schema change — too risky)
  await knex('prized_contests')
    .where('name', '🎯 CT Draft — Free League')
    .whereIn('status', ['open', 'locked'])
    .update({ status: 'cancelled', updated_at: new Date() });
  console.log('↩️  Demo contest cancelled.');
}
