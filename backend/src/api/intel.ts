/**
 * Intel API
 * CT Research Command Center endpoints
 * - Influencer profiles with historical metrics
 * - Rising stars discovery and voting
 * - Comparison tool
 */

import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Extended request type with user info
interface AuthRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

/**
 * GET /api/intel/influencers
 * Paginated list of influencers with metrics
 */
router.get('/influencers', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Filters
    const tier = req.query.tier as string;
    const sortBy = (req.query.sortBy as string) || 'total_points';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
    const search = req.query.search as string;

    // Build base filter conditions
    const baseConditions = (qb: any) => {
      qb.where('is_active', true).whereNotNull('twitter_handle');

      if (tier && ['S', 'A', 'B', 'C'].includes(tier)) {
        qb.where('tier', tier);
      }

      if (search) {
        qb.where(function (this: any) {
          this.whereILike('twitter_handle', `%${search}%`)
            .orWhereILike('display_name', `%${search}%`);
        });
      }
    };

    // Valid sort columns
    const validSortColumns: Record<string, string> = {
      total_points: 'total_points',
      points: 'total_points',
      price: 'price',
      followers: 'follower_count',
      engagement: 'engagement_rate',
    };

    const sortColumn = validSortColumns[sortBy] || 'total_points';

    // Get total count with separate query
    const [{ count }] = await db('influencers')
      .where(baseConditions)
      .count('* as count');
    const total = parseInt(count as string) || 0;

    // Get paginated results
    const influencers = await db('influencers')
      .select(
        'id',
        'twitter_handle as handle',
        'display_name as name',
        'avatar_url as avatar',
        'tier',
        'price',
        'total_points as totalPoints',
        'follower_count as followers',
        'engagement_rate as engagementRate',
        'last_scraped_at as lastUpdated'
      )
      .where(baseConditions)
      .orderBy(sortColumn, sortOrder)
      .limit(limit)
      .offset(offset);

    // If user is logged in, add scouted status
    let scoutedIds: number[] = [];
    if (req.user?.userId) {
      const scouted = await db('user_watchlist')
        .where('user_id', req.user.userId)
        .select('influencer_id');
      scoutedIds = scouted.map(s => s.influencer_id);
    }

    const formatted = influencers.map(inf => ({
      ...inf,
      price: parseFloat(inf.price) || 10,
      totalPoints: inf.totalPoints || 0,
      followers: inf.followers || 0,
      engagementRate: parseFloat(inf.engagementRate) || 0,
      isScouted: scoutedIds.includes(inf.id),
    }));

    res.json({
      success: true,
      data: {
        influencers: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('[Intel API] Error fetching influencers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch influencers' });
  }
});

/**
 * GET /api/intel/influencers/:id
 * Single influencer with full details and historical metrics
 */
