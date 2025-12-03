/**
 * Validate all Twitter handles in database
 * Identify which ones are outdated/wrong
 */

import twitterApiService from '../services/twitterApiService';
import db from '../utils/db';

async function validateTwitterHandles() {
  console.log('🔍 Validating all Twitter handles...\n');

  try {
    if (!twitterApiService.isConfigured()) {
      console.error('❌ Twitter API not configured');
      process.exit(1);
    }

    const influencers = await db('influencers')
      .where({ is_active: true })
      .select('id', 'twitter_handle', 'display_name')
      .orderBy('display_name');

    console.log(`Found ${influencers.length} influencers to validate\n`);

    const validHandles: string[] = [];
    const invalidHandles: Array<{ handle: string; name: string }> = [];

    // Test each handle one by one
    for (const inf of influencers) {
      try {
        const user = await twitterApiService.getUserByUsername(inf.twitter_handle);
        if (user) {
          validHandles.push(inf.twitter_handle);
          console.log(`✅ @${inf.twitter_handle.padEnd(20)} - ${inf.display_name}`);
        }
      } catch (error: any) {
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          invalidHandles.push({ handle: inf.twitter_handle, name: inf.display_name });
          console.log(`❌ @${inf.twitter_handle.padEnd(20)} - ${inf.display_name} (NOT FOUND)`);
        } else {
          console.log(`⚠️  @${inf.twitter_handle.padEnd(20)} - ${inf.display_name} (ERROR: ${error.message})`);
        }
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Valid: ${validHandles.length}`);
    console.log(`   ❌ Invalid: ${invalidHandles.length}`);

    if (invalidHandles.length > 0) {
      console.log(`\n❌ Invalid Handles that need fixing:`);
      invalidHandles.forEach((item, i) => {
        console.log(`   ${i+1}. @${item.handle} - ${item.name}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
}

validateTwitterHandles();
