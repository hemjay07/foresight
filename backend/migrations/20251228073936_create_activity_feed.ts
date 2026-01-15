import type { Knex } from "knex";

/**
 * Activity Feed Migration
 *
 * Stores user activities for social proof and engagement
 * Examples: "UserX drafted team", "UserY claimed quest", "UserZ made transfer"
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity_feed', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Activity type for filtering/icons
    table.string('activity_type').notNullable(); // draft_team, claim_quest, transfer, vote, earn_fs, etc.

    // Human-readable message
    table.string('message').notNullable(); // "drafted their team", "claimed Daily Login quest"

    // Optional metadata (JSON) for rich display
    table.jsonb('metadata').nullable(); // { teamName: "Alpha Squad", questName: "Daily Login", etc }

    // For privacy: some activities can be public, some private
    table.boolean('is_public').notNullable().default(true);

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index('created_at', 'idx_activity_created');
    table.index(['user_id', 'created_at'], 'idx_activity_user_created');
    table.index(['activity_type', 'created_at'], 'idx_activity_type_created');
    table.index('is_public', 'idx_activity_public');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activity_feed');
}

