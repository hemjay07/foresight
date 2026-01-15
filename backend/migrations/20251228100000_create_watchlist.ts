import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create user_watchlist table for scouted influencers
  await knex.schema.createTable('user_watchlist', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('influencer_id').notNullable().references('id').inTable('influencers').onDelete('CASCADE');
    table.text('notes').nullable(); // Optional notes about why they scouted
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Each user can only scout an influencer once
    table.unique(['user_id', 'influencer_id']);

    // Indexes for fast lookups
    table.index('user_id');
    table.index('influencer_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_watchlist');
}
