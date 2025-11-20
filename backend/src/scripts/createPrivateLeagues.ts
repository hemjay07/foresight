/**
 * Create Private Leagues tables
 * Run with: pnpm exec tsx src/scripts/createPrivateLeagues.ts
 */

import db from '../utils/db';

async function createTables() {
  try {
    console.log('Creating Private Leagues tables...');

    // 1. Private Leagues
    await db.raw(`
      CREATE TABLE IF NOT EXISTS private_leagues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contest_id INTEGER NOT NULL REFERENCES fantasy_contests(id) ON DELETE CASCADE,
        entry_fee DECIMAL(18, 8) DEFAULT 0,
        prize_pool DECIMAL(18, 8) DEFAULT 0,
        max_members INTEGER DEFAULT 10,
        current_members INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'full', 'active', 'completed')),
        is_public BOOLEAN DEFAULT FALSE,
        prize_distributed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_private_leagues_code ON private_leagues(code);
      CREATE INDEX IF NOT EXISTS idx_private_leagues_creator ON private_leagues(creator_id);
      CREATE INDEX IF NOT EXISTS idx_private_leagues_contest ON private_leagues(contest_id);
      CREATE INDEX IF NOT EXISTS idx_private_leagues_status ON private_leagues(status);
    `);
    console.log('✓ Created private_leagues table');

    // 2. League Members
    await db.raw(`
      CREATE TABLE IF NOT EXISTS league_members (
        id SERIAL PRIMARY KEY,
        league_id INTEGER NOT NULL REFERENCES private_leagues(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES user_teams(id) ON DELETE CASCADE,
        total_score INTEGER DEFAULT 0,
        rank INTEGER,
        entry_paid BOOLEAN DEFAULT FALSE,
        entry_tx_hash VARCHAR(255),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
      CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_league_members_score ON league_members(league_id, total_score DESC);
    `);
    console.log('✓ Created league_members table');

    // 3. Add influencer pricing
    await db.raw(`
      ALTER TABLE influencers
      ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 5.0,
      ADD COLUMN IF NOT EXISTS form_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_influencers_price ON influencers(price);
      CREATE INDEX IF NOT EXISTS idx_influencers_total_points ON influencers(total_points DESC);
    `);
    console.log('✓ Added pricing to influencers table');

    // 4. Update user_teams for budget tracking
    await db.raw(`
      ALTER TABLE user_teams
      ADD COLUMN IF NOT EXISTS budget_used DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS budget_remaining DECIMAL(10, 2) DEFAULT 25.0,
      ADD COLUMN IF NOT EXISTS league_id INTEGER REFERENCES private_leagues(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_user_teams_league ON user_teams(league_id);
    `);
    console.log('✓ Updated user_teams table');

    // 5. Prize Distribution Log
    await db.raw(`
      CREATE TABLE IF NOT EXISTS prize_distributions (
        id SERIAL PRIMARY KEY,
        league_id INTEGER NOT NULL REFERENCES private_leagues(id) ON DELETE CASCADE,
        winner_id UUID NOT NULL REFERENCES users(id),
        amount DECIMAL(18, 8) NOT NULL,
        tx_hash VARCHAR(255),
        distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        distributed_by UUID REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_prize_distributions_league ON prize_distributions(league_id);
    `);
    console.log('✓ Created prize_distributions table');

    console.log('\n✅ All Private Leagues tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
