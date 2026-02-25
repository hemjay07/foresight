/**
 * Tapestry Protocol API Routes
 *
 * Social graph features: follow/unfollow, content read-back, likes,
 * comments, activity feed. All data lives on Tapestry's Solana-based
 * social graph.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import tapestryService from '../services/tapestryService';
import db from '../utils/db';

const router: Router = Router();

/**
 * Helper: get the current user's Tapestry profile ID from DB.
 * Returns null if no profile is linked (graceful degradation for demo).
 */
async function getTapestryProfileId(userId: string): Promise<string | null> {
  const user = await db('users').where({ id: userId }).first();
  return user?.tapestry_user_id || null;
}

// ─── Social Graph ────────────────────────────────────────────────────────────

/**
 * POST /api/tapestry/follow
 * Follow another user by their Tapestry profile ID.
 * Persists to local DB first (source of truth), then syncs to Tapestry async.
 */
router.post(
  '/follow',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { targetProfileId, targetUsername } = req.body;

    if (!targetProfileId) {
      throw new AppError('targetProfileId is required', 400);
    }

    // ── 1. Persist to local DB (source of truth) ──────────────────────────
    await db('user_follows')
      .insert({
        follower_user_id: userId,
        following_tapestry_profile_id: targetProfileId,
        following_username: targetUsername || null,
      })
      .onConflict(['follower_user_id', 'following_tapestry_profile_id'])
      .ignore(); // idempotent — re-following is a no-op

    // ── 2. Sync to Tapestry async (non-blocking) ──────────────────────────
    const myProfileId = await getTapestryProfileId(userId);
    if (myProfileId) {
      tapestryService.followProfile(myProfileId, targetProfileId).catch(() => {
        // Tapestry sync failed — local DB has it, sync will retry later
      });
    }

    sendSuccess(res, { followed: true, targetProfileId });
  })
);

/**
 * POST /api/tapestry/unfollow
 * Unfollow a user by their Tapestry profile ID.
 * Removes from local DB first (source of truth), then syncs to Tapestry async.
 */
router.post(
  '/unfollow',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { targetProfileId } = req.body;

    if (!targetProfileId) {
      throw new AppError('targetProfileId is required', 400);
    }

    // ── 1. Remove from local DB (source of truth) ─────────────────────────
    await db('user_follows')
      .where({ follower_user_id: userId, following_tapestry_profile_id: targetProfileId })
      .delete();

    // ── 2. Sync to Tapestry async (non-blocking) ──────────────────────────
    const myProfileId = await getTapestryProfileId(userId);
    if (myProfileId) {
      tapestryService.unfollowProfile(myProfileId, targetProfileId).catch(() => {
        // Tapestry sync failed — local DB already reflects unfollow
      });
    }

    sendSuccess(res, { followed: false, targetProfileId });
  })
);

/**
 * GET /api/tapestry/following-state/:targetProfileId
 * Check if the current user follows another profile.
 * Reads from local DB (source of truth).
 */
router.get(
  '/following-state/:targetProfileId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { targetProfileId } = req.params;

    const row = await db('user_follows')
      .where({ follower_user_id: userId, following_tapestry_profile_id: targetProfileId })
      .first();

    sendSuccess(res, { isFollowing: !!row });
  })
);

/**
 * GET /api/tapestry/followers/:profileId
 * Get followers of a profile.
 */
router.get(
  '/followers/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const followers = await tapestryService.getFollowers(profileId, page);

    sendSuccess(res, { followers });
  })
);

/**
 * GET /api/tapestry/following/:profileId
 * Get who a profile follows.
 */
router.get(
  '/following/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const following = await tapestryService.getFollowing(profileId, page);

    sendSuccess(res, { following });
  })
);

/**
 * GET /api/tapestry/social-counts/:profileId
 * Get follower/following counts.
 */
router.get(
  '/social-counts/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const counts = await tapestryService.getSocialCounts(profileId);

    sendSuccess(res, counts || { followers: 0, following: 0 });
  })
);

// ─── Content ─────────────────────────────────────────────────────────────────

/**
 * GET /api/tapestry/content/:profileId
 * Get all content (teams, scores) stored on Tapestry for a profile.
 */
router.get(
  '/content/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const content = await tapestryService.getProfileContent(profileId, page);

    sendSuccess(res, { content });
  })
);

// ─── Likes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/tapestry/like/:contentId
 * Like a team or score on Tapestry.
 */
router.post(
  '/like/:contentId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { contentId } = req.params;

    const myProfileId = await getTapestryProfileId(userId);
    if (myProfileId) {
      try {
        await tapestryService.likeContent(myProfileId, contentId);
      } catch { /* graceful degradation */ }
    }

    sendSuccess(res, { liked: true, contentId });
  })
);

/**
 * DELETE /api/tapestry/like/:contentId
 * Unlike a team or score on Tapestry.
 */
