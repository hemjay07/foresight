/**
 * Watchlist API
 * Manage user's scouted influencers
 */

import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/watchlist
 * Get user's watchlist with influencer details
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const watchlist = await db('user_watchlist as w')
      .join('influencers as i', 'w.influencer_id', 'i.id')
      .where('w.user_id', userId)
      .select(
        'w.id as watchlist_id',
        'w.notes',
        'w.created_at as scouted_at',
        'i.id as influencer_id',
        'i.twitter_handle',
        'i.display_name',
        'i.avatar_url',
        'i.tier',
        'i.price',
        'i.total_points',
        'i.follower_count',
        'i.engagement_rate'
      )
      .orderBy('w.created_at', 'desc');

    const formatted = watchlist.map((w) => ({
      id: w.watchlist_id,
      notes: w.notes,
      scoutedAt: w.scouted_at,
      influencer: {
        id: w.influencer_id,
        handle: w.twitter_handle,
        name: w.display_name,
        avatar: w.avatar_url,
        tier: w.tier,
        price: parseFloat(w.price) || 10,
        totalPoints: w.total_points || 0,
        followers: w.follower_count || 0,
        engagementRate: parseFloat(w.engagement_rate) || 0,
      },
    }));

    res.json({
      success: true,
      data: {
        watchlist: formatted,
        count: formatted.length,
      },
    });
  } catch (error) {
    console.error('[Watchlist API] Error getting watchlist:', error);
    res.status(500).json({ success: false, error: 'Failed to get watchlist' });
  }
});

/**
 * GET /api/watchlist/ids
 * Get just the influencer IDs in user's watchlist (for quick checks)
 */
router.get('/ids', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const watchlist = await db('user_watchlist')
      .where('user_id', userId)
      .select('influencer_id');

    const ids = watchlist.map((w) => w.influencer_id);

    res.json({
      success: true,
      data: { influencerIds: ids },
    });
  } catch (error) {
    console.error('[Watchlist API] Error getting watchlist IDs:', error);
    res.status(500).json({ success: false, error: 'Failed to get watchlist' });
  }
});

/**
 * POST /api/watchlist/:influencerId
 * Add influencer to watchlist (scout)
 */
router.post('/:influencerId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const influencerId = parseInt(req.params.influencerId);
    if (isNaN(influencerId)) {
      return res.status(400).json({ success: false, error: 'Invalid influencer ID' });
    }

    // Check influencer exists
    const influencer = await db('influencers').where('id', influencerId).first();
    if (!influencer) {
      return res.status(404).json({ success: false, error: 'Influencer not found' });
    }

    // Check if already in watchlist
    const existing = await db('user_watchlist')
      .where({ user_id: userId, influencer_id: influencerId })
      .first();

    if (existing) {
      return res.json({
        success: true,
        data: { action: 'already_scouted', influencerId },
      });
    }

    // Add to watchlist
    await db('user_watchlist').insert({
      user_id: userId,
      influencer_id: influencerId,
      notes: req.body.notes || null,
    });

    res.json({
      success: true,
      data: {
        action: 'scouted',
        influencerId,
        influencer: {
          id: influencer.id,
          handle: influencer.twitter_handle,
          name: influencer.display_name,
          tier: influencer.tier,
          price: parseFloat(influencer.price) || 10,
        },
      },
    });
  } catch (error) {
    console.error('[Watchlist API] Error adding to watchlist:', error);
    res.status(500).json({ success: false, error: 'Failed to add to watchlist' });
  }
});

/**
 * DELETE /api/watchlist/:influencerId
 * Remove influencer from watchlist
 */
router.delete('/:influencerId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const influencerId = parseInt(req.params.influencerId);
    if (isNaN(influencerId)) {
      return res.status(400).json({ success: false, error: 'Invalid influencer ID' });
    }

    const deleted = await db('user_watchlist')
      .where({ user_id: userId, influencer_id: influencerId })
      .delete();

    res.json({
      success: true,
      data: {
        action: deleted > 0 ? 'removed' : 'not_found',
        influencerId,
      },
    });
  } catch (error) {
    console.error('[Watchlist API] Error removing from watchlist:', error);
    res.status(500).json({ success: false, error: 'Failed to remove from watchlist' });
  }
});

export default router;
