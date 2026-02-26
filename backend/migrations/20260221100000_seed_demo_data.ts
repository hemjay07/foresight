/**
 * Seed Demo Data Migration
 *
 * 1. Fixes influencer tier distribution to match spec: S(4), A(16), B(30), C(50) = 100
 * 2. Assigns varied pricing within tiers
 * 3. Creates an active free league contest for demo
 */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ─── Step 1: Reassign existing influencer tiers & prices ─────────────────

  // S-Tier (4 total): The mega-whales — $38-48
  const sTier = [
    { id: 1, price: 48 },  // CZ
    { id: 2, price: 46 },  // Vitalik
    { id: 5, price: 45 },  // Elon
    { id: 7, price: 38 },  // Brian Armstrong
  ];

  // A-Tier (16 total): Major KOLs — $28-36
  const aTier = [
    { id: 3, price: 36 },  // Balaji
    { id: 4, price: 35 },  // Pomp
    { id: 6, price: 34 },  // Ansem
    { id: 8, price: 33 },  // Cobie
    { id: 9, price: 32 },  // Naval
    { id: 10, price: 31 }, // Cred
    { id: 11, price: 30 }, // InverseBrah
    { id: 12, price: 30 }, // Sassal
    { id: 13, price: 29 }, // DeFi Ignas
    { id: 14, price: 29 }, // Altcoin Gordon
    { id: 15, price: 28 }, // GCR
    { id: 16, price: 28 }, // WhalePanda
    { id: 17, price: 28 }, // Crypto Wendy O
    { id: 18, price: 35 }, // Rekt Capital
    { id: 19, price: 33 }, // Ivan on Tech
    { id: 20, price: 32 }, // CryptosRUs
  ];

  // B-Tier (30 total): Mid-tier — $22-28
  // Existing IDs 21-39 = 19 influencers, need 11 more from new inserts
  const bTierExisting = [
    { id: 21, price: 28 }, // ThinkingCrypto
    { id: 22, price: 27 }, // Altcoin Psycho
    { id: 23, price: 27 }, // The DeFi Edge
    { id: 24, price: 26 }, // Crypto Don Alt
    { id: 25, price: 26 }, // Trader Mayne
    { id: 26, price: 25 }, // Kaleo
    { id: 27, price: 25 }, // Crypto Rover
    { id: 28, price: 25 }, // Route2FI
    { id: 29, price: 24 }, // Arthur Hayes
    { id: 30, price: 24 }, // DeFi Dad
    { id: 31, price: 24 }, // Messari
    { id: 32, price: 23 }, // Ryan Sean Adams
    { id: 33, price: 23 }, // David Hoffman
    { id: 34, price: 23 }, // Croissant
    { id: 35, price: 22 }, // Emperor
    { id: 36, price: 22 }, // Luke Martin
    { id: 37, price: 22 }, // Credible Crypto
    { id: 38, price: 22 }, // Light
    { id: 39, price: 22 }, // Waleswoosh
  ];

  // C-Tier (50 total): Emerging — $15-22
  // Existing IDs 40-49 = 10 influencers, need 40 more from new inserts
  const cTierExisting = [
    { id: 40, price: 22 }, // Chris Dixon
    { id: 41, price: 21 }, // Hasu
    { id: 42, price: 21 }, // Nic Carter
    { id: 43, price: 20 }, // Laura Shin
    { id: 44, price: 20 }, // Robert Leshner
    { id: 45, price: 19 }, // Stani Kulechov
    { id: 46, price: 19 }, // Kain Warwick
    { id: 47, price: 18 }, // Ameen Soleimani
    { id: 48, price: 17 }, // Bandit
    { id: 49, price: 16 }, // Degen Spartan
  ];

  // Update S-tier
  for (const inf of sTier) {
    await knex('influencers').where('id', inf.id).update({
      tier: 'S',
      price: inf.price,
      base_price: inf.price,
      updated_at: new Date(),
    });
  }

  // Update A-tier
  for (const inf of aTier) {
    await knex('influencers').where('id', inf.id).update({
      tier: 'A',
      price: inf.price,
      base_price: inf.price,
      updated_at: new Date(),
    });
  }

  // Update B-tier
  for (const inf of bTierExisting) {
    await knex('influencers').where('id', inf.id).update({
      tier: 'B',
      price: inf.price,
      base_price: inf.price,
      updated_at: new Date(),
    });
  }

  // Update C-tier
  for (const inf of cTierExisting) {
    await knex('influencers').where('id', inf.id).update({
      tier: 'C',
      price: inf.price,
      base_price: inf.price,
      updated_at: new Date(),
    });
  }

  // ─── Step 2: Insert new influencers (IDs 50-100) ────────────────────────

  const newInfluencers = [
    // B-Tier additions (IDs 50-60, 11 new → total 30 B-tier)
    { twitter_handle: 'ZssBecker', display_name: 'Zach Becker', tier: 'B', price: 27, follower_count: 285000 },
    { twitter_handle: 'CryptoCapo_', display_name: 'Il Capo Of Crypto', tier: 'B', price: 26, follower_count: 750000 },
    { twitter_handle: 'ColdBloodShill', display_name: 'ColdBloodShill', tier: 'B', price: 26, follower_count: 210000 },
    { twitter_handle: 'MoonOverlord', display_name: 'Moon Overlord', tier: 'B', price: 25, follower_count: 340000 },
    { twitter_handle: 'CryptoGodJohn', display_name: 'Crypto God John', tier: 'B', price: 25, follower_count: 290000 },
    { twitter_handle: 'crypto_birb', display_name: 'Crypto Birb', tier: 'B', price: 24, follower_count: 680000 },
    { twitter_handle: 'Pentosh1', display_name: 'Pentoshi', tier: 'B', price: 24, follower_count: 620000 },
    { twitter_handle: 'HsakaTrades', display_name: 'Hsaka', tier: 'B', price: 23, follower_count: 400000 },
    { twitter_handle: 'SmartContracter', display_name: 'Smart Contracter', tier: 'B', price: 23, follower_count: 310000 },
    { twitter_handle: 'CryptoMessiah', display_name: 'Crypto Messiah', tier: 'B', price: 22, follower_count: 500000 },
    { twitter_handle: 'crash_barry', display_name: 'Barry Silbert', tier: 'B', price: 22, follower_count: 380000 },

    // C-Tier additions (IDs 61-100, 40 new → total 50 C-tier)
    { twitter_handle: 'CryptoWizardd', display_name: 'Crypto Wizard', tier: 'C', price: 22, follower_count: 180000 },
    { twitter_handle: 'nebaborottt', display_name: 'Neba', tier: 'C', price: 21, follower_count: 95000 },
    { twitter_handle: 'solloyd_', display_name: 'Solloyd', tier: 'C', price: 21, follower_count: 110000 },
    { twitter_handle: 'CryptoTony__', display_name: 'Crypto Tony', tier: 'C', price: 21, follower_count: 240000 },
    { twitter_handle: 'SolJakey', display_name: 'Jakey', tier: 'C', price: 20, follower_count: 75000 },
    { twitter_handle: 'HanweChang', display_name: 'Hanwe', tier: 'C', price: 20, follower_count: 60000 },
    { twitter_handle: 'maboroshi_crypt', display_name: 'Maboroshi', tier: 'C', price: 20, follower_count: 85000 },
    { twitter_handle: 'CryptoNobler', display_name: 'Noble Crypto', tier: 'C', price: 20, follower_count: 130000 },
    { twitter_handle: 'TaikiMaxi', display_name: 'Taiki', tier: 'C', price: 19, follower_count: 55000 },
    { twitter_handle: 'CryptoMichNick', display_name: 'Michael', tier: 'C', price: 19, follower_count: 145000 },
    { twitter_handle: 'DeFiyst', display_name: 'DeFiyst', tier: 'C', price: 19, follower_count: 92000 },
    { twitter_handle: 'BanklessHQ', display_name: 'Bankless', tier: 'C', price: 19, follower_count: 320000 },
    { twitter_handle: 'theblock__', display_name: 'The Block', tier: 'C', price: 18, follower_count: 280000 },
    { twitter_handle: 'caborottt', display_name: 'Cabo', tier: 'C', price: 18, follower_count: 68000 },
    { twitter_handle: 'ZoomerOracle', display_name: 'Zoomer Oracle', tier: 'C', price: 18, follower_count: 105000 },
    { twitter_handle: 'CryptoGarga', display_name: 'Garga', tier: 'C', price: 18, follower_count: 88000 },
    { twitter_handle: 'DaanCrypto', display_name: 'Daan', tier: 'C', price: 18, follower_count: 195000 },
    { twitter_handle: 'theRealKiyosaki', display_name: 'Kiyosaki Crypto', tier: 'C', price: 17, follower_count: 40000 },
    { twitter_handle: 'taborottt', display_name: 'Tabo', tier: 'C', price: 17, follower_count: 52000 },
    { twitter_handle: 'KoroushAK', display_name: 'Koroush AK', tier: 'C', price: 17, follower_count: 160000 },
    { twitter_handle: 'EllioTrades', display_name: 'Elliot Trades', tier: 'C', price: 17, follower_count: 340000 },
    { twitter_handle: 'CryptoKaduna', display_name: 'Kaduna', tier: 'C', price: 17, follower_count: 75000 },
    { twitter_handle: 'FloodCapital', display_name: 'Flood', tier: 'C', price: 16, follower_count: 85000 },
    { twitter_handle: 'MustStopMurad', display_name: 'Murad', tier: 'C', price: 16, follower_count: 120000 },
    { twitter_handle: 'DrNickA', display_name: 'Dr Nick', tier: 'C', price: 16, follower_count: 48000 },
    { twitter_handle: 'CryptoBanter', display_name: 'Crypto Banter', tier: 'C', price: 16, follower_count: 560000 },
    { twitter_handle: 'CryptoJelleNL', display_name: 'Jelle', tier: 'C', price: 16, follower_count: 95000 },
    { twitter_handle: 'CryptoNewton', display_name: 'Newton', tier: 'C', price: 15, follower_count: 38000 },
    { twitter_handle: 'SolBigBrain', display_name: 'Sol Big Brain', tier: 'C', price: 15, follower_count: 65000 },
    { twitter_handle: 'CryptoRank_io', display_name: 'CryptoRank', tier: 'C', price: 15, follower_count: 180000 },
    { twitter_handle: 'WuBlockchain', display_name: 'Wu Blockchain', tier: 'C', price: 15, follower_count: 230000 },
    { twitter_handle: 'CoinDesk', display_name: 'CoinDesk', tier: 'C', price: 15, follower_count: 2000000 },
    { twitter_handle: 'CryptoDaily', display_name: 'Crypto Daily', tier: 'C', price: 15, follower_count: 210000 },
    { twitter_handle: 'CoinGecko', display_name: 'CoinGecko', tier: 'C', price: 15, follower_count: 1800000 },
    { twitter_handle: 'CryptoGems555', display_name: 'Crypto Gems', tier: 'C', price: 15, follower_count: 42000 },
    { twitter_handle: 'TheCryptoDog', display_name: 'The Crypto Dog', tier: 'C', price: 15, follower_count: 300000 },
    { twitter_handle: 'BitBoy_Crypto', display_name: 'BitBoy', tier: 'C', price: 16, follower_count: 850000 },
    { twitter_handle: 'AustinGriffith', display_name: 'Austin Griffith', tier: 'C', price: 16, follower_count: 75000 },
    { twitter_handle: 'DeFiMoon', display_name: 'DeFi Moon', tier: 'C', price: 17, follower_count: 58000 },
    { twitter_handle: 'KashWagner', display_name: 'Kash Wagner', tier: 'C', price: 18, follower_count: 92000 },
  ];

  const now = new Date();
  for (const inf of newInfluencers) {
    await knex('influencers').insert({
      twitter_handle: inf.twitter_handle,
      display_name: inf.display_name,
      tier: inf.tier,
      price: inf.price,
      base_price: inf.price,
      follower_count: inf.follower_count,
      engagement_rate: Math.round((Math.random() * 4 + 1) * 100) / 100, // 1-5%
      daily_tweets: Math.floor(Math.random() * 15 + 2),
      draft_score: Math.floor(Math.random() * 80 + 20),
      is_active: true,
      total_points: Math.floor(Math.random() * 500 + 50),
      form_score: Math.floor(Math.random() * 100),
      avatar_url: `https://unavatar.io/twitter/${inf.twitter_handle}`,
      bio: `Crypto influencer | ${inf.tier}-Tier`,
      created_at: now,
      updated_at: now,
    });
  }

  // ─── Step 3: Create active demo contest ─────────────────────────────────

  // Get the FREE_LEAGUE contest type
  const freeLeagueType = await knex('contest_types')
    .where('code', 'FREE_LEAGUE')
    .first();

  if (freeLeagueType) {
    // Contest runs from now until end of hackathon (Feb 27)
    const lockTime = new Date('2026-02-27T00:00:00Z'); // Lock at hackathon deadline
    const endTime = new Date('2026-02-27T23:59:59Z');  // End at hackathon deadline

    await knex('prized_contests').insert({
      contest_type_id: freeLeagueType.id,
      contract_contest_id: 999,
      contract_address: 'HackathonDemoFreeLeague2026',
      name: 'Hackathon Demo League',
      description: 'Free entry league for the Solana Graveyard Hackathon demo. Draft your dream CT team and compete for glory!',
      entry_fee: 0,
      team_size: 5,
      has_captain: true,
      is_free: true,
      rake_percent: 0,
      min_players: 2,
      max_players: 1000,
      lock_time: lockTime,
      end_time: endTime,
      status: 'open',
      player_count: 0,
      prize_pool: '0.05',
      distributable_pool: '0.05',
      created_at: now,
      updated_at: now,
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove the demo contest
  await knex('prized_contests')
    .where('name', 'Hackathon Demo League')
    .del();

  // Remove new influencers (IDs > 49)
  await knex('influencers')
    .where('id', '>', 49)
    .del();

  // Reset existing influencer tiers/prices to original flat values
  await knex('influencers').whereBetween('id', [1, 10]).update({ tier: 'S', price: 28, base_price: 28 });
  await knex('influencers').whereBetween('id', [11, 27]).update({ tier: 'A', price: 22, base_price: 22 });
  await knex('influencers').whereBetween('id', [28, 39]).update({ tier: 'B', price: 18, base_price: 18 });
  await knex('influencers').whereBetween('id', [40, 49]).update({ tier: 'C', price: 12, base_price: 12 });
}
