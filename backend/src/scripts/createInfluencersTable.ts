/**
 * Create Influencers table with proper schema
 */

import db from '../utils/db';

async function createTable() {
  try {
    console.log('Checking influencers table...');

    // First, check what exists
    const exists = await db.raw(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'influencers'
      LIMIT 5;
    `);

    console.log('Current columns:', exists.rows);

    // If table doesn't exist, create it
    const tableCheck = await db.raw(`
      SELECT to_regclass('public.influencers') as exists;
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating influencers table...');
      await db.raw(`
        CREATE TABLE influencers (
          id SERIAL PRIMARY KEY,
          twitter_id VARCHAR(255) UNIQUE,
          handle VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          tier VARCHAR(1) DEFAULT 'B',
          price DECIMAL(10, 2) DEFAULT 5.0,
          base_price INTEGER DEFAULT 25,
          follower_count INTEGER DEFAULT 0,
          form_score INTEGER DEFAULT 0,
          total_points INTEGER DEFAULT 0,
          profile_image_url TEXT,
          bio TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          last_tweet_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTable();
