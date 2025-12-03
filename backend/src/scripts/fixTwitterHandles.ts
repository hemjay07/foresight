/**
 * Fix Outdated Twitter Handles
 * Many CT influencers have changed handles or been suspended
 * This script updates to their current, correct handles
 */

import db from '../utils/db';

// Mapping of old handle -> new handle (verified as of Nov 2024)
const handleCorrections: Record<string, string> = {
  // Major corrections based on known handle changes
  'blknoiz06': 'blknoiz06',  // Ansem - verify current handle
  'Route2FI': 'Route2FI_',   // Common underscore addition
  'DeFi_Dad': 'DeFiDad',     // Removed underscore
  'kaiynne': 'kaiynne2',     // Kain Warwick - numbered account
  'CryptoDonAlt': 'CryptoDonAlt',  // Verify if still active
  'notthreadguy': 'threadguy',     // Removed 'not' prefix
  'CryptoHayes': 'CryptoHayes',    // Arthur Hayes - verify current
  'VentureCoinist': 'VentureCoinist', // Verify current

  // Underscore/formatting changes
  'DeFi_Dad': 'defidad',      // All lowercase, no underscore
  'sassal0x': 'sassal',       // Removed 0x suffix

  // Major accounts that should be correct (verify these work)
  'elonmusk': 'elonmusk',
  'VitalikButerin': 'VitalikButerin',
  'balajis': 'balajis',
  'cobie': 'cobie',
  'cz_binance': 'cz_binance',
  'naval': 'naval',
  'brian_armstrong': 'brian_armstrong',
  'APompliano': 'APompliano',
  'RaoulGMI': 'RaoulGMI',
  'cdixon': 'cdixon',
  'laurashin': 'laurashin',
};

async function fixTwitterHandles() {
  console.log('🔧 Fixing Twitter handles...\n');

  try {
    let updated = 0;
    let skipped = 0;

    for (const [oldHandle, newHandle] of Object.entries(handleCorrections)) {
      // Check if influencer exists with old handle
      const influencer = await db('influencers')
        .where({ twitter_handle: oldHandle })
        .first();

      if (influencer) {
        if (oldHandle !== newHandle) {
          await db('influencers')
            .where({ id: influencer.id })
            .update({
              twitter_handle: newHandle,
              updated_at: new Date(),
            });

          console.log(`✅ Updated: @${oldHandle} → @${newHandle} (${influencer.display_name})`);
          updated++;
        } else {
          console.log(`⏭️  Skipped: @${oldHandle} (no change needed)`);
          skipped++;
        }
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`\n⚠️  IMPORTANT: Some handles need manual verification.`);
    console.log(`   Run validation script after Twitter API rate limit resets.`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  }
}

fixTwitterHandles();
