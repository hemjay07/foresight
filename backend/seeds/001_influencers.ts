import { Knex } from 'knex';

/**
 * Seed: Influencer Roster
 *
 * Uses the same CT-native validated list as migration 20260227000001_overhaul_influencer_roster.
 * Safe to re-run — uses ON CONFLICT DO UPDATE (upsert), never deletes.
 *
 * Total: 69 active influencers (S=4, A=19, B=22, C=24)
 * Tiers are set by CT credibility judgment, NOT follower count.
 * follower_count / engagement_rate are left at 0 — populated by Twitter API cron.
 */

interface InfluencerRow {
  twitter_handle: string;
  display_name: string;
  tier: 'S' | 'A' | 'B' | 'C';
  price: number;
}

const ROSTER: InfluencerRow[] = [
  // ─── S-TIER (4) ──────────────────────────────────────────────────────────
  { twitter_handle: 'saylor',          display_name: 'Michael Saylor',        tier: 'S', price: 48 },
  { twitter_handle: 'VitalikButerin',  display_name: 'Vitalik Buterin',        tier: 'S', price: 46 },
  { twitter_handle: 'APompliano',      display_name: 'Anthony Pompliano',      tier: 'S', price: 43 },
  { twitter_handle: 'pmarca',          display_name: 'Marc Andreessen',        tier: 'S', price: 40 },

  // ─── A-TIER (19) ─────────────────────────────────────────────────────────
  { twitter_handle: 'blknoiz06',       display_name: 'Ansem',                  tier: 'A', price: 35 },
  { twitter_handle: 'zachxbt',         display_name: 'ZachXBT',                tier: 'A', price: 34 },
  { twitter_handle: 'cz_binance',      display_name: 'CZ',                     tier: 'A', price: 33 },
  { twitter_handle: '0xMert_',         display_name: 'Mert Mumtaz',            tier: 'A', price: 33 },
  { twitter_handle: 'CryptoHayes',     display_name: 'Arthur Hayes',           tier: 'A', price: 32 },
  { twitter_handle: 'aeyakovenko',     display_name: 'Anatoly Yakovenko',      tier: 'A', price: 31 },
  { twitter_handle: 'RaoulGMI',        display_name: 'Raoul Pal',              tier: 'A', price: 31 },
  { twitter_handle: 'naval',           display_name: 'Naval Ravikant',         tier: 'A', price: 30 },
  { twitter_handle: 'balajis',         display_name: 'Balaji Srinivasan',      tier: 'A', price: 30 },
  { twitter_handle: 'sassal0x',        display_name: 'Anthony Sassano',        tier: 'A', price: 29 },
  { twitter_handle: 'frankdegods',     display_name: 'Frank DeGods',           tier: 'A', price: 28 },
  { twitter_handle: 'punk6529',        display_name: '6529',                   tier: 'A', price: 28 },
  { twitter_handle: 'StaniKulechov',   display_name: 'Stani Kulechov',         tier: 'A', price: 27 },
  { twitter_handle: 'inversebrah',     display_name: 'InverseBrah',            tier: 'A', price: 27 },
  { twitter_handle: 'laurashin',       display_name: 'Laura Shin',             tier: 'A', price: 26 },
  { twitter_handle: 'RektCapital',     display_name: 'Rekt Capital',           tier: 'A', price: 26 },
  { twitter_handle: 'waleswoosh',      display_name: 'Wale Swoosh',            tier: 'A', price: 25 },
  { twitter_handle: 'icobeast',        display_name: 'ICO Beast',              tier: 'A', price: 25 },
  { twitter_handle: 'vohvohh',         display_name: 'vohvohh',               tier: 'A', price: 25 },

  // ─── B-TIER (22) ─────────────────────────────────────────────────────────
  { twitter_handle: 'brian_armstrong', display_name: 'Brian Armstrong',        tier: 'B', price: 25 },
  { twitter_handle: 'Pentosh1',        display_name: 'Pentoshi',               tier: 'B', price: 24 },
  { twitter_handle: 'nic__carter',     display_name: 'Nic Carter',             tier: 'B', price: 23 },
  { twitter_handle: 'woonomic',        display_name: 'Willy Woo',              tier: 'B', price: 23 },
  { twitter_handle: '0xngmi',          display_name: '0xngmi',                 tier: 'B', price: 22 },
  { twitter_handle: 'hasufl',          display_name: 'Hasu',                   tier: 'B', price: 22 },
  { twitter_handle: 'martypartymusic', display_name: 'Marty Bent',             tier: 'B', price: 21 },
  { twitter_handle: 'farokh',          display_name: 'Farokh',                 tier: 'B', price: 21 },
  { twitter_handle: 'santiagoroel',    display_name: 'Santiago R. Santos',     tier: 'B', price: 20 },
  { twitter_handle: 'iamDCinvestor',   display_name: 'DCinvestor',             tier: 'B', price: 20 },
  { twitter_handle: 'banditxbt',       display_name: 'Bandit',                 tier: 'B', price: 20 },
  { twitter_handle: 'DeFi_Dad',        display_name: 'DeFi Dad',               tier: 'B', price: 20 },
  { twitter_handle: 'TimHaldorsson',   display_name: 'Tim Haldorsson',         tier: 'B', price: 19 },
  { twitter_handle: 'ripchillpill',    display_name: 'ripchillpill',           tier: 'B', price: 19 },
  { twitter_handle: 'bunjil',          display_name: 'bunjil',                 tier: 'B', price: 19 },
  { twitter_handle: 'based16z',        display_name: 'based16z',               tier: 'B', price: 19 },
  { twitter_handle: 'pons_eth',        display_name: 'pons.eth',               tier: 'B', price: 18 },
  { twitter_handle: 'boldleonidas',    display_name: 'Bold Leonidas',          tier: 'B', price: 18 },
  { twitter_handle: 'camolNFT',        display_name: 'camol',                  tier: 'B', price: 18 },
  { twitter_handle: 'youfadedwealth',  display_name: 'youfadedwealth',         tier: 'B', price: 18 },
  { twitter_handle: 'StarPlatinum_',   display_name: 'Star Platinum',          tier: 'B', price: 18 },
  { twitter_handle: 'jgonzalezferrer', display_name: 'Javier Gonzalez',        tier: 'B', price: 18 },

  // ─── C-TIER (24) ─────────────────────────────────────────────────────────
  { twitter_handle: 'CryptoKaleo',     display_name: 'Kaleo',                  tier: 'C', price: 17 },
  { twitter_handle: 'chamath',         display_name: 'Chamath Palihapitiya',   tier: 'C', price: 17 },
  { twitter_handle: 'Zeneca',          display_name: 'Zeneca',                 tier: 'C', price: 16 },
  { twitter_handle: 'dingalingts',     display_name: 'dingaling',              tier: 'C', price: 16 },
  { twitter_handle: 'pixonchain',      display_name: 'pixonchain',             tier: 'C', price: 16 },
  { twitter_handle: 'SolanaSensei',    display_name: 'Solana Sensei',          tier: 'C', price: 15 },
  { twitter_handle: 'wizardofsoho',    display_name: 'Wizard of Soho',         tier: 'C', price: 15 },
  { twitter_handle: '0xSammy',         display_name: '0xSammy',                tier: 'C', price: 15 },
  { twitter_handle: 'thegreatola',     display_name: 'The Great Ola',          tier: 'C', price: 14 },
  { twitter_handle: 'samuelxeus',      display_name: 'samuelxeus',             tier: 'C', price: 14 },
  { twitter_handle: 'heycape_',        display_name: 'heycape',                tier: 'C', price: 14 },
  { twitter_handle: 'TheCryptoProfes', display_name: 'The Crypto Professor',   tier: 'C', price: 14 },
  { twitter_handle: '0xjayn3',         display_name: '0xjayn3',                tier: 'C', price: 14 },
  { twitter_handle: 'holly_web3',      display_name: 'Holly Web3',             tier: 'C', price: 14 },
  { twitter_handle: 'Chilearmy123',    display_name: 'Chilearmy',              tier: 'C', price: 13 },
  { twitter_handle: 'chooserich',      display_name: 'chooserich',             tier: 'C', price: 13 },
  { twitter_handle: 'oxtochi',         display_name: 'oxtochi',                tier: 'C', price: 13 },
  { twitter_handle: 'soligxbt',        display_name: 'soligxbt',               tier: 'C', price: 13 },
  { twitter_handle: 'serpinxbt',       display_name: 'serpinxbt',              tier: 'C', price: 13 },
  { twitter_handle: 'TheDeFinvestor',  display_name: 'The DeFi Investor',      tier: 'C', price: 13 },
  { twitter_handle: 'meta_alchemist',  display_name: 'Meta Alchemist',         tier: 'C', price: 13 },
  { twitter_handle: 'proofoftravis',   display_name: 'Proof of Travis',        tier: 'C', price: 13 },
  { twitter_handle: '73lv_',           display_name: '73lv',                   tier: 'C', price: 12 },
  { twitter_handle: 'loshmi',          display_name: 'loshmi',                 tier: 'C', price: 12 },
];