router.get('/influencers/:id', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const influencerId = parseInt(req.params.id);
    if (isNaN(influencerId)) {
      return res.status(400).json({ success: false, error: 'Invalid influencer ID' });
    }

    // Get influencer details
    const influencer = await db('influencers')
      .select(
        'id',
        'twitter_handle as handle',
        'display_name as name',
        'avatar_url as avatar',
        'tier',
        'price',
        'total_points as totalPoints',
        'follower_count as followers',
        'engagement_rate as engagementRate',
        'last_scraped_at as lastUpdated',
        'created_at as addedAt'
      )
      .where('id', influencerId)
      .first();

    if (!influencer) {
      return res.status(404).json({ success: false, error: 'Influencer not found' });
    }

    // Get historical metrics (last 30 days)
    const metrics = await db('influencer_metrics')
      .select(
        'follower_count as followers',
        'engagement_rate as engagementRate',
        'likes_count as likes',
        'retweets_count as retweets',
        'scraped_at as date'
      )
      .where('influencer_id', influencerId)
      .orderBy('scraped_at', 'desc')
      .limit(30);

    // Get recent tweets
    const tweets = await db('ct_tweets')
      .select(
        'id',
        'tweet_id as tweetId',
        'text',
        'likes',
        'retweets',
        'replies',
        'views',
        'engagement_score as engagementScore',
        'created_at as createdAt'
      )
      .where('influencer_id', influencerId)
      .orderBy('created_at', 'desc')
      .limit(10);

    // Calculate trends
    let followerTrend = 0;
    let engagementTrend = 0;
    if (metrics.length >= 2) {
      const latest = metrics[0];
      const oldest = metrics[metrics.length - 1];
      followerTrend = latest.followers - oldest.followers;
      engagementTrend = parseFloat(latest.engagementRate) - parseFloat(oldest.engagementRate);
    }

    // Check if scouted
    let isScouted = false;
    if (req.user?.userId) {
      const scouted = await db('user_watchlist')
        .where({ user_id: req.user.userId, influencer_id: influencerId })
        .first();
      isScouted = !!scouted;
    }

    res.json({
      success: true,
      data: {
        influencer: {
          ...influencer,
          price: parseFloat(influencer.price) || 10,
          totalPoints: influencer.totalPoints || 0,
          followers: influencer.followers || 0,
          engagementRate: parseFloat(influencer.engagementRate) || 0,
          isScouted,
          trends: {
            followers: followerTrend,
            engagement: engagementTrend,
          },
        },
        metrics: metrics.reverse(), // Chronological order for charts
        recentTweets: tweets.map(t => ({
          ...t,
          engagementScore: parseFloat(t.engagementScore) || 0,
        })),
      },
    });
  } catch (error) {
    console.error('[Intel API] Error fetching influencer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch influencer' });
  }
});

/**
 * GET /api/intel/rising-stars
 * Rising stars discovery list with voting
 */
router.get('/rising-stars', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const status = (req.query.status as string) || 'discovered';

    // Get rising stars
    const stars = await db('rising_stars')
      .select(
        'id',
        'twitter_handle as handle',
        'name',
        'bio',
        'profile_image_url as avatar',
        'followers_count as followers',
        'follower_growth_rate as growthRate',
        'avg_likes_per_tweet as avgLikes',
        'avg_retweets_per_tweet as avgRetweets',
        'viral_tweet_count as viralTweets',
        'votes_for as votesFor',
        'votes_against as votesAgainst',
        'status',
        'discovered_at as discoveredAt'
      )
      .where('status', status)
      .orderBy('follower_growth_rate', 'desc')
      .limit(limit);

    // Get user's votes if logged in
    let userVotes: Record<string, 'for' | 'against'> = {};
    if (req.user?.userId) {
      const votes = await db('feed_interactions')
        .select('rising_star_id', 'interaction_type')
        .where('user_id', req.user.userId)
        .whereIn('interaction_type', ['vote_for', 'vote_against'])
        .whereNotNull('rising_star_id');

      for (const vote of votes) {
        userVotes[vote.rising_star_id] = vote.interaction_type === 'vote_for' ? 'for' : 'against';
      }
    }

    const formatted = stars.map(star => ({
      ...star,
      followers: star.followers || 0,
      growthRate: parseFloat(star.growthRate) || 0,
      avgLikes: parseFloat(star.avgLikes) || 0,
      avgRetweets: parseFloat(star.avgRetweets) || 0,
      viralTweets: star.viralTweets || 0,
      votesFor: star.votesFor || 0,
      votesAgainst: star.votesAgainst || 0,
      userVote: userVotes[star.id] || null,
      voteScore: (star.votesFor || 0) - (star.votesAgainst || 0),
    }));

    res.json({
      success: true,
      data: {
        stars: formatted,
        count: formatted.length,
      },
    });
  } catch (error) {
    console.error('[Intel API] Error fetching rising stars:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rising stars' });
  }
});

/**
 * POST /api/intel/rising-stars/:id/vote
 * Vote for or against a rising star
 */
