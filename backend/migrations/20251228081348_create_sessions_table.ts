import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create sessions table for JWT token management
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('access_token').notNullable();
    table.text('refresh_token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Index for faster lookups
    table.index('user_id');
    table.index('access_token');
    table.index('refresh_token');
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sessions');
}
