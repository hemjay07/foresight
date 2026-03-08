import type { Knex } from 'knex';

async function createIndexIfNotExists(
  knex: Knex,
  tableName: string,
  columns: string[],
  indexName: string,
): Promise<void> {
  const hasTable = await knex.schema.hasTable(tableName);
  if (!hasTable) return;
  const exists = await knex.raw(
    `SELECT 1 FROM pg_indexes WHERE indexname = ?`,
    [indexName],
  );
  if (exists.rows.length > 0) return;
  await knex.schema.alterTable(tableName, (table) => {
    table.index(columns, indexName);
  });
}

export async function up(knex: Knex): Promise<void> {
  await createIndexIfNotExists(knex, 'foresight_scores', ['user_id', 'tier'], 'idx_foresight_scores_user_tier');
  await createIndexIfNotExists(knex, 'user_quests_v2', ['user_id', 'quest_id'], 'idx_user_quests_v2_user_quest');
  await createIndexIfNotExists(knex, 'user_xp_ledger', ['user_id', 'earned_at'], 'idx_user_xp_ledger_user_earned');
  await createIndexIfNotExists(knex, 'prized_contest_entries', ['user_id', 'contest_id'], 'idx_prized_entries_user_contest');
  await createIndexIfNotExists(knex, 'flash_contest_entries', ['user_id', 'contest_id'], 'idx_flash_entries_user_contest');
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    { table: 'foresight_scores', index: 'idx_foresight_scores_user_tier' },
    { table: 'user_quests_v2', index: 'idx_user_quests_v2_user_quest' },
    { table: 'user_xp_ledger', index: 'idx_user_xp_ledger_user_earned' },
    { table: 'prized_contest_entries', index: 'idx_prized_entries_user_contest' },
    { table: 'flash_contest_entries', index: 'idx_flash_entries_user_contest' },
  ];

  for (const { table, index } of tables) {
    const exists = await knex.schema.hasTable(table);
    if (exists) {
      await knex.schema.alterTable(table, (t) => {
        t.dropIndex([], index);
      });
    }
  }
}
