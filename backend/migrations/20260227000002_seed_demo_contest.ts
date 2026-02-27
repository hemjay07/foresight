import { Knex } from 'knex';

/**
 * CONVERTED TO NO-OP
 *
 * This migration originally tried to insert a contest with contract_contest_id: null
 * and contract_address: null, but those columns were NOT NULL in the original schema.
 * That caused a PostgreSQL constraint violation, failing the Railway build.
 *
 * The actual contest creation is handled by:
 *   - 20260227000004_fix_contract_nullable_and_seed_contest.ts (schema fix + seed)
 *   - Server startup auto-seed in server.ts
 */
export async function up(_knex: Knex): Promise<void> {
  // No-op: see 20260227000004_fix_contract_nullable_and_seed_contest.ts
}

export async function down(_knex: Knex): Promise<void> {
  // No-op
}
