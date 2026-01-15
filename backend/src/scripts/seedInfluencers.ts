/**
 * Seed Influencers
 * Populates the database with 50 tracked CT accounts
 * Updated: Dec 24, 2025 based on Grok research
 */

import db from '../utils/db';

interface Influencer {
  twitter_handle: string;
  display_name: string;
  tier: 'S' | 'A' | 'B' | 'C';
  base_price: number;
  follower_count?: number;
}

// 50 Top Crypto Twitter Influencers (Updated Dec 24, 2025 based on Grok research)
const influencers: Influencer[] = [
  // S-Tier (28 points) - Mega influencers
  { twitter_handle: 'cz_binance', display_name: 'CZ', tier: 'S', base_price: 28, follower_count: 10600000 },
  { twitter_handle: 'VitalikButerin', display_name: 'Vitalik Buterin', tier: 'S', base_price: 28, follower_count: 5900000 },
  { twitter_handle: 'balajis', display_name: 'Balaji Srinivasan', tier: 'S', base_price: 28, follower_count: 1200000 },
  { twitter_handle: 'APompliano', display_name: 'Anthony Pompliano', tier: 'S', base_price: 28, follower_count: 1800000 },
  { twitter_handle: 'elonmusk', display_name: 'Elon Musk', tier: 'S', base_price: 28, follower_count: 230000000 },
  { twitter_handle: 'blknoiz06', display_name: 'Ansem', tier: 'S', base_price: 28, follower_count: 580000 },
  { twitter_handle: 'brian_armstrong', display_name: 'Brian Armstrong', tier: 'S', base_price: 28, follower_count: 1700000 },
  { twitter_handle: 'cobie', display_name: 'Cobie', tier: 'S', base_price: 28, follower_count: 560000 },
  { twitter_handle: 'naval', display_name: 'Naval Ravikant', tier: 'S', base_price: 28, follower_count: 3000000 },
  { twitter_handle: 'CryptoCred', display_name: 'Cred', tier: 'S', base_price: 28, follower_count: 732000 },

  // A-Tier (22 points) - Major influencers
  { twitter_handle: 'inversebrah', display_name: 'InverseBrah', tier: 'A', base_price: 22, follower_count: 480000 },
  { twitter_handle: 'sassal0x', display_name: 'sassal', tier: 'A', base_price: 22, follower_count: 710000 },
  { twitter_handle: 'DefiIgnas', display_name: 'DeFi Ignas', tier: 'A', base_price: 22, follower_count: 540000 },
  { twitter_handle: 'AltcoinGordon', display_name: 'Altcoin Gordon', tier: 'A', base_price: 22, follower_count: 590000 },
  { twitter_handle: 'GCRClassic', display_name: 'GCR', tier: 'A', base_price: 22, follower_count: 520000 },
  { twitter_handle: 'WhalePanda', display_name: 'WhalePanda', tier: 'A', base_price: 22, follower_count: 480000 },
  { twitter_handle: 'CryptoWendyO', display_name: 'Crypto Wendy O', tier: 'A', base_price: 22, follower_count: 670000 },
  { twitter_handle: 'rektcapital', display_name: 'Rekt Capital', tier: 'A', base_price: 22, follower_count: 580000 },
  { twitter_handle: 'IvanOnTech', display_name: 'Ivan on Tech', tier: 'A', base_price: 22, follower_count: 690000 },
  { twitter_handle: 'CryptosRUs', display_name: 'George (CryptosRUs)', tier: 'A', base_price: 22, follower_count: 530000 },
  { twitter_handle: 'ThinkingUSD', display_name: 'ThinkingCrypto', tier: 'A', base_price: 22, follower_count: 510000 },
  { twitter_handle: 'AltcoinPsycho', display_name: 'Altcoin Psycho', tier: 'A', base_price: 22, follower_count: 560000 },
  { twitter_handle: 'thedefiedge', display_name: 'The DeFi Edge', tier: 'A', base_price: 22, follower_count: 490000 },
  // Moved up from B-tier based on Grok research
  { twitter_handle: 'CryptoDonAlt', display_name: 'Crypto Don Alt', tier: 'A', base_price: 22, follower_count: 703000 },
  { twitter_handle: 'TraderMayne', display_name: 'Trader Mayne', tier: 'A', base_price: 22, follower_count: 558000 },
  { twitter_handle: 'CryptoKaleo', display_name: 'Kaleo', tier: 'A', base_price: 22, follower_count: 728000 },
  { twitter_handle: 'CryptoRover', display_name: 'Crypto Rover', tier: 'A', base_price: 22, follower_count: 1000000 },

  // B-Tier (18 points) - Established voices
  { twitter_handle: 'Route2FI', display_name: 'Route2FI', tier: 'B', base_price: 18, follower_count: 302000 },
  { twitter_handle: 'CryptoHayes', display_name: 'Arthur Hayes', tier: 'B', base_price: 18, follower_count: 420000 },
  { twitter_handle: 'DeFi_Dad', display_name: 'DeFi Dad', tier: 'B', base_price: 18, follower_count: 177000 },
  { twitter_handle: 'MessariCrypto', display_name: 'Messari', tier: 'B', base_price: 18, follower_count: 350000 },
  { twitter_handle: 'RyanSAdams', display_name: 'Ryan Sean Adams', tier: 'B', base_price: 18, follower_count: 273000 },
  { twitter_handle: 'TrustlessState', display_name: 'David Hoffman', tier: 'B', base_price: 18, follower_count: 252000 },
  { twitter_handle: 'CroissantEth', display_name: 'Croissant', tier: 'B', base_price: 18, follower_count: 115000 },
  { twitter_handle: 'EmperorBTC', display_name: 'Emperor', tier: 'B', base_price: 18, follower_count: 442000 },
  { twitter_handle: 'VentureCoinist', display_name: 'Luke Martin', tier: 'B', base_price: 18, follower_count: 330000 },
  { twitter_handle: 'CredibleCrypto', display_name: 'Credible Crypto', tier: 'B', base_price: 18, follower_count: 485000 },
  { twitter_handle: 'lightcrypto', display_name: 'Light', tier: 'B', base_price: 18, follower_count: 186000 },
  { twitter_handle: 'waleswoosh', display_name: 'Waleswoosh', tier: 'B', base_price: 18, follower_count: 171000 },

  // C-Tier (12 points) - Lottery tickets: DeFi founders & rising stars
  { twitter_handle: 'cdixon', display_name: 'Chris Dixon', tier: 'C', base_price: 12, follower_count: 896000 },
  { twitter_handle: 'hasufl', display_name: 'Hasu', tier: 'C', base_price: 12, follower_count: 250000 },
  { twitter_handle: 'nic__carter', display_name: 'Nic Carter', tier: 'C', base_price: 12, follower_count: 380000 },
  { twitter_handle: 'laurashin', display_name: 'Laura Shin', tier: 'C', base_price: 12, follower_count: 281000 },
  { twitter_handle: 'rleshner', display_name: 'Robert Leshner', tier: 'C', base_price: 12, follower_count: 139000 },
  { twitter_handle: 'StaniKulechov', display_name: 'Stani Kulechov', tier: 'C', base_price: 12, follower_count: 281000 },
  { twitter_handle: 'kaiynne', display_name: 'Kain Warwick', tier: 'C', base_price: 12, follower_count: 145000 },
  { twitter_handle: 'ameensol', display_name: 'Ameen Soleimani', tier: 'C', base_price: 12, follower_count: 47000 },
  { twitter_handle: 'banditxbt', display_name: 'Bandit', tier: 'C', base_price: 12, follower_count: 46000 },
  { twitter_handle: 'DegenSpartan', display_name: 'Degen Spartan', tier: 'C', base_price: 12, follower_count: 520000 },
];

