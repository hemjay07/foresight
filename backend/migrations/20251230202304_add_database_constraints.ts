import type { Knex } from "knex";

/**
 * Add database constraints for data integrity
 *
 * Adds check constraints to ensure:
 * - Scores and amounts are non-negative
 * - Percentages are between 0 and 100
 * - Counts are non-negative
 */
export async function up(knex: Knex): Promise<void> {
  // Users table constraints
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT users_ct_mastery_score_check CHECK (ct_mastery_score >= 0),
    ADD CONSTRAINT users_active_referral_count_check CHECK (active_referral_count >= 0)
  `);

  // Foresight score constraints - all score columns should be non-negative
  await knex.raw(`
    ALTER TABLE foresight_scores
    ADD CONSTRAINT foresight_scores_total_score_check CHECK (total_score >= 0),
    ADD CONSTRAINT foresight_scores_season_score_check CHECK (season_score >= 0),
    ADD CONSTRAINT foresight_scores_week_score_check CHECK (week_score >= 0),
    ADD CONSTRAINT foresight_scores_referral_score_check CHECK (referral_score >= 0),
    ADD CONSTRAINT foresight_scores_fantasy_score_check CHECK (fantasy_score >= 0),
    ADD CONSTRAINT foresight_scores_engagement_score_check CHECK (engagement_score >= 0),
    ADD CONSTRAINT foresight_scores_social_score_check CHECK (social_score >= 0),
    ADD CONSTRAINT foresight_scores_achievement_score_check CHECK (achievement_score >= 0)
  `);

  // Foresight score transactions constraints
  await knex.raw(`
    ALTER TABLE foresight_score_transactions
    ADD CONSTRAINT foresight_score_transactions_base_amount_check CHECK (base_amount >= 0),
    ADD CONSTRAINT foresight_score_transactions_multiplied_amount_check CHECK (multiplied_amount >= 0)
  `);

  // User XP constraints
  await knex.raw(`
    ALTER TABLE user_xp_totals
    ADD CONSTRAINT user_xp_totals_total_xp_check CHECK (total_xp >= 0),
    ADD CONSTRAINT user_xp_totals_current_level_check CHECK (current_level >= 1),
    ADD CONSTRAINT user_xp_totals_xp_to_next_level_check CHECK (xp_to_next_level > 0)
  `);

  await knex.raw(`
    ALTER TABLE xp_actions
    ADD CONSTRAINT xp_actions_xp_amount_check CHECK (xp_amount >= 0)
  `);

  // Contest constraints
  await knex.raw(`
    ALTER TABLE fantasy_contests
    ADD CONSTRAINT fantasy_contests_entry_fee_check CHECK (entry_fee >= 0),
    ADD CONSTRAINT fantasy_contests_prize_pool_check CHECK (prize_pool >= 0),
    ADD CONSTRAINT fantasy_contests_max_participants_check CHECK (max_participants IS NULL OR max_participants > 0),
    ADD CONSTRAINT fantasy_contests_total_participants_check CHECK (total_participants >= 0)
  `);

  // Influencer constraints
  await knex.raw(`
    ALTER TABLE influencers
    ADD CONSTRAINT influencers_follower_count_check CHECK (follower_count >= 0),
    ADD CONSTRAINT influencers_price_check CHECK (price >= 0),
    ADD CONSTRAINT influencers_base_price_check CHECK (base_price >= 0),
    ADD CONSTRAINT influencers_total_points_check CHECK (total_points >= 0),
    ADD CONSTRAINT influencers_form_score_check CHECK (form_score >= 0)
  `);

  // Team constraints
  await knex.raw(`
    ALTER TABLE user_teams
    ADD CONSTRAINT user_teams_total_score_check CHECK (total_score >= 0),
    ADD CONSTRAINT user_teams_budget_used_check CHECK (budget_used >= 0),
    ADD CONSTRAINT user_teams_budget_used_max_check CHECK (budget_used <= 100000)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all constraints in reverse order
  await knex.raw('ALTER TABLE user_teams DROP CONSTRAINT IF EXISTS user_teams_budget_used_max_check');
  await knex.raw('ALTER TABLE user_teams DROP CONSTRAINT IF EXISTS user_teams_budget_used_check');
  await knex.raw('ALTER TABLE user_teams DROP CONSTRAINT IF EXISTS user_teams_total_score_check');

  await knex.raw('ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_form_score_check');
  await knex.raw('ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_total_points_check');
  await knex.raw('ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_base_price_check');
  await knex.raw('ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_price_check');
  await knex.raw('ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_follower_count_check');

  await knex.raw('ALTER TABLE fantasy_contests DROP CONSTRAINT IF EXISTS fantasy_contests_total_participants_check');
  await knex.raw('ALTER TABLE fantasy_contests DROP CONSTRAINT IF EXISTS fantasy_contests_max_participants_check');
  await knex.raw('ALTER TABLE fantasy_contests DROP CONSTRAINT IF EXISTS fantasy_contests_prize_pool_check');
  await knex.raw('ALTER TABLE fantasy_contests DROP CONSTRAINT IF EXISTS fantasy_contests_entry_fee_check');

  await knex.raw('ALTER TABLE xp_actions DROP CONSTRAINT IF EXISTS xp_actions_xp_amount_check');

  await knex.raw('ALTER TABLE user_xp_totals DROP CONSTRAINT IF EXISTS user_xp_totals_xp_to_next_level_check');
  await knex.raw('ALTER TABLE user_xp_totals DROP CONSTRAINT IF EXISTS user_xp_totals_current_level_check');
  await knex.raw('ALTER TABLE user_xp_totals DROP CONSTRAINT IF EXISTS user_xp_totals_total_xp_check');

  await knex.raw('ALTER TABLE foresight_score_transactions DROP CONSTRAINT IF EXISTS foresight_score_transactions_multiplied_amount_check');
  await knex.raw('ALTER TABLE foresight_score_transactions DROP CONSTRAINT IF EXISTS foresight_score_transactions_base_amount_check');

  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_achievement_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_social_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_engagement_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_fantasy_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_referral_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_week_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_season_score_check');
  await knex.raw('ALTER TABLE foresight_scores DROP CONSTRAINT IF EXISTS foresight_scores_total_score_check');

  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_active_referral_count_check');
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_ct_mastery_score_check');
}
