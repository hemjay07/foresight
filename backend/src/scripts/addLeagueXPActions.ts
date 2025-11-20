/**
 * Add XP actions for CT Fantasy League
 */

import db from '../utils/db';

async function addXPActions() {
  try {
    console.log('Adding CT Fantasy League XP actions...');

    const actions = [
      {
        action_key: 'league_team_create',
        action_name: 'Create Fantasy Team',
        category: 'achievement',
        xp_amount: 50,
        cooldown_minutes: 0,
        max_per_day: null,
        is_active: true,
        description: 'Create your first fantasy team for a contest',
      },
      {
        action_key: 'league_daily_vote',
        action_name: 'Vote for Best CT Take',
        category: 'engagement',
        xp_amount: 10,
        cooldown_minutes: 1440, // Once per day
        max_per_day: 1,
        is_active: true,
        description: 'Vote for the best CT take of the day',
      },
      {
        action_key: 'league_team_lock',
        action_name: 'Lock Fantasy Team',
        category: 'engagement',
        xp_amount: 25,
        cooldown_minutes: 0,
        max_per_day: null,
        is_active: true,
        description: 'Finalize your team picks',
      },
    ];

    for (const action of actions) {
      await db('xp_actions')
        .insert(action)
        .onConflict('action_key')
        .ignore();

      console.log(`✓ Added: ${action.action_name} (+${action.xp_value} XP)`);
    }

    console.log('\n✅ All XP actions added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding XP actions:', error);
    process.exit(1);
  }
}

addXPActions();
