import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Main foresight drops table
  await knex.schema.createTable('foresight_drops', (table) => {
    table.increments('id').primary();
    table.date('drop_date').notNullable().unique().comment('Date for this foresight drop (one per day)');

    // Core narrative data
    table.json('narratives').notNullable().comment('Array of {name, probability, trend, description}');
    table.json('token_signals').notNullable().comment('Array of {symbol, rotation_probability, momentum, reason}');
    table.json('influencer_shifts').notNullable().comment('Array of {handle, impact_change, velocity, topics}');

    // Daily insights
    table.string('sentiment_temperature', 20).notNullable().comment('hot/warm/neutral/cool/cold');
    table.integer('sentiment_score').notNullable().comment('Numeric score 0-100');
    table.text('one_thing_matters').notNullable().comment('The single most important insight today');
    table.text('summary').notNullable().comment('2-3 sentence overview of today\'s CT landscape');

    // Metadata
    table.boolean('is_published').defaultTo(false).comment('Admin can draft before publishing');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('drop_date');
    table.index('is_published');
  });

  // User reading tracking
  await knex.schema.createTable('foresight_user_reads', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('drop_id').unsigned().notNullable().references('id').inTable('foresight_drops').onDelete('CASCADE');
    table.timestamp('read_at').defaultTo(knex.fn.now());
    table.boolean('xp_awarded').defaultTo(false).comment('Track if +2 XP was given');

    // Reading metrics
    table.integer('time_spent_seconds').defaultTo(0).comment('How long user viewed the drop');

    table.unique(['user_id', 'drop_id']); // One read per user per drop
    table.index('user_id');
    table.index('drop_id');
    table.index('read_at');
  });

  // User streak tracking
  await knex.schema.createTable('foresight_user_stats', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');

    // Streak data
    table.integer('current_streak').defaultTo(0).comment('Consecutive days reading foresight');
    table.integer('best_streak').defaultTo(0).comment('All-time longest streak');
    table.date('last_read_date').nullable().comment('Last date user read a drop');

    // Total stats
    table.integer('total_drops_read').defaultTo(0);
    table.integer('total_xp_earned').defaultTo(0).comment('Total XP from foresight drops');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('current_streak');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('foresight_user_stats');
  await knex.schema.dropTableIfExists('foresight_user_reads');
  await knex.schema.dropTableIfExists('foresight_drops');
}
