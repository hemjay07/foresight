import type { Knex } from 'knex';

/**
 * Add avg_likes and avg_retweets columns to influencers table.
 * The refresh endpoint calculates these but had nowhere to store them.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('influencers', (table) => {
    table.integer('avg_likes').defaultTo(0);
    table.integer('avg_retweets').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('influencers', (table) => {
    table.dropColumn('avg_likes');
    table.dropColumn('avg_retweets');
  });
}
