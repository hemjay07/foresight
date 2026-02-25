import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Fix NULL tiers - default to 'C' if missing
  await knex('influencers').whereNull('tier').update({ tier: 'C' });

  // Update prices by tier (these are the correct demo values)
  await knex('influencers')
    .where('tier', 'S')
    .where(knex.raw('price < 30'))
    .update({ price: 40 });

  await knex('influencers')
    .where('tier', 'A')
    .where(knex.raw('price < 20'))
    .update({ price: 28 });

  await knex('influencers')
    .where('tier', 'B')
    .where(knex.raw('price < 15'))
    .update({ price: 20 });

  await knex('influencers')
    .where('tier', 'C')
    .where(knex.raw('price > 15 OR price < 10'))
    .update({ price: 12 });

  console.log('✅ Fixed NULL tiers and normalized prices');
}

export async function down(knex: Knex): Promise<void> {
  // No-op - can't safely reverse tier assignments
  console.log('⚠️  Migration 20260225220000 does not support rollback');
}
