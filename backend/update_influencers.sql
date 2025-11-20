-- Clear existing influencers
TRUNCATE TABLE influencers RESTART IDENTITY CASCADE;

-- Insert updated CT influencers (20 active accounts)

-- S-Tier (12M - 10M) - Top CT voices
INSERT INTO influencers (display_name, twitter_handle, tier, price, bio, follower_count, is_active) VALUES
('Cobie', 'cobie', 'S', 12.00, 'Crypto OG, legendary shitposter', 850000, true),
('Ansem', 'blknoiz06', 'S', 11.50, 'Solana alpha, legendary calls', 520000, true),
('Ico Beast', 'icobeast', 'S', 11.00, 'Top CT analyst, alpha hunter', 180000, true),
('GCR', 'GiganticRebirth', 'S', 10.00, 'OG trader, legendary', 290000, true);

-- A-Tier (8M - 6M) - Strong CT presence
INSERT INTO influencers (display_name, twitter_handle, tier, price, bio, follower_count, is_active) VALUES
('Wales', 'waleswoosh', 'A', 8.00, 'NFT alpha, meme lord', 340000, true),
('Hsaka', 'HsakaTrades', 'A', 7.50, 'Top trader, chart wizard', 185000, true),
('Degen Spartan', 'degenspartan', 'A', 7.00, 'DeFi degen, alpha calls', 215000, true),
('Light', 'LightCrypto', 'A', 6.50, 'Macro trader, technical analysis', 95000, true),
('Ape', 'apecoin', 'A', 6.00, 'NFT alpha, community leader', 125000, true);

-- B-Tier (5.5M - 4M) - Solid CT contributors
INSERT INTO influencers (display_name, twitter_handle, tier, price, bio, follower_count, is_active) VALUES
('Adam Cochran', 'adamscochran', 'B', 5.50, 'Crypto VC, deep dives', 275000, true),
('Miles Deutscher', 'milesdeutscher', 'B', 5.50, 'Altcoin researcher, threads', 285000, true),
('The Wolf of All Streets', 'scottmelker', 'B', 5.00, 'Macro trader, podcast host', 420000, true),
('Lark Davis', 'TheCryptoLark', 'B', 5.00, 'Crypto educator, YouTuber', 350000, true),
('Crypto Cobain', 'CryptoCobain', 'B', 4.50, 'Trader, chart master', 315000, true),
('Pentoshi', 'Pentosh1', 'B', 4.50, 'TA wizard, trading alpha', 145000, true),
('Kaleo', 'CryptoKaleo', 'B', 4.50, 'Chart analysis, swing trader', 320000, true),
('Altcoin Sherpa', 'AltcoinSherpa', 'B', 4.00, 'Trading setups, charts', 215000, true),
('Altcoin Psycho', 'AltcoinPsycho', 'B', 4.00, 'Altcoin analysis, memes', 185000, true),
('Rekt Capital', 'rektcapital', 'B', 4.00, 'Bitcoin cycles, TA analysis', 410000, true);
