import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Fantasy Contests (Weekly periods)
  await knex.schema.createTable('fantasy_contests', (table) => {
    table.increments('id').primary();
    table.string('contest_key').notNullable().unique();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['upcoming', 'active', 'completed']).defaultTo('upcoming');
    table.integer('total_participants').defaultTo(0);
    table.integer('max_participants').nullable();
    table.timestamps(true, true);

    table.index('status');
    table.index('start_date');
  });

  // User Teams (One per contest per user)
  await knex.schema.createTable('user_teams', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable();
    table.integer('contest_id').notNullable();
    table.string('team_name').notNullable();
    table.integer('total_score').defaultTo(0);
    table.integer('rank').nullable();
    table.boolean('is_locked').defaultTo(false);
    table.timestamp('locked_at').nullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('contest_id').references('fantasy_contests.id').onDelete('CASCADE');

    table.unique(['user_id', 'contest_id']);
    table.index('contest_id');
    table.index('total_score');
  });

  // Team Picks (Influencers selected for each team)
  await knex.schema.createTable('team_picks', (table) => {
    table.increments('id').primary();
    table.integer('team_id').notNullable();
    table.integer('influencer_id').notNullable();
    table.integer('pick_order').notNullable(); // 1, 2, 3
    table.integer('daily_points').defaultTo(0);
    table.integer('total_points').defaultTo(0);
    table.timestamps(true, true);

    table.foreign('team_id').references('user_teams.id').onDelete('CASCADE');
    table.foreign('influencer_id').references('influencers.id').onDelete('CASCADE');

    table.unique(['team_id', 'influencer_id']);
    table.index('team_id');
    table.index('influencer_id');
  });

  // Daily Votes (Users vote for best CT take each day)
  await knex.schema.createTable('daily_votes', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable();
    table.integer('influencer_id').notNullable();
    table.date('vote_date').notNullable();
    table.integer('vote_weight').defaultTo(1); // Based on user reputation
    table.string('category').defaultTo('general'); // best_alpha, best_analysis, etc.
    table.timestamps(true, true);

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('influencer_id').references('influencers.id').onDelete('CASCADE');

    table.unique(['user_id', 'vote_date', 'category']);
    table.index(['influencer_id', 'vote_date']);
    table.index('vote_date');
  });

  // Influencer Daily Scores (Aggregated from votes)
  await knex.schema.createTable('influencer_scores', (table) => {
    table.increments('id').primary();
    table.integer('influencer_id').notNullable();
    table.date('score_date').notNullable();
    table.integer('vote_count').defaultTo(0);
    table.integer('weighted_score').defaultTo(0);
    table.integer('rank_position').nullable();
    table.string('category').defaultTo('general');
    table.timestamps(true, true);

    table.foreign('influencer_id').references('influencers.id').onDelete('CASCADE');

    table.unique(['influencer_id', 'score_date', 'category']);
    table.index(['score_date', 'category']);
    table.index('weighted_score');
  });

  // Contest Leaderboard Cache (Final standings)
  await knex.schema.createTable('contest_leaderboard', (table) => {
    table.increments('id').primary();
    table.integer('contest_id').notNullable();
    table.uuid('user_id').notNullable();
    table.integer('team_id').notNullable();
    table.integer('final_score').defaultTo(0);
    table.integer('rank').notNullable();
    table.integer('xp_reward').defaultTo(0);
    table.timestamps(true, true);

    table.foreign('contest_id').references('fantasy_contests.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('team_id').references('user_teams.id').onDelete('CASCADE');

    table.unique(['contest_id', 'user_id']);
    table.index(['contest_id', 'rank']);
  });

  // Seed initial contest
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  await knex('fantasy_contests').insert({
    contest_key: 'week_1',
    start_date: startOfWeek,
    end_date: endOfWeek,
    status: 'active',
    total_participants: 0,
    max_participants: 1000,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('contest_leaderboard');
  await knex.schema.dropTableIfExists('influencer_scores');
  await knex.schema.dropTableIfExists('daily_votes');
  await knex.schema.dropTableIfExists('team_picks');
  await knex.schema.dropTableIfExists('user_teams');
  await knex.schema.dropTableIfExists('fantasy_contests');
}
