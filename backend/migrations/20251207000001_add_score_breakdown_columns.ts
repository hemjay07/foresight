import type { Knex } from 'knex';

/**
 * Add score breakdown columns to team_picks for detailed scoring UI
 * Supports the V2 scoring formula:
 * - Activity Score (0-35 pts)
 * - Engagement Score (0-60 pts)
 * - Growth Score (0-40 pts)
 * - Viral Score (0-25 pts)
 */
export async function up(knex: Knex): Promise<void> {
  // Add breakdown columns to team_picks
  await knex.schema.alterTable('team_picks', (table) => {
    table.decimal('activity_score', 6, 2).defaultTo(0);
    table.decimal('engagement_score', 6, 2).defaultTo(0);
    table.decimal('growth_score', 6, 2).defaultTo(0);
    table.decimal('viral_score', 6, 2).defaultTo(0);
    table.decimal('captain_bonus', 6, 2).defaultTo(0);
    table.decimal('spotlight_bonus', 6, 2).defaultTo(0);
    table.jsonb('score_details').nullable(); // Store detailed breakdown as JSON
  });

  // Add score version tracking to user_teams
  await knex.schema.alterTable('user_teams', (table) => {
    table.string('scoring_version', 10).defaultTo('v2'); // Track which formula was used
    table.jsonb('score_summary').nullable(); // Team-level score summary
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('team_picks', (table) => {
    table.dropColumn('activity_score');
    table.dropColumn('engagement_score');
    table.dropColumn('growth_score');
    table.dropColumn('viral_score');
    table.dropColumn('captain_bonus');
    table.dropColumn('spotlight_bonus');
    table.dropColumn('score_details');
  });

  await knex.schema.alterTable('user_teams', (table) => {
    table.dropColumn('scoring_version');
    table.dropColumn('score_summary');
  });
}
