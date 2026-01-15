import type { Knex } from "knex";

/**
 * Transfer System Migration
 *
 * Enables mid-week team changes with tier-based free transfers
 *
 * Tier Benefits:
 * - Bronze: 1 free transfer/week
 * - Silver: 1 free transfer/week
 * - Gold: 2 free transfers/week
 * - Platinum: 3 free transfers/week
 * - Diamond: 5 free transfers/week
 *
 * Extra transfers cost 50 FS each
 */

export async function up(knex: Knex): Promise<void> {
  // Create transfers table
  await knex.schema.createTable('team_transfers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('team_id').notNullable().references('id').inTable('user_teams').onDelete('CASCADE');
    table.integer('contest_id').references('id').inTable('fantasy_contests').onDelete('SET NULL');

    // Transfer details
    table.integer('out_influencer_id').notNullable().references('id').inTable('influencers');
    table.integer('in_influencer_id').notNullable().references('id').inTable('influencers');

    // Was this a free transfer or paid with FS?
    table.boolean('is_free').notNullable().default(true);
    table.integer('fs_cost').notNullable().default(0); // FS spent (0 for free transfers)

    // Transfer week (for tracking weekly limits)
    table.integer('week_number').notNullable();
    table.integer('year').notNullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'week_number', 'year'], 'idx_transfers_user_week');
    table.index(['team_id', 'contest_id'], 'idx_transfers_team_contest');
  });

  // Create weekly transfer limits config table
  await knex.schema.createTable('transfer_tier_limits', (table) => {
    table.string('tier').primary();
    table.integer('free_transfers_per_week').notNullable().default(1);
    table.integer('extra_transfer_fs_cost').notNullable().default(50);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Insert tier limits
  await knex('transfer_tier_limits').insert([
    { tier: 'bronze', free_transfers_per_week: 1, extra_transfer_fs_cost: 50 },
    { tier: 'silver', free_transfers_per_week: 1, extra_transfer_fs_cost: 50 },
    { tier: 'gold', free_transfers_per_week: 2, extra_transfer_fs_cost: 50 },
    { tier: 'platinum', free_transfers_per_week: 3, extra_transfer_fs_cost: 50 },
    { tier: 'diamond', free_transfers_per_week: 5, extra_transfer_fs_cost: 50 },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('team_transfers');
  await knex.schema.dropTableIfExists('transfer_tier_limits');
}

