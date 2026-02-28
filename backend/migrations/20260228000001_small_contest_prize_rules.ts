import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add prize distribution rules for small contests (2-9 players)
  // These are needed for testing and for early launch when player counts are low
  await knex('prize_distribution_rules').insert([
    { min_players: 1, max_players: 9, rank: 1, percentage: 50, label: '1st' },
    { min_players: 1, max_players: 9, rank: 2, percentage: 30, label: '2nd' },
    { min_players: 1, max_players: 9, rank: 3, percentage: 20, label: '3rd' },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex('prize_distribution_rules')
    .where('min_players', 1)
    .where('max_players', 9)
    .del();
}