async function seedInfluencers() {
  try {
    console.log('========================================');
    console.log('Starting Influencer Seed (Full Sync)');
    console.log('========================================\n');

    let inserted = 0;
    let updated = 0;

    for (const influencer of influencers) {
      try {
        const result = await db.raw(
          `INSERT INTO influencers (twitter_handle, display_name, tier, base_price, price, follower_count)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (twitter_handle) DO UPDATE SET
             display_name = EXCLUDED.display_name,
             tier = EXCLUDED.tier,
             base_price = EXCLUDED.base_price,
             price = EXCLUDED.price,
             follower_count = EXCLUDED.follower_count,
             updated_at = NOW()
           RETURNING id, (xmax = 0) as is_insert`,
          [
            influencer.twitter_handle,
            influencer.display_name,
            influencer.tier,
            influencer.base_price,
            influencer.base_price, // price = base_price initially
            influencer.follower_count || 0,
          ]
        );

        if (result.rows && result.rows.length > 0) {
          if (result.rows[0].is_insert) {
            inserted++;
            console.log(`✅ Added:   @${influencer.twitter_handle.padEnd(20)} | ${influencer.tier}-Tier | ${influencer.base_price} pts`);
          } else {
            updated++;
            console.log(`🔄 Updated: @${influencer.twitter_handle.padEnd(20)} | ${influencer.tier}-Tier | ${influencer.base_price} pts`);
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing @${influencer.twitter_handle}:`, error);
      }
    }

    console.log('\n========================================');
    console.log('Seed Summary');
    console.log('========================================');
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`🔄 Updated:  ${updated}`);
    console.log(`📊 Total:    ${influencers.length}`);
    console.log('========================================\n');

    // Verify counts
    const tierCounts = await db.raw(
      `SELECT tier, COUNT(*) as count FROM influencers GROUP BY tier ORDER BY tier`
    );

    console.log('Tier Distribution:');
    tierCounts.rows.forEach((row: any) => {
      console.log(`  ${row.tier}-Tier: ${row.count} influencers`);
    });

    console.log('\n✅ Influencer seed completed successfully!\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedInfluencers()
    .then(() => {
      console.log('Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default seedInfluencers;
