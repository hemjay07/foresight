import type { Knex } from 'knex';

/**
 * Daily Activities Tracking
 * Prevents duplicate FS awards for daily activities like browse_ct_feed
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_daily_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('activity_type', 50).notNullable(); // 'browse_ct_feed', 'daily_login', etc.
    table.date('activity_date').notNullable();
    table.integer('duration_seconds').nullable(); // For time-based activities
    table.jsonb('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Unique constraint: one activity per user per type per day
    table.unique(['user_id', 'activity_type', 'activity_date']);

    // Indexes
    table.index('user_id');
    table.index('activity_type');
    table.index('activity_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_daily_activities');
}
