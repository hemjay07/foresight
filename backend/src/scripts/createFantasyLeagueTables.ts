/**
 * Create CT Fantasy League tables
 * Run with: pnpm exec tsx src/scripts/createFantasyLeagueTables.ts
 */

import db from '../utils/db';

async function createTables() {
  try {
    console.log('Creating CT Fantasy League tables...');

    // 1. Fantasy Contests (Weekly periods)
    await db.raw(`
      CREATE TABLE IF NOT EXISTS fantasy_contests (
        id SERIAL PRIMARY KEY,
        contest_key VARCHAR(255) NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
        total_participants INTEGER DEFAULT 0,
        max_participants INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_fantasy_contests_status ON fantasy_contests(status);
      CREATE INDEX IF NOT EXISTS idx_fantasy_contests_start_date ON fantasy_contests(start_date);
    `);
    console.log('✓ Created fantasy_contests table');

    // 2. User Teams
    await db.raw(`
      CREATE TABLE IF NOT EXISTS user_teams (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contest_id INTEGER NOT NULL REFERENCES fantasy_contests(id) ON DELETE CASCADE,
        team_name VARCHAR(255) NOT NULL,
        total_score INTEGER DEFAULT 0,
        rank INTEGER,
        is_locked BOOLEAN DEFAULT FALSE,
        locked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, contest_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_teams_contest_id ON user_teams(contest_id);
      CREATE INDEX IF NOT EXISTS idx_user_teams_total_score ON user_teams(total_score);
    `);
    console.log('✓ Created user_teams table');

    // 3. Team Picks
    await db.raw(`
      CREATE TABLE IF NOT EXISTS team_picks (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES user_teams(id) ON DELETE CASCADE,
        influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
        pick_order INTEGER NOT NULL,
        daily_points INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, influencer_id)
      );

      CREATE INDEX IF NOT EXISTS idx_team_picks_team_id ON team_picks(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_picks_influencer_id ON team_picks(influencer_id);
    `);
    console.log('✓ Created team_picks table');

    // 4. Daily Votes
    await db.raw(`
      CREATE TABLE IF NOT EXISTS daily_votes (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
        vote_date DATE NOT NULL,
        vote_weight INTEGER DEFAULT 1,
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, vote_date, category)
      );

      CREATE INDEX IF NOT EXISTS idx_daily_votes_influencer_date ON daily_votes(influencer_id, vote_date);
      CREATE INDEX IF NOT EXISTS idx_daily_votes_date ON daily_votes(vote_date);
    `);
    console.log('✓ Created daily_votes table');

    // 5. Influencer Scores
    await db.raw(`
      CREATE TABLE IF NOT EXISTS influencer_scores (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
        score_date DATE NOT NULL,
        vote_count INTEGER DEFAULT 0,
        weighted_score INTEGER DEFAULT 0,
        rank_position INTEGER,
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(influencer_id, score_date, category)
      );

      CREATE INDEX IF NOT EXISTS idx_influencer_scores_date_category ON influencer_scores(score_date, category);
      CREATE INDEX IF NOT EXISTS idx_influencer_scores_weighted_score ON influencer_scores(weighted_score);
    `);
    console.log('✓ Created influencer_scores table');

    // 6. Contest Leaderboard
    await db.raw(`
      CREATE TABLE IF NOT EXISTS contest_leaderboard (
        id SERIAL PRIMARY KEY,
        contest_id INTEGER NOT NULL REFERENCES fantasy_contests(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id INTEGER NOT NULL REFERENCES user_teams(id) ON DELETE CASCADE,
        final_score INTEGER DEFAULT 0,
        rank INTEGER NOT NULL,
        xp_reward INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contest_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_contest_rank ON contest_leaderboard(contest_id, rank);
    `);
    console.log('✓ Created contest_leaderboard table');

    // 7. Seed initial contest
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    await db.raw(`
      INSERT INTO fantasy_contests (contest_key, start_date, end_date, status, total_participants, max_participants)
      VALUES ('week_1', ?, ?, 'active', 0, 1000)
      ON CONFLICT (contest_key) DO NOTHING;
    `, [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]);

    console.log('✓ Seeded initial contest');

    console.log('\n✅ All CT Fantasy League tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