router.post('/rising-stars/:id/vote', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const starId = req.params.id;
    const { vote } = req.body; // 'for' or 'against'

    if (!vote || !['for', 'against'].includes(vote)) {
      return res.status(400).json({ success: false, error: 'Vote must be "for" or "against"' });
    }

    // Check star exists
    const star = await db('rising_stars').where('id', starId).first();
    if (!star) {
      return res.status(404).json({ success: false, error: 'Rising star not found' });
    }

    // Check if user already voted
    const existingVote = await db('feed_interactions')
      .where({
        user_id: userId,
        rising_star_id: starId,
      })
      .whereIn('interaction_type', ['vote_for', 'vote_against'])
      .first();

    const interactionType = vote === 'for' ? 'vote_for' : 'vote_against';

    if (existingVote) {
      // Already voted same way
      if ((existingVote.interaction_type === 'vote_for' && vote === 'for') ||
          (existingVote.interaction_type === 'vote_against' && vote === 'against')) {
        return res.json({
          success: true,
          data: { action: 'already_voted', vote },
        });
      }

      // Changing vote - remove old, add new
      await db.transaction(async (trx) => {
        // Update old vote counts
        if (existingVote.interaction_type === 'vote_for') {
          await trx('rising_stars').where('id', starId).decrement('votes_for', 1);
        } else {
          await trx('rising_stars').where('id', starId).decrement('votes_against', 1);
        }

        // Update interaction
        await trx('feed_interactions')
          .where('id', existingVote.id)
          .update({ interaction_type: interactionType, created_at: new Date() });

        // Update new vote counts
        if (vote === 'for') {
          await trx('rising_stars').where('id', starId).increment('votes_for', 1);
        } else {
          await trx('rising_stars').where('id', starId).increment('votes_against', 1);
        }
      });

      return res.json({
        success: true,
        data: { action: 'changed_vote', vote },
      });
    }

    // New vote
    await db.transaction(async (trx) => {
      await trx('feed_interactions').insert({
        user_id: userId,
        rising_star_id: starId,
        interaction_type: interactionType,
      });

      if (vote === 'for') {
        await trx('rising_stars').where('id', starId).increment('votes_for', 1);
      } else {
        await trx('rising_stars').where('id', starId).increment('votes_against', 1);
      }
    });

    res.json({
      success: true,
      data: { action: 'voted', vote },
    });
  } catch (error) {
    console.error('[Intel API] Error voting:', error);
    res.status(500).json({ success: false, error: 'Failed to vote' });
  }
});

