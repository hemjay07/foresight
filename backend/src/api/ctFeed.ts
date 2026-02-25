/**
 * CT Feed API Routes
 *
 * Endpoints for the CT Feed feature:
 * - GET /api/ct-feed - Main feed
 * - GET /api/ct-feed/highlights - Top viral tweets
 * - GET /api/ct-feed/rising-stars - Rising star accounts
 * - POST /api/ct-feed/interaction - Track user interactions
 * - POST /api/ct-feed/refresh - Admin: refresh tweet cache
 */

import { Router, Request, Response } from 'express';
import * as ctFeedService from '../services/ctFeedService';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';
import questService from '../services/questService';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/ct-feed
 * Get the main CT feed
 */
router.get('/', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const filter = (req.query.filter as string) || 'all';

    const result = await ctFeedService.getFeed({ limit, offset, filter: filter as 'all' | 'highlights' | 'rising' });

    // Trigger daily quest for browsing feed (only if authenticated)
    const userId = (req as any).user?.userId;
    if (userId) {
      questService.triggerAction(userId, 'browse_feed').catch((err) =>
        logger.error('Error triggering browse_feed quest:', err, { context: 'CT Feed API' })
      );
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting feed:', error, { context: 'CT Feed API' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed',
    });
  }
});

/**
 * GET /api/ct-feed/highlights
 * Get top viral tweets
 */
router.get('/highlights', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const timeframe = (req.query.timeframe as string) || '24h';

    if (!['1h', '24h', '7d', '30d'].includes(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe. Use 1h, 24h, 7d, or 30d',
      });
    }

    const result = await ctFeedService.getHighlights(limit, timeframe);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting highlights:', error, { context: 'CT Feed API' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch highlights',
    });
  }
});

/**
 * GET /api/ct-feed/rising-stars
 * Get rising star accounts
 */
router.get('/rising-stars', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    const result = await ctFeedService.getRisingStars(limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting rising stars:', error, { context: 'CT Feed API' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rising stars',
    });
  }
});

/**
 * POST /api/ct-feed/interaction
 * Track user interactions with the feed
 */
router.post('/interaction', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { type, tweetId, sessionId, timeSpentSeconds, tweetsViewed } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Interaction type is required',
      });
    }

    // Track the interaction
    await ctFeedService.trackInteraction({
      userId,
      type,
      tweetId,
      sessionId,
      timeSpentSeconds,
      tweetsViewed,
    });

    // Check if we should award FS for browse time
    if (type === 'browse_time' && timeSpentSeconds >= 30) {
      const fsResult = await ctFeedService.awardBrowseTimeFS(userId, timeSpentSeconds);

      return res.json({
        success: true,
        data: {
          tracked: true,
          fsAwarded: fsResult.awarded ? fsResult.fsAmount : 0,
          message: fsResult.awarded
            ? `Earned +${fsResult.fsAmount} FS for browsing Intel`
            : fsResult.reason === 'already_claimed_today'
            ? 'Already earned browse bonus today'
            : 'Interaction tracked',
        },
      });
    }

    res.json({
      success: true,
      data: {
        tracked: true,
      },
    });
  } catch (error) {
    logger.error('Error tracking interaction:', error, { context: 'CT Feed API' });
    res.status(500).json({
      success: false,
      error: 'Failed to track interaction',
    });
  }
});

/**
 * POST /api/ct-feed/refresh
 * Admin: Force refresh tweet cache
 */
router.post('/refresh', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    logger.info('Refresh triggered by admin user', { context: 'CT Feed API', data: { userId } });

    const result = await ctFeedService.refreshTweets();

    res.json({
      success: result.success,
      data: {
        tweetsStored: result.tweetsStored,
        influencersProcessed: result.influencersProcessed,
        scoresUpdated: result.scoresUpdated,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    logger.error('Error refreshing feed:', error, { context: 'CT Feed API' });
    res.status(500).json({
      success: false,
      error: 'Failed to refresh feed',
    });
  }
});

export default router;
