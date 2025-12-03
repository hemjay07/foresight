import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add monetization tracking columns to users table
  await knex.schema.table('users', (table) => {
    // Only add columns that don't exist
    // referral_code already exists
    table.uuid('referred_by').nullable();
    table.integer('active_referral_count').defaultTo(0);
    table.timestamp('first_referral_at').nullable();

    // Founding member tracking (for future airdrops)
    table.boolean('is_founding_member').defaultTo(false);
    table.integer('founding_member_number').nullable().unique();
    table.timestamp('joined_at').defaultTo(knex.fn.now());

    // Early adoption metrics (valuable for token distribution)
    table.integer('referral_quality_score').defaultTo(0);
    table.integer('total_referral_xp_earned').defaultTo(0);

    // Foreign key
    table.foreign('referred_by').references('id').inTable('users').onDelete('SET NULL');

    // Indexes for performance
    table.index('referred_by');
    table.index('is_founding_member');
    table.index('founding_member_number');
  });

  // Referral events table (track all referral actions for analytics)
  await knex.schema.createTable('referral_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('referrer_id').notNullable();
    table.uuid('referee_id').notNullable();
    table.string('event_type').notNullable(); // 'signup', 'first_team', 'week_complete', 'level_5'
    table.integer('xp_awarded').defaultTo(0);
    table.jsonb('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('referrer_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('referee_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index('referrer_id');
    table.index('referee_id');
    table.index('event_type');
    table.index('created_at');
  });

  // Referral milestones table
  await knex.schema.createTable('referral_milestones', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('milestone_type').notNullable();
    table.integer('threshold').notNullable();
    table.timestamp('achieved_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Unique constraint
    table.unique(['user_id', 'milestone_type']);

    // Indexes
    table.index('user_id');
    table.index('milestone_type');
  });

  // Update existing users to have joined_at from created_at
  await knex.raw(`
    UPDATE users
    SET joined_at = created_at
    WHERE joined_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('referral_milestones');
  await knex.schema.dropTableIfExists('referral_events');

  await knex.schema.table('users', (table) => {
    table.dropColumn('referred_by');
    table.dropColumn('active_referral_count');
    table.dropColumn('first_referral_at');
    table.dropColumn('is_founding_member');
    table.dropColumn('founding_member_number');
    table.dropColumn('joined_at');
    table.dropColumn('referral_quality_score');
    table.dropColumn('total_referral_xp_earned');
  });
}