/**
 * GET /api/intel/compare
 * Compare 2-3 influencers side by side
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      return res.status(400).json({ success: false, error: 'Provide influencer IDs: ?ids=1,2,3' });
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (ids.length < 2 || ids.length > 3) {
      return res.status(400).json({ success: false, error: 'Provide 2-3 influencer IDs' });
    }

    // Get influencers
    const influencers = await db('influencers')
      .select(
        'id',
        'twitter_handle as handle',
        'display_name as name',
        'avatar_url as avatar',
        'tier',
        'price',
        'total_points as totalPoints',
        'follower_count as followers',
        'engagement_rate as engagementRate'
      )
      .whereIn('id', ids);

    if (influencers.length < 2) {
      return res.status(404).json({ success: false, error: 'Not enough influencers found' });
    }

    // Get recent metrics for trends
    const metricsPromises = ids.map(id =>
      db('influencer_metrics')
        .select('follower_count', 'engagement_rate', 'scraped_at')
        .where('influencer_id', id)
        .orderBy('scraped_at', 'desc')
        .limit(7)
    );

    const allMetrics = await Promise.all(metricsPromises);

    // Format response
    const formatted = influencers.map((inf, idx) => {
      const metrics = allMetrics[idx] || [];
      let followerTrend = 0;
      let engagementTrend = 0;

      if (metrics.length >= 2) {
        const latest = metrics[0];
        const oldest = metrics[metrics.length - 1];
        followerTrend = latest.follower_count - oldest.follower_count;
        engagementTrend = parseFloat(latest.engagement_rate) - parseFloat(oldest.engagement_rate);
      }

      return {
        ...inf,
        price: parseFloat(inf.price) || 10,
        totalPoints: inf.totalPoints || 0,
        followers: inf.followers || 0,
        engagementRate: parseFloat(inf.engagementRate) || 0,
        trends: {
          followers: followerTrend,
          engagement: engagementTrend,
        },
        metricsHistory: metrics.reverse(),
      };
    });

    // Calculate comparison stats
    const comparison = {
      bestValue: formatted.reduce((best, curr) =>
        (curr.totalPoints / curr.price) > (best.totalPoints / best.price) ? curr : best
      ).id,
      mostFollowers: formatted.reduce((best, curr) =>
        curr.followers > best.followers ? curr : best
      ).id,
      highestEngagement: formatted.reduce((best, curr) =>
        curr.engagementRate > best.engagementRate ? curr : best
      ).id,
      mostPoints: formatted.reduce((best, curr) =>
        curr.totalPoints > best.totalPoints ? curr : best
      ).id,
    };

    res.json({
      success: true,
      data: {
        influencers: formatted,
        comparison,
      },
    });
  } catch (error) {
    console.error('[Intel API] Error comparing:', error);
    res.status(500).json({ success: false, error: 'Failed to compare influencers' });
  }
});

/**
 * GET /api/intel/stats
 * General stats for Intel page header
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Get counts
    const [influencerCount] = await db('influencers').count('* as count');
    const [tweetCount] = await db('ct_tweets').count('* as count');
    const [starCount] = await db('rising_stars').where('status', 'discovered').count('* as count');

    // Get top performers today
    const topToday = await db('influencers')
      .select('twitter_handle as handle', 'display_name as name', 'tier')
      .orderBy('total_points', 'desc')
      .limit(3);

    res.json({
      success: true,
      data: {
        totalInfluencers: parseInt(influencerCount.count as string) || 0,
        totalTweets: parseInt(tweetCount.count as string) || 0,
        risingStar: parseInt(starCount.count as string) || 0,
        topPerformers: topToday,
      },
    });
  } catch (error) {
    console.error('[Intel API] Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/intel/influencers/:id/weekly-history
 * Returns 4-week engagement history computed from ct_tweets.
 * Used by the influencer detail modal to show weekly performance trends.
 */
