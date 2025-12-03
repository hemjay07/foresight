/**
 * Achievement Service
 * Handles achievement tracking, unlocking, and progress
 */

import db from '../utils/db';

export interface Achievement {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: string;
  category: string;
  threshold: number | null;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: number;
  unlocked_at: string;
}

/**
 * Check and award achievement to user
 */
export async function awardAchievement(
  userId: string,
  achievementKey: string
): Promise<{ awarded: boolean; achievement?: Achievement; xpEarned?: number }> {
  try {
    // Get achievement
    const achievement = await db('achievements')
      .where({ key: achievementKey })
      .first();

    if (!achievement) {
      console.error(`Achievement not found: ${achievementKey}`);
      return { awarded: false };
    }

    // Check if user already has this achievement
    const existing = await db('user_achievements')
      .where({
        user_id: userId,
        achievement_id: achievement.id,
      })
      .first();

    if (existing) {
      return { awarded: false }; // Already has it
    }

    // Award achievement
    await db('user_achievements').insert({
      user_id: userId,
      achievement_id: achievement.id,
      unlocked_at: new Date().toISOString(),
    });

    // Award XP
    if (achievement.xp_reward > 0) {
      await db('users')
        .where({ id: userId })
        .increment('xp', achievement.xp_reward);
    }

    console.log(`✨ Achievement unlocked for user ${userId}: ${achievement.name} (+${achievement.xp_reward} XP)`);

    return {
      awarded: true,
      achievement,
      xpEarned: achievement.xp_reward,
    };
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return { awarded: false };
  }
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string) {
  const achievements = await db('user_achievements')
    .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
    .where({ user_id: userId })
    .select(
      'achievements.*',
      'user_achievements.unlocked_at'
    )
    .orderBy('user_achievements.unlocked_at', 'desc');

  return achievements;
}

/**
 * Get all available achievements (locked and unlocked)
 */
export async function getAllAchievementsWithStatus(userId: string) {
  // Get all achievements
  const allAchievements = await db('achievements').select('*');

  // Get user's unlocked achievements
  const unlockedIds = await db('user_achievements')
    .where({ user_id: userId })
    .select('achievement_id', 'unlocked_at');

  const unlockedMap = new Map(
    unlockedIds.map(u => [u.achievement_id, u.unlocked_at])
  );

  // Combine
  return allAchievements.map(ach => ({
    ...ach,
    unlocked: unlockedMap.has(ach.id),
    unlocked_at: unlockedMap.get(ach.id) || null,
  }));
}

/**
 * Check team-based achievements after scoring
 */
export async function checkTeamAchievements(userId: string, teamId: number, contestId: number) {
  const newAchievements: any[] = [];

  // Get team score and details
  const team = await db('user_teams')
    .where({ id: teamId })
    .first();

  if (!team) return newAchievements;

  // Get team picks with scores
  const picks = await db('team_picks')
    .where({ team_id: teamId })
    .select('*');

  const totalScore = team.total_score || 0;

  // TO_THE_MOON: Scored 200+ in a week
  if (totalScore >= 200) {
    const result = await awardAchievement(userId, 'TO_THE_MOON');
    if (result.awarded) newAchievements.push(result);
  }

  // PERFECT_WEEK: All 5 picks scored 20+
  if (picks.length === 5 && picks.every(p => (p.score || 0) >= 20)) {
    const result = await awardAchievement(userId, 'PERFECT_WEEK');
    if (result.awarded) newAchievements.push(result);
  }

  // FEW_UNDERSTAND: Perfect team (all picks 30+, score 150+)
  if (
    picks.length === 5 &&
    picks.every(p => (p.score || 0) >= 30) &&
    totalScore >= 150
  ) {
    const result = await awardAchievement(userId, 'FEW_UNDERSTAND');
    if (result.awarded) newAchievements.push(result);
  }

  return newAchievements;
}

/**
 * Check draft-based achievements
 */
export async function checkDraftAchievements(userId: string, teamId: number) {
  const newAchievements = [];

  // Get team picks
  const picks = await db('team_picks')
    .join('influencers', 'team_picks.influencer_id', 'influencers.id')
    .where({ team_id: teamId })
    .select('influencers.tier', 'influencers.price');

  // SENT_IT: All budget on S-tier
  if (picks.every(p => p.tier === 'S')) {
    const result = await awardAchievement(userId, 'SENT_IT');
    if (result.awarded) newAchievements.push(result);
  }

  // FIRST_TEAM: Created first team
  const teamCount = await db('user_teams')
    .where({ user_id: userId })
    .count('* as count')
    .first();

  if (teamCount && teamCount.count === 1) {
    const result = await awardAchievement(userId, 'FIRST_TEAM');
    if (result.awarded) newAchievements.push(result);
  }

  return newAchievements;
}

/**
 * Check ranking achievements
 */
export async function checkRankingAchievements(userId: string, rank: number, contestId: number) {
  const newAchievements = [];

  if (rank <= 10) {
    const result = await awardAchievement(userId, 'TOP_10_FINISH');
    if (result.awarded) newAchievements.push(result);
  }

  if (rank <= 3) {
    const result = await awardAchievement(userId, 'TOP_3_FINISH');
    if (result.awarded) newAchievements.push(result);
  }

  if (rank === 1) {
    const result = await awardAchievement(userId, 'WIN_CONTEST');
    if (result.awarded) newAchievements.push(result);
  }

  return newAchievements;
}

/**
 * Check XP milestone achievements
 */
export async function checkXPAchievements(userId: string, currentXP: number) {
  const newAchievements = [];

  const milestones = [
    { threshold: 100, key: 'XP_100' },
    { threshold: 500, key: 'XP_500' },
    { threshold: 1000, key: 'XP_1000' },
    { threshold: 2500, key: 'XP_2500' },
  ];

  for (const milestone of milestones) {
    if (currentXP >= milestone.threshold) {
      const result = await awardAchievement(userId, milestone.key);
      if (result.awarded) newAchievements.push(result);
    }
  }

  return newAchievements;
}
