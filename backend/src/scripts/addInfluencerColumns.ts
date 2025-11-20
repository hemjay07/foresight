/**
 * Add pricing and tier columns to influencers table
 */

import db from '../utils/db';

async function addColumns() {
  try {
    console.log('Adding columns to influencers table...');

    // Check if columns already exist, if not add them
    const columns = await db.raw(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'influencers';
    `);

    const existingColumns = columns.rows.map((r: any) => r.column_name);
    console.log('Existing columns:', existingColumns);

    const columnsToAdd = [
      { name: 'tier', sql: 'ALTER TABLE influencers ADD COLUMN IF NOT EXISTS tier VARCHAR(1) DEFAULT \'B\';' },
      { name: 'price', sql: 'ALTER TABLE influencers ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 5.0;' },
      { name: 'follower_count', sql: 'ALTER TABLE influencers ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;' },
      { name: 'form_score', sql: 'ALTER TABLE influencers ADD COLUMN IF NOT EXISTS form_score INTEGER DEFAULT 0;' },
      { name: 'total_points', sql: 'ALTER TABLE influencers ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;' },
      { name: 'is_active', sql: 'ALTER TABLE influencers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;' },
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        await db.raw(col.sql);
        console.log(`✓ Added column: ${col.name}`);
      } else {
        console.log(`⏭️  Column exists: ${col.name}`);
      }
    }

    console.log('\n✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addColumns();
