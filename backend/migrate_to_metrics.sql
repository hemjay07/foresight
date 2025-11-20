-- Migration: Migrate to Metrics-Based Scoring System
-- Date: 2025-01-21

BEGIN;

-- 1. Add base_price column to influencers
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) DEFAULT 20;

-- 2. Update influencer pricing for metrics-based system
-- Budget: 100 points for 5 influencers
-- Tiers: S=28pts, A=22pts, B=18pts, C=12pts

-- Update S-Tier influencers
UPDATE influencers
SET price = 28.00, base_price = 28.00
WHERE tier = 'S';

-- Update A-Tier influencers
UPDATE influencers
SET price = 22.00, base_price = 22.00
WHERE tier = 'A';

-- Update B-Tier influencers
UPDATE influencers
SET price = 18.00, base_price = 18.00
WHERE tier = 'B';

-- Update C-Tier influencers
UPDATE influencers
SET price = 12.00, base_price = 12.00
WHERE tier = 'C';

-- 3. Add columns to user_teams for metrics-based scoring
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS budget_used DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS current_score INTEGER DEFAULT 0;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS previous_score INTEGER DEFAULT 0;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS score_change INTEGER DEFAULT 0;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS last_score_update TIMESTAMP WITH TIME ZONE;

-- 4. Add prize league columns to fantasy_contests
ALTER TABLE fantasy_contests ADD COLUMN IF NOT EXISTS entry_fee DECIMAL(10, 4) DEFAULT 0.000;
ALTER TABLE fantasy_contests ADD COLUMN IF NOT EXISTS prize_pool DECIMAL(10, 4) DEFAULT 0.000;
ALTER TABLE fantasy_contests ADD COLUMN IF NOT EXISTS is_prize_league BOOLEAN DEFAULT FALSE;
ALTER TABLE fantasy_contests ADD COLUMN IF NOT EXISTS prize_distribution JSONB;

-- 5. Add payment tracking to user_teams
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS entry_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS payment_tx_hash VARCHAR(66);
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS prize_won DECIMAL(10, 4);
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS prize_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS prize_claim_tx_hash VARCHAR(66);

-- 6. Create index on base_price
CREATE INDEX IF NOT EXISTS influencers_base_price_index ON influencers(base_price);

-- 7. Update existing contest with prize distribution structure
UPDATE fantasy_contests
SET
  is_prize_league = FALSE,
  entry_fee = 0.000,
  prize_pool = 0.000,
  prize_distribution = '{
    "1": 40,
    "2": 25,
    "3": 15,
    "4": 5,
    "5": 5,
    "6-10": 2
  }'::jsonb
WHERE status = 'active';

COMMIT;

-- Display results
SELECT 'Migration completed successfully!' AS status;
SELECT tier, price, base_price, COUNT(*) as count
FROM influencers
GROUP BY tier, price, base_price
ORDER BY price DESC;
