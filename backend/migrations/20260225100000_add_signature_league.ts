/**
 * Signature League Migration
 *
 * 1. Adds is_signature_league, creator_handle, creator_avatar_url to prized_contests
 * 2. Seeds "CZ's Champions League" as the first Signature League
 * 3. Seeds 12 demo entries with realistic leaderboard scores
 */
import { Knex } from 'knex';
import { randomUUID } from 'crypto';

const SIGNATURE_ENTRIES = [
  { username: 'CZ_Maxi', wallet: '0xCZ11111111111111111111111111111111111111', score: { total: 198, activity: 35, engagement: 58, growth: 68, viral: 37 } },
  { username: 'BNB_King', wallet: '0xCZ22222222222222222222222222222222222222', score: { total: 185, activity: 33, engagement: 54, growth: 62, viral: 36 } },
  { username: 'WebThreeWatcher', wallet: '0xCZ33333333333333333333333333333333333333', score: { total: 172, activity: 31, engagement: 50, growth: 58, viral: 33 } },
  { username: 'SolMaximalist', wallet: '0xCZ44444444444444444444444444444444444444', score: { total: 161, activity: 29, engagement: 47, growth: 55, viral: 30 } },
  { username: 'DegenVault', wallet: '0xCZ55555555555555555555555555555555555555', score: { total: 149, activity: 27, engagement: 44, growth: 48, viral: 30 } },
  { username: 'CryptoLegend', wallet: '0xCZ66666666666666666666666666666666666666', score: { total: 138, activity: 25, engagement: 42, growth: 46, viral: 25 } },
  { username: 'OnChainGuru', wallet: '0xCZ77777777777777777777777777777777777777', score: { total: 126, activity: 23, engagement: 38, growth: 42, viral: 23 } },
  { username: 'WhaleWatcher', wallet: '0xCZ88888888888888888888888888888888888888', score: { total: 114, activity: 21, engagement: 34, growth: 38, viral: 21 } },
  { username: 'AltSzn_Ready', wallet: '0xCZ99999999999999999999999999999999999999', score: { total: 103, activity: 19, engagement: 31, growth: 34, viral: 19 } },
  { username: 'TokenomicsNerd', wallet: '0xCZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', score: { total: 92, activity: 17, engagement: 28, growth: 30, viral: 17 } },
  { username: 'ChainAgnostic', wallet: '0xCZbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', score: { total: 81, activity: 15, engagement: 24, growth: 28, viral: 14 } },
  { username: 'RektSurvivor', wallet: '0xCZcccccccccccccccccccccccccccccccccccccc', score: { total: 70, activity: 13, engagement: 20, growth: 24, viral: 13 } },
];

// Valid budget teams for the CZ league
const TEAM_COMPOSITIONS = [
  { team: [1, 4, 22, 35, 48], captain: 1 },   // CZ + Pomp + Altcoin Psycho + Emperor + Bandit
  { team: [1, 9, 26, 40, 47], captain: 1 },
  { team: [2, 3, 28, 42, 49], captain: 2 },
  { team: [5, 6, 30, 43, 46], captain: 5 },
  { team: [7, 4, 21, 44, 45], captain: 4 },
  { team: [1, 15, 23, 37, 42], captain: 1 },
  { team: [2, 11, 29, 41, 48], captain: 2 },
  { team: [5, 8, 25, 38, 46], captain: 8 },
  { team: [7, 14, 33, 40, 49], captain: 7 },
  { team: [1, 12, 32, 44, 47], captain: 12 },
  { team: [2, 16, 27, 43, 45], captain: 2 },
  { team: [5, 10, 22, 39, 48], captain: 10 },
];