router.delete(
  '/like/:contentId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { contentId } = req.params;

    const myProfileId = await getTapestryProfileId(userId);
    if (myProfileId) {
      try {
        await tapestryService.unlikeContent(myProfileId, contentId);
      } catch { /* graceful degradation */ }
    }

    sendSuccess(res, { liked: false, contentId });
  })
);

// ─── Comments ────────────────────────────────────────────────────────────────

/**
 * POST /api/tapestry/comment/:contentId
 * Comment on a team or score.
 */
router.post(
  '/comment/:contentId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { contentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      throw new AppError('Comment text is required', 400);
    }

    const myProfileId = await getTapestryProfileId(userId);
    let commentId: string | null = null;
    if (myProfileId) {
      try {
        commentId = await tapestryService.commentOnContent(myProfileId, contentId, text.trim());
      } catch { /* graceful degradation */ }
    }

    sendSuccess(res, { commentId: commentId || 'local', contentId });
  })
);

/**
 * GET /api/tapestry/comments/:contentId
 * Get comments on content.
 */
router.get(
  '/comments/:contentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const comments = await tapestryService.getComments(contentId, page);

    sendSuccess(res, { comments });
  })
);

// ─── Batch Operations ────────────────────────────────────────────────────────

/**
 * POST /api/tapestry/following-state-batch
 * Check follow state for multiple profiles at once.
 * Reads from local DB (source of truth) — single query for all targets.
 * Body: { targetProfileIds: string[] }
 */
router.post(
  '/following-state-batch',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { targetProfileIds } = req.body;

    if (!Array.isArray(targetProfileIds) || targetProfileIds.length === 0) {
      sendSuccess(res, { states: {} });
      return;
    }

    const limited = targetProfileIds.slice(0, 50);

    // Single DB query instead of N Tapestry API calls
    const followed = await db('user_follows')
      .where({ follower_user_id: userId })
      .whereIn('following_tapestry_profile_id', limited)
      .select('following_tapestry_profile_id');

    const followedSet = new Set(followed.map((r: any) => r.following_tapestry_profile_id));
    const results: Record<string, boolean> = {};
    for (const id of limited) results[id] = followedSet.has(id);

    sendSuccess(res, { states: results });
  })
);

/**
 * GET /api/tapestry/my-following
 * Get list of all profile IDs the current user follows (for Friends Leaderboard).
 * Reads from local DB (source of truth) — format: { id, username }[]
 */
router.get(
  '/my-following',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const rows = await db('user_follows')
      .where({ follower_user_id: userId })
      .select('following_tapestry_profile_id as id', 'following_username as username')
      .orderBy('created_at', 'desc');

    sendSuccess(res, { following: rows });
  })
);

// ─── Activity Feed ───────────────────────────────────────────────────────────

/**
 * GET /api/tapestry/activity
 * Get the current user's activity feed.
 * Primary: Tapestry social feed (on-chain follows).
 * Fallback: Local DB activity (follows tracked in user_follows table).
 */
router.get(
  '/activity',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;

    const user = await db('users').where({ id: userId }).first();

    // Try Tapestry first
    let activity: any[] = [];
    if (user?.tapestry_user_id) {
      activity = await tapestryService.getActivityFeed(user.username, page);
    }

    // Fallback: build activity from local DB (user_follows + contest entries)
    if (activity.length === 0) {
      const following = await db('user_follows')
        .where({ follower_user_id: userId })
        .select('following_username');

      if (following.length > 0) {
        const usernames = following.map((f: any) => f.following_username).filter(Boolean);
        // Get recent contest entries from users we follow
        const recentEntries = await db('free_league_entries as e')
          .join('users as u', 'e.user_id', 'u.id')
          .whereIn('u.username', usernames)
          .orderBy('e.created_at', 'desc')
          .limit(10)
          .select('u.username', 'u.tapestry_user_id', 'e.created_at', 'e.contest_id');

        activity = recentEntries.map((entry: any) => ({
          type: 'content_create',
          timestamp: entry.created_at,
          actor: { id: entry.tapestry_user_id || entry.username, username: entry.username },
        }));

        // Also include recent follows from our DB
        const recentFollows = await db('user_follows as f')
          .join('users as u', 'f.follower_user_id', 'u.id')
          .whereIn('u.username', usernames)
          .orderBy('f.created_at', 'desc')
          .limit(5)
          .select('u.username', 'u.tapestry_user_id', 'f.created_at', 'f.following_username');

        const followActivity = recentFollows.map((f: any) => ({
          type: 'follow',
          timestamp: f.created_at,
          actor: { id: f.tapestry_user_id || f.username, username: f.username },
          target: { id: f.following_username, username: f.following_username },
        }));

        activity = [...activity, ...followActivity]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
      }
    }

    sendSuccess(res, { activity });
  })
);

export default router;
