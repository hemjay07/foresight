import type { Knex } from 'knex';

/**
 * Deactivate quests that depend on features not yet implemented
 *
 * Deferred to V2:
 * - daily_prediction - Prediction system (collaboration with prediction SDK app)
 * - achieve_oracle - Prediction streak achievement
 *
 * Features not built:
 * - daily_share_take - Share/take feature
 * - achieve_viral_pick - Viral detection algorithm
 * - achieve_diamond_hands - Team persistence tracking
 */
export async function up(knex: Knex): Promise<void> {
  const questsToDeactivate = [
    'daily_prediction',
    'achieve_oracle',
    'daily_share_take',
    'achieve_viral_pick',
    'achieve_diamond_hands',
  ];

  await knex('quest_definitions_v2')
    .whereIn('id', questsToDeactivate)
    .update({ is_active: false });

  console.log(`[Migration] Deactivated ${questsToDeactivate.length} unimplemented quests`);
}

export async function down(knex: Knex): Promise<void> {
  const questsToReactivate = [
    'daily_prediction',
    'achieve_oracle',
    'daily_share_take',
    'achieve_viral_pick',
    'achieve_diamond_hands',
  ];

  await knex('quest_definitions_v2')
    .whereIn('id', questsToReactivate)
    .update({ is_active: true });

  console.log(`[Migration] Reactivated ${questsToReactivate.length} quests`);
}