export async function seed(knex: Knex): Promise<void> {
  // Deactivate all first (soft-delete unknown handles)
  await knex('influencers').update({ is_active: false });

  // Upsert the proper roster — safe to re-run
  for (const inf of ROSTER) {
    await knex.raw(`
      INSERT INTO influencers (
        twitter_handle, display_name, tier, price,
        follower_count, engagement_rate,
        avatar_url, is_active, created_at, updated_at
      ) VALUES (
        :handle, :name, :tier, :price,
        0, 0,
        :avatar, true, NOW(), NOW()
      )
      ON CONFLICT (twitter_handle) DO UPDATE SET
        display_name   = EXCLUDED.display_name,
        tier           = EXCLUDED.tier,
        price          = EXCLUDED.price,
        avatar_url     = EXCLUDED.avatar_url,
        is_active      = true,
        updated_at     = NOW()
    `, {
      handle: inf.twitter_handle,
      name: inf.display_name,
      tier: inf.tier,
      price: inf.price,
      avatar: `https://unavatar.io/twitter/${inf.twitter_handle}`,
    });
  }

  const counts = await knex('influencers')
    .where({ is_active: true })
    .select('tier')
    .count('* as count')
    .groupBy('tier')
    .orderBy('tier');

  console.log(`✅ Seeded ${ROSTER.length} CT influencers`, counts.map((c: any) => `${c.tier}:${c.count}`).join(' '));
}