router.get('/influencers/:id/weekly-history', async (req: AuthRequest, res: Response) => {
  try {
    const influencerId = parseInt(req.params.id);
    if (isNaN(influencerId)) {
      return res.status(400).json({ success: false, error: 'Invalid influencer ID' });
    }

    // Check influencer exists
    const influencer = await db('influencers').where('id', influencerId).first();
    if (!influencer) {
      return res.status(404).json({ success: false, error: 'Influencer not found' });
    }

    // Query weekly data from ct_tweets using DATE_TRUNC
    const weeklyData = await db.raw(`
      SELECT
        DATE_TRUNC('week', created_at)::date as week_start,
        COUNT(*)::int as tweet_count,
        COALESCE(SUM(likes), 0)::bigint as total_likes,
        COALESCE(SUM(retweets), 0)::bigint as total_retweets,
        COALESCE(SUM(views), 0)::bigint as total_views,
        COALESCE(SUM(replies), 0)::bigint as total_replies,
        COALESCE(AVG(engagement_score), 0)::float as avg_engagement
      FROM ct_tweets
      WHERE influencer_id = ? AND created_at >= NOW() - INTERVAL '4 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week_start DESC
      LIMIT 4
    `, [influencerId]);

    const rows = weeklyData.rows || [];

    // Calculate estimated points for each week
    interface WeekData {
      weekLabel: string;
      tweetCount: number;
      totalLikes: number;
      totalRetweets: number;
      totalViews: number;
      totalReplies: number;
      avgEngagement: number;
      estimatedPts: number;
    }

    const weeks: WeekData[] = rows.map((row: any) => {
      // Scoring formula: activity + engagement + viral
      const activityPts = Math.min(row.tweet_count * 5, 35);
      const engagementPts = Math.min(
        ((row.total_likes + row.total_retweets * 2 + row.total_replies) / 1000) * 10,
        60
      );

      // Count viral tweets (avg_engagement > 500)
      let viralCount = 0;
      if (row.avg_engagement > 500) {
        viralCount = Math.min(row.tweet_count, 5); // Conservative estimate
      }
      const viralPts = Math.min(viralCount * 5, 25);

      const estimatedPts = Math.round(activityPts + engagementPts + viralPts);

      // Format week label: "Feb 17"
      const weekStart = new Date(row.week_start);
      const monthStr = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const dayStr = weekStart.getDate();
      const weekLabel = `${monthStr} ${dayStr}`;

      return {
        weekLabel,
        tweetCount: row.tweet_count,
        totalLikes: Number(row.total_likes),
        totalRetweets: Number(row.total_retweets),
        totalViews: Number(row.total_views),
        totalReplies: Number(row.total_replies),
        avgEngagement: Number(row.avg_engagement),
        estimatedPts,
      };
    });

    // Calculate consistency stats
    let consistency = 'Steady';
    let avgWeeklyPts = 0;
    let trend = 'neutral';

    if (weeks.length > 0) {
      avgWeeklyPts = Math.round(weeks.reduce((sum, w) => sum + w.estimatedPts, 0) / weeks.length);

      if (weeks.length > 1) {
        const points = weeks.map(w => w.estimatedPts);
        const mean = points.reduce((a, b) => a + b, 0) / points.length;
        const variance = points.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / points.length;
        const stdDev = Math.sqrt(variance);
        const stdDevPercent = (stdDev / mean) * 100;

        if (stdDevPercent > 50) {
          consistency = 'Volatile';
        } else if (stdDevPercent < 20) {
          consistency = 'Stable';
        } else {
          consistency = 'Steady';
        }

        // Check trend
        const latest = points[0];
        const previous = points[1];
        if (latest > previous * 1.2) {
          trend = 'rising';
          consistency = 'Rising';
        } else if (latest < previous * 0.8) {
          trend = 'declining';
          consistency = 'Declining';
        }
      }
    }

    res.json({
      success: true,
      data: {
        weeks: weeks.reverse(), // Chronological order (oldest first)
        consistency,
        avgWeeklyPts,
        trend,
      },
    });
  } catch (error) {
    console.error('[Intel API] Error fetching weekly history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weekly history' });
  }
});

/**
 * GET /api/intel/community-picks
 * Returns ranked list of most drafted influencers (last 7 days)
 */
router.get('/community-picks', async (_req: Request, res: Response) => {
  try {
    const picks = await db.raw(`
      SELECT
        i.id as influencer_id,
        i.twitter_handle as handle,
        i.display_name as name,
        i.avatar_url as avatar,
        i.tier,
        i.price,
        COUNT(*)::int as draft_count,
        COUNT(DISTINCT e.user_id)::int as unique_drafters
      FROM free_league_entries e
      CROSS JOIN LATERAL UNNEST(e.team_ids) AS unnested_id(influencer_id)
      JOIN influencers i ON i.id = unnested_id.influencer_id
      WHERE e.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY i.id, i.twitter_handle, i.display_name, i.avatar_url, i.tier, i.price
      ORDER BY draft_count DESC
      LIMIT 20
    `);

    const formatted = (picks.rows || []).map((row: any) => ({
      influencerId: row.influencer_id,
      handle: row.handle,
      name: row.name,
      avatar: row.avatar,
      tier: row.tier || 'C',
      price: parseFloat(row.price) || 10,
      draftCount: row.draft_count,
      uniqueDrafters: row.unique_drafters,
    }));

    res.json({
      success: true,
      data: {
        picks: formatted,
      },
    });
  } catch (error) {
    console.error('[Intel API] Error fetching community picks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch community picks' });
  }
});

export default router;
