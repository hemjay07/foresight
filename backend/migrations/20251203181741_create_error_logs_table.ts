import type { Knex } from "knex";

/**
 * Create error_logs table for centralized error tracking
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('error_logs', (table) => {
    table.increments('id').primary();

    // Error details
    table.string('error_type').notNullable(); // 'frontend', 'backend', 'api'
    table.string('severity').notNullable().defaultTo('error'); // 'error', 'warning', 'critical'
    table.text('message').notNullable();
    table.text('stack_trace');

    // Context
    table.string('component'); // React component name or API route
    table.string('user_action'); // What user was trying to do
    table.json('metadata'); // Additional context (browser, device, etc.)

    // User identification (optional)
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('wallet_address');
    table.string('session_id');

    // Request details (for API errors)
    table.string('url');
    table.string('method'); // GET, POST, etc.
    table.integer('status_code');

    // Environment
    table.string('environment').defaultTo('production'); // 'development', 'staging', 'production'
    table.string('app_version');

    // Tracking
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.boolean('resolved').defaultTo(false);
    table.timestamp('resolved_at');

    // Indexes for efficient querying
    table.index(['error_type', 'created_at']);
    table.index(['severity', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['resolved', 'created_at']);
  });

  console.log('✅ Created error_logs table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('error_logs');
  console.log('✅ Dropped error_logs table');
}

