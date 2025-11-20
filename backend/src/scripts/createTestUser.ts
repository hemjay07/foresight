/**
 * Create test user and generate auth token for API testing
 */

import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db';
import { createAccessToken } from '../utils/auth';

async function createTestUser() {
  try {
    const testWallet = '0x1234567890123456789012345678901234567890';

    // Check if test user exists
    let user = await db('users').where({ wallet_address: testWallet }).first();

    if (!user) {
      // Create test user
      const [newUser] = await db('users')
        .insert({
          id: uuidv4(),
          wallet_address: testWallet,
          created_at: db.fn.now(),
          last_seen_at: db.fn.now(),
        })
        .returning('*');

      user = newUser;
      console.log('✅ Created test user:', user.id);
    } else {
      console.log('✅ Test user already exists:', user.id);
    }

    // Generate JWT token
    const token = createAccessToken({
      userId: user.id,
      walletAddress: user.wallet_address,
    });

    console.log('\n📋 Test User Info:');
    console.log('User ID:', user.id);
    console.log('Wallet:', user.wallet_address);
    console.log('\n🔑 Auth Token (valid for 24h):');
    console.log(token);
    console.log('\n💡 Usage:');
    console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:3001/api/league/influencers');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
