import { Knex } from 'knex';

/**
 * CONVERTED TO NO-OP
 *
 * Same issue as 20260227000002: contract_contest_id and contract_address were
 * NOT NULL, so any insert with null values failed. No-op now.
 *
 * Actual fix: 20260227000004_fix_contract_nullable_and_seed_contest.ts
 */
export async function up(_knex: Knex): Promise<void> {
  // No-op: see 20260227000004_fix_contract_nullable_and_seed_contest.ts
}

export async function down(_knex: Knex): Promise<void> {
  // No-op
}
