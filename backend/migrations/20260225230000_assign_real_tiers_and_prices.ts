import { Knex } from 'knex';

/**
 * Assign real S/A/B/C tiers based on follower count + engagement.
 * Game design: S(4), A(16), B(30), C(50) = 100 total
 *
 * Tier logic: rank by follower_count DESC, then assign:
 *   Rank 1-4   → S-tier ($38–48)
 *   Rank 5-20  → A-tier ($25–35)
 *   Rank 21-50 → B-tier ($18–25)
 *   Rank 51-100 → C-tier ($12–18)
 *
 * Price within tier: based on engagement_rate (higher engagement = higher price)
 */
export async function up(knex: Knex): Promise<void> {
  // Step 1: Assign tiers via window function
  await knex.raw(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY follower_count DESC, engagement_rate DESC) AS rn
      FROM influencers
      WHERE is_active = true OR is_active IS NULL
    )
    UPDATE influencers
    SET tier = CASE
      WHEN ranked.rn <= 4   THEN 'S'
      WHEN ranked.rn <= 20  THEN 'A'
      WHEN ranked.rn <= 50  THEN 'B'
      ELSE                       'C'
    END
    FROM ranked
    WHERE influencers.id = ranked.id
  `);

  // Step 2: Set prices based on tier + engagement_rate percentile within tier
  await knex.raw(`
    WITH tier_prices AS (
      SELECT
        id,
        tier,
        engagement_rate,
        CASE tier
          WHEN 'S' THEN 38 + ROUND((PERCENT_RANK() OVER (PARTITION BY tier ORDER BY engagement_rate))::numeric * 10)
          WHEN 'A' THEN 25 + ROUND((PERCENT_RANK() OVER (PARTITION BY tier ORDER BY engagement_rate))::numeric * 10)
          WHEN 'B' THEN 18 + ROUND((PERCENT_RANK() OVER (PARTITION BY tier ORDER BY engagement_rate))::numeric * 7)
          ELSE          12 + ROUND((PERCENT_RANK() OVER (PARTITION BY tier ORDER BY engagement_rate))::numeric * 6)
        END AS new_price
      FROM influencers
    )
    UPDATE influencers
    SET price = tier_prices.new_price
    FROM tier_prices
    WHERE influencers.id = tier_prices.id
  `);

  console.log('✅ Assigned real S/A/B/C tiers and engagement-based prices');

  // Verify
  const counts = await knex('influencers')
    .select('tier')
    .groupBy('tier')
    .count('* as count')
    .orderBy('tier');
  console.log('Tier distribution:', JSON.stringify(counts));
}

export async function down(knex: Knex): Promise<void> {
  await knex('influencers').update({ tier: 'C', price: 12 });
}
