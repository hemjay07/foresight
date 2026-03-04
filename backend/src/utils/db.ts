import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Log which database we're connecting to (mask credentials)
const env = process.env.NODE_ENV || 'development';
const rawUrl = process.env.DATABASE_URL;
if (rawUrl) {
  const masked = rawUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`[DB] env=${env} → ${masked}`);
} else {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'foresight';
  console.log(`[DB] env=${env} → ${host}:${port}/${name}`);
}

// Create Knex instance
// FINDING-011: Enforce SSL for production database connections
const connectionConfig = process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'foresight',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const db: Knex = knex({
  client: 'postgresql',
  connection: typeof connectionConfig === 'string'
    ? { connectionString: connectionConfig, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
    : connectionConfig,
  pool: {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 2000,
  },
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  await db.destroy();
  console.log('Database connection closed');
}

export default db;
