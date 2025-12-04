-- Timecaster Backend Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Influencers table (50 tracked CT accounts)
CREATE TABLE influencers (
  id SERIAL PRIMARY KEY,
  twitter_id VARCHAR(50) UNIQUE NOT NULL,
  handle VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  follower_count INTEGER DEFAULT 0,
  tier VARCHAR(1) CHECK (tier IN ('S', 'A', 'B', 'C')),
  base_price INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Influencer scores (time-series data)
CREATE TABLE influencer_scores (
  id SERIAL PRIMARY KEY,
  influencer_id INTEGER REFERENCES influencers(id),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  engagement_score INTEGER DEFAULT 0,
  follower_delta INTEGER DEFAULT 0,
  tweet_count INTEGER DEFAULT 0,
  viral_tweets INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (influencer_id, week_number, year)
);

-- CT Draft teams
CREATE TABLE ct_draft_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  team_name VARCHAR(32) NOT NULL,
  influencer_ids INTEGER[] NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  league_type VARCHAR(10) CHECK (league_type IN ('free', 'prize')),
  total_score INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, week_number, year, league_type)
);

-- Private leagues
CREATE TABLE private_leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(40) NOT NULL,
  code VARCHAR(6) UNIQUE NOT NULL,
  creator_id UUID REFERENCES users(id),
  league_type VARCHAR(10) CHECK (league_type IN ('free', 'prize')),
  prize_pool DECIMAL(18, 8),
  description TEXT,
  member_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tweets (scraped data)
CREATE TABLE tweets (
  id SERIAL PRIMARY KEY,
  influencer_id INTEGER REFERENCES influencers(id),
  tweet_id VARCHAR(50) UNIQUE NOT NULL,
  text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  retweets_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP NOT NULL,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Authentication sessions
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System events log
CREATE TABLE system_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Functions

-- Get current week number
CREATE OR REPLACE FUNCTION get_current_week() RETURNS INTEGER AS $$
  SELECT EXTRACT(WEEK FROM NOW())::INTEGER;
$$ LANGUAGE SQL;

-- Get current year
CREATE OR REPLACE FUNCTION get_current_year() RETURNS INTEGER AS $$
  SELECT EXTRACT(YEAR FROM NOW())::INTEGER;
$$ LANGUAGE SQL;

-- Calculate team score
CREATE OR REPLACE FUNCTION calculate_team_score(
  p_influencer_ids INTEGER[],
  p_week_number INTEGER,
  p_year INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_total_score INTEGER := 0;
  v_influencer_id INTEGER;
BEGIN
  FOREACH v_influencer_id IN ARRAY p_influencer_ids
  LOOP
    SELECT COALESCE(total_score, 0) INTO v_total_score
    FROM influencer_scores
    WHERE influencer_id = v_influencer_id
      AND week_number = p_week_number
      AND year = p_year;

    v_total_score := v_total_score + COALESCE(v_total_score, 0);
  END LOOP;

  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- Update team rankings
CREATE OR REPLACE FUNCTION update_team_rankings(
  p_week_number INTEGER,
  p_year INTEGER,
  p_league_type VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
  UPDATE ct_draft_teams t
  SET rank = sub.rank
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY total_score DESC, created_at ASC) as rank
    FROM ct_draft_teams
    WHERE week_number = p_week_number
      AND year = p_year
      AND league_type = p_league_type
  ) sub
  WHERE t.id = sub.id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance

-- Users indexes
CREATE INDEX idx_users_address ON users(address);

-- Influencers indexes
CREATE INDEX idx_influencers_handle ON influencers(handle);
CREATE INDEX idx_influencers_tier ON influencers(tier);

-- Influencer scores indexes
CREATE INDEX idx_influencer_scores_influencer_week ON influencer_scores(influencer_id, week_number, year);
CREATE INDEX idx_influencer_scores_week ON influencer_scores(week_number, year);

-- CT Draft teams indexes
CREATE INDEX idx_ct_draft_teams_user_week ON ct_draft_teams(user_id, week_number, year);
CREATE INDEX idx_ct_draft_teams_week_league ON ct_draft_teams(week_number, year, league_type);
CREATE INDEX idx_ct_draft_teams_leaderboard ON ct_draft_teams(week_number, year, league_type, total_score DESC);

-- Private leagues indexes
CREATE INDEX idx_private_leagues_code ON private_leagues(code);
CREATE INDEX idx_private_leagues_creator ON private_leagues(creator_id);

-- Tweets indexes
CREATE INDEX idx_tweets_influencer_date ON tweets(influencer_id, posted_at);
CREATE INDEX idx_tweets_tweet_id ON tweets(tweet_id);
CREATE INDEX idx_tweets_influencer ON tweets(influencer_id, posted_at DESC);

-- Auth sessions indexes
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token);

-- System events indexes
CREATE INDEX idx_system_events_event_type ON system_events(event_type);
CREATE INDEX idx_system_events_created_at ON system_events(created_at);

-- Comments
COMMENT ON TABLE influencers IS 'Tracked CT accounts (50 total)';
COMMENT ON TABLE influencer_scores IS 'Weekly performance metrics per influencer';
COMMENT ON TABLE ct_draft_teams IS 'User fantasy teams per week';
COMMENT ON TABLE tweets IS 'Scraped tweets for scoring';