export async function up(knex: Knex): Promise<void> {
  // ─── Step 1: Add columns to prized_contests ──────────────────────────────
  const hasSignature = await knex.schema.hasColumn('prized_contests', 'is_signature_league');
  if (!hasSignature) {
    await knex.schema.alterTable('prized_contests', (table) => {
      table.boolean('is_signature_league').defaultTo(false);
      table.string('creator_handle', 100).nullable();
      table.string('creator_avatar_url', 500).nullable();
      table.integer('creator_follower_count').defaultTo(0);
    });
  }

  // ─── Step 2: Get FREE_LEAGUE type ────────────────────────────────────────
  const freeLeagueType = await knex('contest_types').where('code', 'FREE_LEAGUE').first();
  if (!freeLeagueType) {
    console.log('FREE_LEAGUE contest type not found, skipping signature league seed');
    return;
  }

  // ─── Step 3: Insert CZ's Champions League ────────────────────────────────
  const now = new Date();
  const lockTime = new Date('2026-02-27T00:00:00Z');
  const endTime = new Date('2026-02-27T23:59:59Z');

  const [contestId] = await knex('prized_contests').insert({
    contest_type_id: freeLeagueType.id,
    contract_contest_id: 998,
    contract_address: 'SignatureLeagueCZChampions2026',
    name: "CZ's Champions League",
    description: "Created by @cz_binance — Draft the biggest names in CT and prove you know who runs this space.",
    entry_fee: 0,
    team_size: 5,
    has_captain: true,
    is_free: true,
    rake_percent: 0,
    min_players: 2,
    max_players: 5000,
    lock_time: lockTime,
    end_time: endTime,
    status: 'open',
    player_count: 0,
    prize_pool: '0.10',
    distributable_pool: '0.10',
    is_signature_league: true,
    creator_handle: 'cz_binance',
    creator_avatar_url: 'https://unavatar.io/twitter/cz_binance',
    creator_follower_count: 8900000,
    created_at: now,
    updated_at: now,
  }).returning('id');

  const leagueId = contestId?.id ?? contestId;

  // ─── Step 4: Seed 12 demo entries ────────────────────────────────────────
  for (let i = 0; i < SIGNATURE_ENTRIES.length; i++) {
    const entry = SIGNATURE_ENTRIES[i];
    const team = TEAM_COMPOSITIONS[i];
    const userId = randomUUID();

    await knex('users').insert({
      id: userId,
      wallet_address: entry.wallet,
      username: entry.username,
      created_at: new Date(now.getTime() - (SIGNATURE_ENTRIES.length - i) * 7200000),
      last_seen_at: now,
    });

    await knex('free_league_entries').insert({
      contest_id: leagueId,
      user_id: userId,
      wallet_address: entry.wallet,
      team_ids: team.team,
      captain_id: team.captain,
      score: entry.score.total,
      score_breakdown: JSON.stringify({
        activity: entry.score.activity,
        engagement: entry.score.engagement,
        growth: entry.score.growth,
        viral: entry.score.viral,
      }),
      rank: i + 1,
      created_at: new Date(now.getTime() - (SIGNATURE_ENTRIES.length - i) * 7200000),
      updated_at: now,
    });
  }

  // ─── Step 5: Update contest player count ─────────────────────────────────
  await knex('prized_contests')
    .where('id', leagueId)
    .update({ player_count: SIGNATURE_ENTRIES.length, updated_at: now });
}

export async function down(knex: Knex): Promise<void> {
  const wallets = SIGNATURE_ENTRIES.map(e => e.wallet);

  await knex('free_league_entries').whereIn('wallet_address', wallets).del();
  await knex('users').whereIn('wallet_address', wallets).del();
  await knex('prized_contests').where('name', "CZ's Champions League").del();

  const hasSignature = await knex.schema.hasColumn('prized_contests', 'is_signature_league');
  if (hasSignature) {
    await knex.schema.alterTable('prized_contests', (table) => {
      table.dropColumn('is_signature_league');
      table.dropColumn('creator_handle');
      table.dropColumn('creator_avatar_url');
      table.dropColumn('creator_follower_count');
    });
  }
}
