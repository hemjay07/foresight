import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Fix min_players from 2 to 1 for small contest prize rules
  await knex('prize_distribution_rules')
    .where('min_players', 2)
    .where('max_players', 9)
    .update({ min_players: 1 });
}

export async function down(knex: Knex): Promise<void> {
  await knex('prize_distribution_rules')
    .where('min_players', 1)
    .where('max_players', 9)
    .update({ min_players: 2 });
}
