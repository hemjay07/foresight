import type { Knex } from 'knex';

/**
 * Fix: actual handle is 73lv_ (lowercase L), not 73IV_ (uppercase I).
 * Previous migration matched 0 rows.
 */
export async function up(knex: Knex): Promise<void> {
  await knex('influencers')
    .where('twitter_handle', '73lv_')
    .update({
      twitter_handle: 'Crypto_Leon_',
      display_name: 'CryptoLeon',
      avatar_url: null,
      follower_count: 0,
      engagement_rate: 0,
      updated_at: knex.fn.now(),
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex('influencers')
    .where('twitter_handle', 'Crypto_Leon_')
    .update({
      twitter_handle: '73lv_',
      display_name: '73lv',
      avatar_url: null,
      follower_count: 0,
      engagement_rate: 0,
      updated_at: knex.fn.now(),
    });
}
