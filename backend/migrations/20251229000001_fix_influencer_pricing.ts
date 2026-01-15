import type { Knex } from 'knex';

/**
 * Fix influencer pricing to create meaningful salary cap constraints
 *
 * PROBLEM: Current S-tier at $28 means 5×S = $140 (under $150 budget)
 *          This defeats the purpose of salary caps!
 *
 * SOLUTION: Variable pricing based on performance within tiers
 *   - S-tier: $38-48 (elite players, max 2 affordable)
 *   - A-tier: $28-36 (strong performers)
 *   - B-tier: $22-28 (solid picks)
 *   - C-tier: $15-22 (value plays)
 *
 * MATH VALIDATION:
 *   Budget: 150
 *   5×S(avg $43) = 215 ❌ Over budget
 *   5×A(avg $32) = 160 ❌ Over budget
 *   2S + 2B + 1C = 86 + 50 + 18 = 154 ❌ Tight
 *   2S + 1B + 2C = 86 + 25 + 36 = 147 ✅ Works
 *   1S + 2A + 1B + 1C = 43 + 64 + 25 + 18 = 150 ✅ Exact!
 */

interface PriceRange {
  min: number;
  max: number;
}

const TIER_PRICES: Record<string, PriceRange> = {
  S: { min: 38, max: 48 },
  A: { min: 28, max: 36 },
  B: { min: 22, max: 28 },
  C: { min: 15, max: 22 },
};

export async function up(knex: Knex): Promise<void> {
  // Get all active influencers with their performance data
  const influencers = await knex('influencers')
    .select('id', 'twitter_handle', 'tier', 'total_points', 'engagement_rate')
    .where('is_active', true);

  // Group by tier to calculate relative positions
  const byTier: Record<string, typeof influencers> = {};
  for (const inf of influencers) {
    if (!byTier[inf.tier]) byTier[inf.tier] = [];
    byTier[inf.tier].push(inf);
  }

  // Calculate new prices
  const updates: { id: number; price: number }[] = [];

  for (const [tier, infs] of Object.entries(byTier)) {
    const priceRange = TIER_PRICES[tier];
    if (!priceRange) continue;

    // Sort by total_points descending
    infs.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

    // Find min/max points in this tier
    const points = infs.map(i => i.total_points || 0);
    const minPoints = Math.min(...points);
    const maxPoints = Math.max(...points);
    const pointsRange = maxPoints - minPoints || 1;

    for (const inf of infs) {
      // Normalize position (0 = lowest points, 1 = highest points)
      const normalized = ((inf.total_points || 0) - minPoints) / pointsRange;

      // Map to price range (higher points = higher price)
      const priceSpread = priceRange.max - priceRange.min;
      const newPrice = priceRange.min + (normalized * priceSpread);

      // Round to nearest dollar
      const finalPrice = Math.round(newPrice);

      updates.push({ id: inf.id, price: finalPrice });

      console.log(`${inf.twitter_handle} (${tier}): $${inf.tier === tier ? finalPrice : 'N/A'} (points: ${inf.total_points})`);
    }
  }

  // Apply updates
  for (const update of updates) {
    await knex('influencers')
      .where('id', update.id)
      .update({ price: update.price });
  }

  console.log(`\n✅ Updated ${updates.length} influencer prices`);

  // Log summary
  const summary = await knex('influencers')
    .select('tier')
    .avg('price as avg_price')
    .min('price as min_price')
    .max('price as max_price')
    .where('is_active', true)
    .groupBy('tier')
    .orderBy('tier');

  console.log('\n📊 New pricing summary:');
  for (const row of summary) {
    console.log(`  ${row.tier}-tier: $${row.min_price} - $${row.max_price} (avg: $${Math.round(Number(row.avg_price))})`);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Restore original flat pricing
  const originalPrices: Record<string, number> = {
    S: 28,
    A: 22,
    B: 18,
    C: 12,
  };

  for (const [tier, price] of Object.entries(originalPrices)) {
    await knex('influencers')
      .where('tier', tier)
      .update({ price });
  }

  console.log('Restored original flat pricing');
}
