/**
 * Update influencer pricing for fantasy league
 * S-tier: 10-12M, A-tier: 6-9M, B-tier: 3-5M
 */

import db from '../utils/db';

async function updatePricing() {
  try {
    console.log('Updating influencer pricing...');

    const pricingUpdates = [
      // S-Tier (10-12M) - Top tier
      { handle: 'VitalikButerin', price: 12.0, tier: 'S' },
      { handle: 'cz_binance', price: 11.5, tier: 'S' },
      { handle: 'elonmusk', price: 11.0, tier: 'S' },
      { handle: 'brian_armstrong', price: 10.5, tier: 'S' },
      { handle: 'APompliano', price: 10.0, tier: 'S' },
      { handle: 'barton_options', price: 10.0, tier: 'S' },
      { handle: 'cobie', price: 10.0, tier: 'S' },

      // A-Tier (6-9M)
      { handle: 'CryptoCobain', price: 8.0, tier: 'A' },
      { handle: 'sassal0x', price: 7.5, tier: 'A' },
      { handle: 'DefiIgnas', price: 7.0, tier: 'A' },
      { handle: 'inversebrah', price: 6.5, tier: 'A' },
      { handle: 'layaheilpern', price: 6.5, tier: 'A' },
      { handle: 'rektcapital', price: 6.0, tier: 'A' },
      { handle: 'AltcoinGordon', price: 6.0, tier: 'A' },

      // B-Tier (3-5M)
      { handle: 'IvanOnTech', price: 5.0, tier: 'B' },
      { handle: 'CryptosRUs', price: 4.5, tier: 'B' },
      { handle: 'CryptoWendyO', price: 4.0, tier: 'B' },
      { handle: 'WhalePanda', price: 3.5, tier: 'B' },
      { handle: 'ThinkingUSD', price: 3.0, tier: 'B' },
      { handle: 'JackTheRippler', price: 3.0, tier: 'B' },
    ];

    for (const update of pricingUpdates) {
      await db('influencers')
        .where({ twitter_handle: update.handle })
        .update({
          price: update.price,
          tier: update.tier,
        });

      console.log(`✓ @${update.handle}: ${update.price}M (${update.tier}-tier)`);
    }

    console.log('\n✅ All influencer pricing updated!');
    console.log('\nTeam Budget: 25M');
    console.log('Team Size: 5 influencers');
    console.log('Example team: Vitalik (12M) + Cobie (8.5M) + Lark (3M) + DonAlt (3M) = 26.5M (over budget!)');
    console.log('Valid team: Elon (11M) + Loomdart (7.5M) + Crypto Cred (4M) + Lark (3M) = 25.5M (need cheaper!)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating pricing:', error);
    process.exit(1);
  }
}

updatePricing();
