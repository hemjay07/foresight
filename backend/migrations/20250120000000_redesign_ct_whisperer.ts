import type { Knex } from 'knex';

/**
 * CT Whisperer v2 - Sentiment/Stance Game
 *
 * New Design: "What would [Influencer] say about [Topic]?"
 * - Un-searchable (can't Google opinions)
 * - Tests real CT knowledge
 * - Non-monetized (just XP/reputation)
 */

export async function up(knex: Knex): Promise<void> {
  // Drop old whisperer tables if they exist (from previous migration)
  // Must drop dependent tables first due to foreign key constraints
  await knex.schema.dropTableIfExists('whisperer_attempts');
  await knex.schema.dropTableIfExists('whisperer_leaderboard');
  await knex.schema.dropTableIfExists('whisperer_tweets');
  await knex.schema.dropTableIfExists('whisperer_guesses');
  await knex.schema.dropTableIfExists('whisperer_daily_challenges');
  await knex.schema.dropTableIfExists('whisperer_user_stats');
  await knex.schema.dropTableIfExists('whisperer_user_answers');
  await knex.schema.dropTableIfExists('whisperer_questions');

  // 1. Whisperer Questions
  await knex.schema.createTable('whisperer_questions', (table) => {
    table.increments('id').primary();

    // Question details
    table.integer('influencer_id').unsigned().notNullable();
    table.string('topic', 255).notNullable(); // e.g., "Solana vs Ethereum for DeFi"
    table.text('question').notNullable(); // e.g., "What's Vitalik's stance on..."
    table.string('category', 50).notNullable(); // 'tech', 'market', 'governance', 'culture'
    table.string('difficulty', 20).notNullable().defaultTo('medium'); // 'easy', 'medium', 'hard'

    // Answer options (A, B, C, D)
    table.text('option_a').notNullable();
    table.text('option_b').notNullable();
    table.text('option_c').notNullable();
    table.text('option_d').notNullable();

    // Correct answer
    table.enum('correct_answer', ['A', 'B', 'C', 'D']).notNullable();

    // Explanation (shown after answering)
    table.text('explanation').nullable();

    // Reference tweets/context (for admin verification)
    table.json('reference_sources').nullable(); // URLs to tweets that support the answer

    // Metadata
    table.boolean('is_active').defaultTo(true);
    table.integer('times_asked').defaultTo(0);
    table.integer('times_correct').defaultTo(0);
    table.decimal('accuracy_rate', 5, 2).nullable(); // % of people who got it right

    table.timestamps(true, true);

    // Foreign key
    table.foreign('influencer_id').references('influencers.id').onDelete('CASCADE');

    // Indexes
    table.index('influencer_id');
    table.index('category');
    table.index('difficulty');
    table.index('is_active');
  });

  // 2. User Answers
  await knex.schema.createTable('whisperer_user_answers', (table) => {
    table.increments('id').primary();

    table.string('wallet_address', 42).notNullable();
    table.integer('question_id').unsigned().notNullable();
    table.enum('selected_answer', ['A', 'B', 'C', 'D']).notNullable();
    table.boolean('is_correct').notNullable();

    // Timing (for streaks and speed bonuses)
    table.integer('time_taken_seconds').nullable(); // How long to answer
    table.timestamp('answered_at').defaultTo(knex.fn.now());

    // XP/Points earned
    table.integer('xp_earned').defaultTo(0);

    // Foreign keys
    table.foreign('wallet_address').references('users.wallet_address').onDelete('CASCADE');
    table.foreign('question_id').references('whisperer_questions.id').onDelete('CASCADE');

    // Prevent duplicate answers
    table.unique(['wallet_address', 'question_id']);

    // Indexes
    table.index('wallet_address');
    table.index('question_id');
    table.index('answered_at');
  });

  // 3. User Stats (Leaderboard)
  await knex.schema.createTable('whisperer_user_stats', (table) => {
    table.string('wallet_address', 42).primary();

    // Overall stats
    table.integer('total_questions').defaultTo(0);
    table.integer('correct_answers').defaultTo(0);
    table.decimal('accuracy_rate', 5, 2).defaultTo(0); // Overall accuracy %
    table.integer('total_xp').defaultTo(0);

    // Streaks
    table.integer('current_streak').defaultTo(0); // Consecutive correct answers
    table.integer('best_streak').defaultTo(0);
    table.timestamp('last_played_at').nullable();

    // Category breakdown
    table.integer('tech_correct').defaultTo(0);
    table.integer('tech_total').defaultTo(0);
    table.integer('market_correct').defaultTo(0);
    table.integer('market_total').defaultTo(0);
    table.integer('governance_correct').defaultTo(0);
    table.integer('governance_total').defaultTo(0);
    table.integer('culture_correct').defaultTo(0);
    table.integer('culture_total').defaultTo(0);

    // Achievements
    table.json('badges').nullable(); // Array of earned badge IDs

    table.timestamps(true, true);

    // Foreign key
    table.foreign('wallet_address').references('users.wallet_address').onDelete('CASCADE');

    // Indexes
    table.index('total_xp');
    table.index('accuracy_rate');
    table.index('current_streak');
  });

  // 4. Daily Challenges (Optional - one question per day for everyone)
  await knex.schema.createTable('whisperer_daily_challenges', (table) => {
    table.increments('id').primary();
    table.date('challenge_date').notNullable().unique();
    table.integer('question_id').unsigned().notNullable();
    table.integer('participants').defaultTo(0);
    table.integer('correct_count').defaultTo(0);

    table.timestamps(true, true);

    table.foreign('question_id').references('whisperer_questions.id').onDelete('CASCADE');
    table.index('challenge_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('whisperer_daily_challenges');
  await knex.schema.dropTableIfExists('whisperer_user_stats');
  await knex.schema.dropTableIfExists('whisperer_user_answers');
  await knex.schema.dropTableIfExists('whisperer_questions');
}
