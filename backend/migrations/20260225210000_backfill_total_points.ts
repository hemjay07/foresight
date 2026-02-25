import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Backfill total_points from free_league_entries scores
  // For each influencer, sum all scores from contests where they were on a team
  await knex.raw(`
    UPDATE influencers i
    SET total_points = COALESCE(subq.calculated_points, 0)
    FROM (
      SELECT
        unnested_id AS influencer_id,
        COALESCE(SUM(e.score), 0)::int AS calculated_points
      FROM free_league_entries e
      CROSS JOIN LATERAL UNNEST(e.team_ids) AS unnested_id(influencer_id)
      WHERE e.score IS NOT NULL AND e.score > 0
      GROUP BY unnested_id
    ) subq
    WHERE i.id = subq.influencer_id
  `);

  console.log('✅ Backfilled total_points for influencers');
}

export async function down(knex: Knex): Promise<void> {
  await knex('influencers').update({ total_points: 0 });
  console.log('✅ Reset total_points for influencers');
}
