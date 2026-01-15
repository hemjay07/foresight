import type { Knex } from 'knex';

/**
 * Create tables for Prized CT Draft contests
 * These tables sync with the CTDraftPrized smart contract
 */
export async function up(knex: Knex): Promise<void> {
  // Prized contests table - synced from contract
  await knex.schema.createTable('prized_contests', (table) => {
    table.increments('id').primary();
    table.integer('contract_contest_id').unique().notNullable();
    table.string('contract_address', 42).notNullable();
    table.decimal('entry_fee', 18, 8).notNullable();
    table.integer('min_players').defaultTo(0);
    table.integer('max_players').defaultTo(0); // 0 = unlimited
    table.timestamp('lock_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.decimal('prize_pool', 18, 8).defaultTo(0);
    table.decimal('distributable_pool', 18, 8).defaultTo(0); // After 15% fee
    table.integer('player_count').defaultTo(0);
    table.enum('status', ['open', 'locked', 'scoring', 'finalized', 'cancelled']).defaultTo('open');
    table.string('name', 100).defaultTo('Weekly CT Draft');
    table.text('description').nullable();
    table.string('create_tx_hash', 66).nullable();
    table.string('lock_tx_hash', 66).nullable();
    table.string('finalize_tx_hash', 66).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('status');
    table.index('lock_time');
    table.index('end_time');
  });

  // Prized entries table - synced from contract
  await knex.schema.createTable('prized_entries', (table) => {
    table.increments('id').primary();
    table.integer('contest_id').references('id').inTable('prized_contests').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').nullable(); // Linked after wallet match
    table.string('wallet_address', 42).notNullable();
    table.specificType('team_ids', 'integer[]').notNullable(); // Array of 5 influencer IDs
    table.integer('captain_id').notNullable();
    table.decimal('paid_amount', 18, 8).notNullable();
    table.integer('rank').nullable(); // Set after finalization
    table.decimal('prize_amount', 18, 8).nullable(); // Set after finalization
    table.decimal('score', 10, 2).nullable(); // Calculated by backend
    table.jsonb('score_breakdown').nullable(); // Detailed scoring breakdown
    table.boolean('claimed').defaultTo(false);
    table.string('entry_tx_hash', 66).nullable();
    table.string('update_tx_hash', 66).nullable(); // Last team update tx
    table.string('claim_tx_hash', 66).nullable();
    table.string('refund_tx_hash', 66).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['contest_id', 'wallet_address']);
    table.index('user_id');
    table.index('wallet_address');
    table.index('rank');
  });

  // Prize claims history
  await knex.schema.createTable('prize_claims', (table) => {
    table.increments('id').primary();
    table.integer('entry_id').references('id').inTable('prized_entries').onDelete('CASCADE');
    table.integer('contest_id').references('id').inTable('prized_contests').onDelete('CASCADE');
    table.string('wallet_address', 42).notNullable();
    table.decimal('amount', 18, 8).notNullable();
    table.string('tx_hash', 66).notNullable();
    table.integer('rank').notNullable();
    table.timestamp('claimed_at').defaultTo(knex.fn.now());

    table.index('wallet_address');
    table.index('contest_id');
  });

  // Contract events log - for debugging and audit
  await knex.schema.createTable('prized_contract_events', (table) => {
    table.increments('id').primary();
    table.string('event_name', 50).notNullable();
    table.integer('contest_id').nullable();
    table.string('wallet_address', 42).nullable();
    table.string('tx_hash', 66).notNullable();
    table.integer('block_number').notNullable();
    table.integer('log_index').notNullable();
    table.jsonb('event_data').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['tx_hash', 'log_index']);
    table.index('event_name');
    table.index('contest_id');
    table.index('block_number');
  });

  // Platform fee tracking
  await knex.schema.createTable('platform_fees', (table) => {
    table.increments('id').primary();
    table.integer('contest_id').references('id').inTable('prized_contests').onDelete('CASCADE');
    table.decimal('amount', 18, 8).notNullable();
    table.string('tx_hash', 66).notNullable();
    table.timestamp('collected_at').defaultTo(knex.fn.now());

    table.index('contest_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('platform_fees');
  await knex.schema.dropTableIfExists('prized_contract_events');
  await knex.schema.dropTableIfExists('prize_claims');
  await knex.schema.dropTableIfExists('prized_entries');
  await knex.schema.dropTableIfExists('prized_contests');
}
