import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { authenticate } from '../middleware/auth';
import foresightScoreService from '../services/foresightScoreService';
import questService from '../services/questService';
import tapestryService from '../services/tapestryService';
import logger from '../utils/logger';
import { getXPLevel } from '../utils/xp';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const router = Router();

// Contest type codes
export const ContestTypeCodes = {
  FREE_LEAGUE: 'FREE_LEAGUE',
  WEEKLY_STARTER: 'WEEKLY_STARTER',
  WEEKLY_STANDARD: 'WEEKLY_STANDARD',
  WEEKLY_PRO: 'WEEKLY_PRO',
  DAILY_FLASH: 'DAILY_FLASH',
} as const;

// ============ CONTEST TYPES ENDPOINTS ============

/**
 * GET /api/v2/contest-types
 * Get all available contest types with their configurations
 */
router.get('/contest-types', async (req: Request, res: Response) => {
  try {
    const types = await db('contest_types')
      .where('is_active', true)
      .orderBy('display_order', 'asc');

    res.json({
      contestTypes: types.map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
        description: t.description,
        entryFee: parseFloat(t.entry_fee),
        entryFeeFormatted: t.is_free ? 'Free' : `${parseFloat(t.entry_fee).toFixed(3)} SOL`,
        teamSize: t.team_size,
        hasCaptain: t.has_captain,
        durationHours: t.duration_hours,
        durationLabel: t.duration_hours === 24 ? '24 hours' : '7 days',
        rakePercent: parseFloat(t.rake_percent),
        minPlayers: t.min_players,
        maxPlayers: t.max_players,
        winnersPercent: t.winners_percent,
        isFree: t.is_free,
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching contest types:', error, { context: 'Prized Contests V2 API' });
    res.status(500).json({ error: 'Failed to fetch contest types' });
  }
});

// ============ CONTESTS ENDPOINTS ============

/**
 * GET /api/v2/contests
 * List all contests with filtering by type, status, etc.
 */
router.get('/contests', async (req: Request, res: Response) => {
  try {
    const { status, type, free, upcoming, active } = req.query;

    let query = db('prized_contests')
      .leftJoin('contest_types', 'prized_contests.contest_type_id', 'contest_types.id')
      .select(
        'prized_contests.*',
        'contest_types.code as type_code',
        'contest_types.name as type_name',
        'contest_types.description as type_description'
      )
      .orderBy('prized_contests.created_at', 'desc');

    if (status) {
      query = query.where('prized_contests.status', status as string);
    }

    if (type) {
      query = query.where('contest_types.code', type as string);
    }

    if (free === 'true') {
      query = query.where('prized_contests.is_free', true);
    }

    if (upcoming === 'true') {
      query = query.where('prized_contests.status', 'open')
        .where('prized_contests.lock_time', '>', new Date());
    }

    if (active === 'true') {
      query = query.whereIn('prized_contests.status', ['open', 'locked', 'scoring']);
    }

    const contests = await query;

    res.json({
      contests: contests.map(c => ({
        id: c.id,
        contractContestId: c.contract_contest_id,
        name: c.name,
        description: c.description,
        typeCode: c.type_code,
        typeName: c.type_name,
        typeDescription: c.type_description,
        entryFee: parseFloat(c.entry_fee),
        entryFeeFormatted: c.is_free ? 'Free' : `${parseFloat(c.entry_fee).toFixed(3)} SOL`,
        teamSize: c.team_size,
        hasCaptain: c.has_captain,
        rakePercent: parseFloat(c.rake_percent),
        minPlayers: c.min_players,
        maxPlayers: c.max_players,
        lockTime: c.lock_time,
        endTime: c.end_time,
        prizePool: parseFloat(c.prize_pool || 0),
        prizePoolFormatted: `${parseFloat(c.prize_pool || 0).toFixed(3)} SOL`,
        playerCount: c.player_count,
        status: c.status,
        isFree: c.is_free,
        spotsRemaining: c.max_players > 0 ? Math.max(0, c.max_players - c.player_count) : null,
        isOpen: c.status === 'open' && new Date(c.lock_time) > new Date(),
        winnersCount: c.winners_count,
        createdAt: c.created_at,
        isSignatureLeague: c.is_signature_league || false,
        creatorHandle: c.creator_handle || null,
        creatorAvatarUrl: c.creator_avatar_url || null,
        creatorFollowerCount: c.creator_follower_count || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

/**
 * GET /api/v2/contests/:id
 * Get single contest with full details
 */
router.get('/contests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contest = await db('prized_contests')
      .leftJoin('contest_types', 'prized_contests.contest_type_id', 'contest_types.id')
      .select(
        'prized_contests.*',
        'contest_types.code as type_code',
        'contest_types.name as type_name',
        'contest_types.description as type_description',
        'contest_types.winners_percent'
      )
      .where('prized_contests.id', id)
      .orWhere('prized_contests.contract_contest_id', id)
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Get prize distribution rules for this contest size
    const prizeRules = await getPrizeDistributionRules(contest.player_count || contest.min_players);

    // Get top entries if finalized
    let topEntries: any[] = [];
    if (contest.status === 'finalized' || contest.status === 'scoring') {
      const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';
      topEntries = await db(entriesTable)
        .where('contest_id', contest.id)
        .whereNotNull('rank')
        .orderBy('rank', 'asc')
        .limit(20);
    }

    res.json({
      contest: {
        id: contest.id,
        contractContestId: contest.contract_contest_id,
        name: contest.name,
        description: contest.description,
        typeCode: contest.type_code,
        typeName: contest.type_name,
        typeDescription: contest.type_description,
        entryFee: parseFloat(contest.entry_fee),
        entryFeeFormatted: contest.is_free ? 'Free' : `${parseFloat(contest.entry_fee).toFixed(3)} SOL`,
        teamSize: contest.team_size,
        hasCaptain: contest.has_captain,
        rakePercent: parseFloat(contest.rake_percent),
        minPlayers: contest.min_players,
        maxPlayers: contest.max_players,
        lockTime: contest.lock_time,
        endTime: contest.end_time,
        prizePool: parseFloat(contest.prize_pool || 0),
        prizePoolFormatted: `${parseFloat(contest.prize_pool || 0).toFixed(3)} SOL`,
        distributablePool: parseFloat(contest.distributable_pool || 0),
        playerCount: contest.player_count,
        status: contest.status,
        isFree: contest.is_free,
        winnersPercent: contest.winners_percent,
        winnersCount: contest.winners_count,
        prizeBreakdown: contest.prize_breakdown,
        createdAt: contest.created_at,
      },
      prizeRules,
      topEntries: topEntries.map(e => ({
        rank: e.rank,
        walletAddress: e.wallet_address,
        score: e.score,
        prizeAmount: parseFloat(e.prize_won || e.prize_amount || 0),
        claimed: e.claimed,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching contest:', error);
    res.status(500).json({ error: 'Failed to fetch contest' });
  }
});

/**
 * GET /api/v2/contests/:id/entries
 * Get leaderboard/entries for a contest
 */
router.get('/contests/:id/entries', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const contest = await db('prized_contests').where('id', id).first();
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';

    let query = db(entriesTable)
      .leftJoin('users', `${entriesTable}.user_id`, 'users.id')
      .where(`${entriesTable}.contest_id`, id)
      .select(
        `${entriesTable}.*`,
        'users.username'
      );

    // Sort by rank/score when available, otherwise by entry time
    if (contest.status === 'finalized' || contest.status === 'scoring') {
      query = query.orderBy(`${entriesTable}.rank`, 'asc');
    } else {
      // For open/locked contests, order by score desc if scores exist
      query = query.orderByRaw(`COALESCE(${entriesTable}.score, 0) DESC, ${entriesTable}.created_at ASC`);
    }

    const entries = await query.limit(Number(limit)).offset(Number(offset));
    const total = await db(entriesTable).where('contest_id', id).count('* as count').first();

    // Get captain influencer names for display
    const captainIds = entries
      .filter(e => e.captain_id)
      .map(e => e.captain_id);

    const captains = captainIds.length > 0
      ? await db('influencers').whereIn('id', captainIds)
      : [];
    const captainMap = new Map(captains.map(c => [c.id, c]));

    res.json({
      entries: entries.map(e => ({
        id: e.id,
        walletAddress: e.wallet_address,
        username: e.username || `${e.wallet_address.slice(0, 6)}...${e.wallet_address.slice(-4)}`,
        teamIds: e.team_ids,
        teamSize: e.team_ids?.length || 0,
        captainId: e.captain_id,
        captainHandle: e.captain_id ? captainMap.get(e.captain_id)?.twitter_handle : null,
        rank: e.rank,
        score: e.score,
        scoreBreakdown: e.score_breakdown,
        prizeAmount: parseFloat(e.prize_won || e.prize_amount || 0),
        claimed: e.claimed,
        createdAt: e.created_at,
      })),
      total: total?.count || 0,
      contestStatus: contest.status,
      teamSize: contest.team_size,
      hasCaptain: contest.has_captain,
    });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

/**
 * GET /api/v2/contests/:id/social-scouts
 * Returns entries in this contest made by users the current user follows.
 * Matches by tapestry_user_id (primary) OR username (fallback).
 * If nobody has entered this contest yet, falls back to their most recent entries
 * from any other contest (for the "Rival Picks" panel to always show something useful).
 */
router.get('/contests/:id/social-scouts', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 1. Get the contest
    const contest = await db('prized_contests').where('id', id).first();
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // 2. Fetch who this user follows from local DB (source of truth)
    const follows = await db('user_follows')
      .where('follower_user_id', userId)
      .select('following_tapestry_profile_id', 'following_username');

    if (follows.length === 0) {
      return res.json({ scouts: [], message: 'You are not following anyone yet' });
    }

    const followingIds = follows.map((f: any) => f.following_tapestry_profile_id).filter(Boolean);
    const followingUsernames = follows.map((f: any) => f.following_username).filter(Boolean).map((u: string) => u.toLowerCase());

    // Helper: build the WHERE clause matching by tapestry_user_id OR username
    const buildFollowFilter = (query: any, table: string) => {
      query.where(function(this: any) {
        let added = false;
        if (followingIds.length > 0) {
          this.whereIn(`${table}.tapestry_user_id`, followingIds);
          added = true;
        }
        if (followingUsernames.length > 0) {
          if (added) {
            this.orWhereRaw('LOWER(users.username) = ANY(?)', [followingUsernames]);
          } else {
            this.whereRaw('LOWER(users.username) = ANY(?)', [followingUsernames]);
          }
        }
      });
    };

    // 3. Try to find entries for THIS specific contest first
    const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';
    const contestQuery = db(entriesTable)
      .join('users', `${entriesTable}.user_id`, 'users.id')
      .where(`${entriesTable}.contest_id`, id)
      .select(
        `${entriesTable}.team_ids`,
        `${entriesTable}.captain_id`,
        `${entriesTable}.score`,
        'users.username',
        'users.tapestry_user_id',
        db.raw('NULL::text as fallback_contest_name'),
      )
      .limit(10);
    buildFollowFilter(contestQuery, 'users');
    let scouts = await contestQuery;
    let fromPreviousContest = false;

    // 4. Fallback: if nobody has entered this contest yet, show their most recent entries from any contest
    if (scouts.length === 0) {
      const fallbackQuery = db('free_league_entries as e')
        .join('users', 'e.user_id', 'users.id')
        .join('prized_contests as c', 'e.contest_id', 'c.id')
        .whereNot('e.contest_id', id) // exclude current contest to avoid confusion
        .orderBy('e.created_at', 'desc')
        .select(
          'e.team_ids',
          'e.captain_id',
          'e.score',
          'users.username',
          'users.tapestry_user_id',
          'c.name as fallback_contest_name',
        )
        .limit(10);
      buildFollowFilter(fallbackQuery, 'users');

      // Deduplicate: one entry per user (their most recent)
      const allFallback = await fallbackQuery;
      const seenUsers = new Set<string>();
      scouts = allFallback.filter((s: any) => {
        const key = s.username || s.tapestry_user_id;
        if (!key || seenUsers.has(key)) return false;
        seenUsers.add(key);
        return true;
      });
      fromPreviousContest = scouts.length > 0;
    }

    if (scouts.length === 0) {
      return res.json({ scouts: [], message: 'None of your follows have entered any contests yet' });
    }

    // 5. Resolve captain handles
    const captainIds = scouts.filter((s: any) => s.captain_id).map((s: any) => s.captain_id);
    const captains = captainIds.length > 0
      ? await db('influencers').whereIn('id', captainIds).select('id', 'twitter_handle', 'display_name')
      : [];
    const captainMap = new Map(captains.map((c: any) => [c.id, c]));

    res.json({
      fromPreviousContest,
      scouts: scouts.map((s: any) => ({
        username: s.username || 'Anonymous',
        tapestryUserId: s.tapestry_user_id,
        teamIds: s.team_ids,
        captainId: s.captain_id,
        captainHandle: s.captain_id ? captainMap.get(s.captain_id)?.twitter_handle : null,
        score: s.score,
        contestName: s.fallback_contest_name || null,
      })),
    });
  } catch (error: any) {
    console.error('[SocialScouts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch scout data' });
  }
});

// ============ FREE LEAGUE ENDPOINTS ============

/**
 * POST /api/v2/contests/:id/enter-free
 * Enter a free league contest (no blockchain transaction needed)
 */
router.post('/contests/:id/enter-free', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teamIds, captainId } = req.body;
    const userId = req.user!.userId;
    const walletAddress = req.user!.walletAddress;

    console.log('📥 enter-free request:', { id, teamIds, captainId, userId, walletAddress, body: req.body });

    if (!walletAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }

    const contest = await db('prized_contests')
      .leftJoin('contest_types', 'prized_contests.contest_type_id', 'contest_types.id')
      .select('prized_contests.*', 'contest_types.code as type_code', 'contest_types.has_captain')
      .where('prized_contests.id', id)
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    if (!contest.is_free) {
      return res.status(400).json({ error: 'This contest requires payment. Use the smart contract.' });
    }

    if (contest.status !== 'open') {
      return res.status(400).json({ error: 'Contest is not open for entries' });
    }

    if (new Date(contest.lock_time) <= new Date()) {
      return res.status(400).json({ error: 'Contest entry period has ended' });
    }

    // Validate team size
    if (!Array.isArray(teamIds) || teamIds.length !== contest.team_size) {
      return res.status(400).json({ error: `Team must have exactly ${contest.team_size} influencers` });
    }

    // Validate captain (if required)
    if (contest.has_captain) {
      if (!captainId || !teamIds.includes(captainId)) {
        return res.status(400).json({ error: 'Captain must be one of the team members' });
      }
    }

    // Check entry limit for free leagues (1 per wallet per week)
    const weekStart = getWeekStart(new Date());
    const existingLimit = await db('free_league_limits')
      .where('wallet_address', walletAddress.toLowerCase())
      .where('week_start', weekStart)
      .first();

    if (existingLimit && existingLimit.entries_used >= 1) {
      return res.status(400).json({
        error: 'You have already entered a free league this week',
        nextFreeEntry: getNextWeekStart(weekStart)
      });
    }

    // Check if already entered this contest
    const existingEntry = await db('free_league_entries')
      .where('contest_id', id)
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (existingEntry) {
      return res.status(400).json({ error: 'You have already entered this contest' });
    }

    // Check max players
    if (contest.max_players > 0 && contest.player_count >= contest.max_players) {
      return res.status(400).json({ error: 'Contest is full' });
    }

    // Create entry
    const [entry] = await db('free_league_entries')
      .insert({
        contest_id: id,
        user_id: userId,
        wallet_address: walletAddress.toLowerCase(),
        team_ids: teamIds,
        captain_id: contest.has_captain ? captainId : null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Update/create entry limit
    if (existingLimit) {
      await db('free_league_limits')
        .where('id', existingLimit.id)
        .update({ entries_used: existingLimit.entries_used + 1 });
    } else {
      await db('free_league_limits').insert({
        wallet_address: walletAddress.toLowerCase(),
        week_start: weekStart,
        entries_used: 1,
        created_at: new Date(),
      });
    }

    // Update contest player count
    await db('prized_contests')
      .where('id', id)
      .increment('player_count', 1)
      .update({ updated_at: new Date() });

    // Award Foresight Score for contest entry
    foresightScoreService.earnFs({
      userId,
      reason: 'contest_entry',
      category: 'fantasy',
      sourceType: 'contest',
      sourceId: id,
      metadata: { contestName: contest.name, isFree: true }
    }).catch(err => console.error('[FS] Error awarding contest entry FS:', err));

    // Trigger quest progress (async, non-blocking)
    questService.triggerAction(userId, 'contest_entered').catch(err =>
      console.error('[Quest] Error triggering contest_entered:', err));
    questService.triggerAction(userId, 'team_created').catch(err =>
      console.error('[Quest] Error triggering team_created:', err));

    // Publish team to Tapestry (async, non-blocking)
    let tapestryTeamId: string | null = null;
    const user = await db('users').where({ id: userId }).first();
    if (user?.tapestry_user_id) {
      tapestryService.storeTeam(user.tapestry_user_id, userId, {
        contestId: String(id),
        picks: teamIds.map((tid: string) => ({
          influencerId: tid,
          tier: 'unknown',
          isCaptain: tid === captainId,
          price: 0,
        })),
        totalBudgetUsed: 0,
        captainId: captainId || teamIds[0],
      }).then((tId) => {
        tapestryTeamId = tId;
        logger.info(`Team published to Tapestry: ${tId}`, { context: 'ContestsV2' });
      }).catch((err) => logger.error('Error publishing team to Tapestry:', err, { context: 'ContestsV2' }));
    }

    res.json({
      success: true,
      message: 'Successfully entered the free league!',
      entry: {
        id: entry.id,
        teamIds: entry.team_ids,
        captainId: entry.captain_id,
      },
      tapestry: {
        published: !!user?.tapestry_user_id,
        teamId: tapestryTeamId,
      },
    });
  } catch (error: any) {
    console.error('Error entering free league:', error);
    res.status(500).json({ error: 'Failed to enter contest' });
  }
});

/**
 * PUT /api/v2/contests/:id/update-free-team
 * Update team selection for a free league entry
 */
/**
 * GET /api/v2/contests/:id/transfer-status
 * Returns how many team updates the user has used/remaining for this contest
 */
router.get('/contests/:id/transfer-status', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const walletAddress = req.user!.walletAddress;
    if (!walletAddress) return res.status(400).json({ success: false, error: 'No wallet connected' });

    const user = await db('users').where('wallet_address', walletAddress.toLowerCase()).first();
    const xpData = getXPLevel(user?.xp || 0);
    const maxTransfers = xpData.levelInfo.maxTransfers;

    const entry = await db('free_league_entries')
      .where('contest_id', id)
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    const transfersUsed = entry?.update_count || 0;

    res.json({
      success: true,
      data: {
        transfersAllowed: maxTransfers,
        transfersUsed,
        transfersRemaining: Math.max(0, maxTransfers - transfersUsed),
        level: xpData.level,
        isUnlimited: maxTransfers >= 999,
      },
    });
  } catch (error: any) {
    logger.error('Error getting transfer status:', error, { context: 'ContestsV2' });
    res.status(500).json({ success: false, error: 'Failed to get transfer status' });
  }
});

/**
 * PUT /api/v2/contests/:id/update-free-team
 * Update team picks for a free contest entry.
 * Enforces XP-level-based transfer limits (NOVICE=1, APPRENTICE=2, etc.)
 */
router.put('/contests/:id/update-free-team', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teamIds, captainId } = req.body;
    const walletAddress = req.user!.walletAddress;

    console.log('📝 update-free-team request:', { id, teamIds, captainId, walletAddress });

    if (!walletAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }

    const contest = await db('prized_contests').where('id', id).first();
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    if (!contest.is_free) {
      return res.status(400).json({ error: 'Use the smart contract to update paid contest entries' });
    }

    if (contest.status !== 'open' || new Date(contest.lock_time) <= new Date()) {
      return res.status(400).json({ error: 'Cannot update team after contest is locked' });
    }

    const entry = await db('free_league_entries')
      .where('contest_id', id)
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // ── Transfer limit check ───────────────────────────────────────────────
    const user = await db('users').where('wallet_address', walletAddress.toLowerCase()).first();
    const xpData = getXPLevel(user?.xp || 0);
    const maxTransfers = xpData.levelInfo.maxTransfers;
    const transfersUsed = entry.update_count || 0;

    if (transfersUsed >= maxTransfers) {
      return res.status(429).json({
        success: false,
        error: `Weekly transfer limit reached (${maxTransfers} for ${xpData.level} level). Earn XP to unlock more transfers.`,
        transfersRemaining: 0,
        level: xpData.level,
        maxTransfers,
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    // Validate team size
    if (!Array.isArray(teamIds) || teamIds.length !== contest.team_size) {
      return res.status(400).json({ error: `Team must have exactly ${contest.team_size} influencers` });
    }

    // Validate captain
    if (contest.has_captain && (!captainId || !teamIds.includes(captainId))) {
      return res.status(400).json({ error: 'Captain must be one of the team members' });
    }

    await db('free_league_entries')
      .where('id', entry.id)
      .update({
        team_ids: teamIds,
        captain_id: contest.has_captain ? captainId : null,
        updated_at: new Date(),
        update_count: transfersUsed + 1,
      });

    const transfersRemaining = Math.max(0, maxTransfers - (transfersUsed + 1));

    res.json({
      success: true,
      message: 'Team updated successfully',
      transfersRemaining,
      level: xpData.level,
    });
  } catch (error: any) {
    console.error('Error updating free team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/**
 * POST /api/v2/contests/:id/enter-test
 * Test entry for paid contests (DEVELOPMENT ONLY - no payment required)
 * This allows testing the full flow without deploying contests on-chain
 */
router.post('/contests/:id/enter-test', authenticate, async (req: Request, res: Response) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test entries not allowed in production' });
  }

  try {
    const { id } = req.params;
    const { team_name, influencer_ids, captain_id } = req.body;
    const userId = req.user!.userId;
    const walletAddress = req.user!.walletAddress;

    console.log('📥 enter-test request:', { id, team_name, influencer_ids, captain_id, userId, walletAddress, body: req.body });

    if (!walletAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }

    const contest = await db('prized_contests')
      .leftJoin('contest_types', 'prized_contests.contest_type_id', 'contest_types.id')
      .select('prized_contests.*', 'contest_types.code as type_code', 'contest_types.has_captain', 'contest_types.team_size')
      .where('prized_contests.id', id)
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    if (contest.status !== 'open') {
      return res.status(400).json({ error: 'Contest is not open for entries' });
    }

    if (new Date(contest.lock_time) <= new Date()) {
      return res.status(400).json({ error: 'Contest entry period has ended' });
    }

    // Validate team size
    const teamSize = contest.team_size || 5;
    if (!Array.isArray(influencer_ids) || influencer_ids.length !== teamSize) {
      return res.status(400).json({ error: `Team must have exactly ${teamSize} influencers` });
    }

    // Validate captain (if required)
    if (contest.has_captain) {
      if (!captain_id || !influencer_ids.includes(captain_id)) {
        return res.status(400).json({ error: 'Captain must be one of the team members' });
      }
    }

    // Check if already entered
    const existingEntry = await db('prized_entries')
      .where('contest_id', id)
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (existingEntry) {
      return res.status(400).json({ error: 'You have already entered this contest' });
    }

    // Create test entry (simulated payment)
    const entryFee = contest.entry_fee || 0;
    const [entryId] = await db('prized_entries').insert({
      contest_id: id,
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      team_name: team_name || 'Test Team',
      team_ids: influencer_ids,
      captain_id: contest.has_captain ? captain_id : null,
      paid_amount: entryFee,
      entry_tx_hash: `test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');

    // Update contest player count and prize pool
    const rakeAmount = entryFee * (contest.rake_percent / 100);
    await db('prized_contests')
      .where('id', id)
      .increment('player_count', 1)
      .update({
        prize_pool: db.raw('COALESCE(prize_pool, 0) + ?', [entryFee]),
        distributable_pool: db.raw('COALESCE(distributable_pool, 0) + ?', [entryFee - rakeAmount]),
        updated_at: new Date(),
      });

    res.json({
      success: true,
      message: 'Test entry created successfully',
      entryId: entryId?.id || entryId,
      note: 'This is a TEST entry - no real payment was made'
    });
  } catch (error: any) {
    console.error('Error creating test entry:', error);
    res.status(500).json({ error: 'Failed to create test entry' });
  }
});

// ============ USER ENTRY ENDPOINTS ============

/**
 * GET /api/v2/contests/:id/my-entry
 * Get current user's entry in a contest
 */
router.get('/contests/:id/my-entry', authenticate, async (req: Request, res: Response) => {
  // Disable caching for entry data (must always be fresh)
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const walletAddress = req.user!.walletAddress;

    if (!walletAddress) {
      return res.json({ entered: false, entry: null });
    }

    const contest = await db('prized_contests').where('id', id).first();
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';
    const prizeColumn = contest.is_free ? 'prize_won' : 'prize_amount';

    const entry = await db(entriesTable)
      .where('contest_id', id)
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (!entry) {
      return res.json({ entered: false, entry: null });
    }

    // Get influencer details
    const influencers = await db('influencers').whereIn('id', entry.team_ids);
    const influencerMap = new Map(influencers.map(i => [i.id, i]));

    res.json({
      entered: true,
      entry: {
        id: entry.id,
        teamIds: entry.team_ids,
        captainId: entry.captain_id,
        team: entry.team_ids.map((infId: number) => {
          const inf = influencerMap.get(infId);
          return inf ? {
            id: inf.id,
            name: inf.display_name,
            handle: inf.twitter_handle,
            tier: inf.tier,
            avatarUrl: inf.avatar_url,
            isCaptain: infId === entry.captain_id,
          } : null;
        }).filter(Boolean),
        rank: entry.rank,
        score: entry.score,
        scoreBreakdown: entry.score_breakdown,
        prizeAmount: parseFloat(entry[prizeColumn] || 0),
        claimed: entry.claimed,
        canClaim: entry[prizeColumn] > 0 && !entry.claimed && contest.status === 'finalized',
        createdAt: entry.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching my entry:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

/**
 * GET /api/v2/me/entries
 * Get all user's entries across all contests
 */
router.get('/me/entries', authenticate, async (req: Request, res: Response) => {
  try {
    const walletAddress = req.user!.walletAddress;

    if (!walletAddress) {
      return res.json({ entries: [] });
    }

    // Get paid entries
    const paidEntries = await db('prized_entries')
      .join('prized_contests', 'prized_entries.contest_id', 'prized_contests.id')
      .leftJoin('contest_types', 'prized_contests.contest_type_id', 'contest_types.id')
      .where('prized_entries.wallet_address', walletAddress.toLowerCase())
      .select(
        'prized_entries.*',
        'prized_contests.name as contest_name',
        'prized_contests.status as contest_status',
        'prized_contests.is_free',
        'prized_contests.entry_fee',
        'prized_contests.prize_pool',
        'prized_contests.player_count',
        'prized_contests.lock_time',
        'prized_contests.end_time',
        'contest_types.code as type_code',
        'contest_types.name as type_name'
      );

    // Get free entries
    const freeEntries = await db('free_league_entries')
      .join('prized_contests', 'free_league_entries.contest_id', 'prized_contests.id')
      .leftJoin('contest_types', 'prized_contests.contest_type_id', 'contest_types.id')
      .where('free_league_entries.wallet_address', walletAddress.toLowerCase())
      .select(
        'free_league_entries.*',
        'prized_contests.name as contest_name',
        'prized_contests.status as contest_status',
        'prized_contests.is_free',
        'prized_contests.entry_fee',
        'prized_contests.prize_pool',
        'prized_contests.player_count',
        'prized_contests.lock_time',
        'prized_contests.end_time',
        'contest_types.code as type_code',
        'contest_types.name as type_name'
      );

    const allEntries = [...paidEntries.map(e => ({ ...e, source: 'paid' })),
                        ...freeEntries.map(e => ({ ...e, source: 'free' }))]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      entries: allEntries.map(e => ({
        id: e.id,
        contestId: e.contest_id,
        contestName: e.contest_name,
        status: e.contest_status || 'open',
        isFree: e.is_free,
        typeCode: e.type_code || 'FREE_LEAGUE',
        typeName: e.type_name,
        entryFee: parseFloat(e.entry_fee || 0),
        prizePool: parseFloat(e.prize_pool || 0),
        playerCount: e.player_count,
        lockTime: e.lock_time,
        endTime: e.end_time,
        rank: e.rank,
        score: parseFloat(e.score) || 0,
        prizeAmount: parseFloat(e.prize_won || e.prize_amount || 0) || null,
        claimed: e.claimed,
        canClaim: (e.prize_won > 0 || e.prize_amount > 0) && !e.claimed && e.contest_status === 'finalized',
        createdAt: e.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching my entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

/**
 * GET /api/v2/me/free-entries-remaining
 * Check how many free league entries user has remaining this week
 */
router.get('/me/free-entries-remaining', authenticate, async (req: Request, res: Response) => {
  try {
    const walletAddress = req.user!.walletAddress;

    if (!walletAddress) {
      return res.json({ remaining: 1, max: 1 });
    }

    const weekStart = getWeekStart(new Date());
    const limit = await db('free_league_limits')
      .where('wallet_address', walletAddress.toLowerCase())
      .where('week_start', weekStart)
      .first();

    const used = limit?.entries_used || 0;
    const max = 1; // 1 free entry per week

    res.json({
      remaining: Math.max(0, max - used),
      max,
      used,
      weekStart,
      weekEnd: getWeekEnd(weekStart),
    });
  } catch (error: any) {
    console.error('Error checking free entries:', error);
    res.status(500).json({ error: 'Failed to check free entries' });
  }
});

// ============ PRIZE CLAIMING ============

/**
 * POST /api/v2/contests/:id/claim-prize
 * Transfer SOL prize from treasury to winner's wallet (devnet)
 */
router.post('/contests/:id/claim-prize', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const walletAddress = req.user!.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }

    // Load the contest
    const contest = await db('prized_contests').where('id', id).first();
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    if (contest.status !== 'finalized') {
      return res.status(400).json({ error: 'Contest has not been finalized yet' });
    }

    // Find the user's entry in the correct table
    const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';
    const prizeColumn = contest.is_free ? 'prize_won' : 'prize_amount';

    const entry = await db(entriesTable)
      .where('contest_id', id)
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (!entry) {
      return res.status(404).json({ error: 'No entry found for this contest' });
    }

    const prizeAmount = parseFloat(entry[prizeColumn] || 0);

    if (prizeAmount <= 0) {
      return res.status(400).json({ error: 'No prize to claim for this entry' });
    }

    if (entry.claimed) {
      return res.status(400).json({ error: 'Prize has already been claimed' });
    }

    // Mark as claimed optimistically (prevent double-claim race)
    const updated = await db(entriesTable)
      .where('id', entry.id)
      .where('claimed', false)
      .update({ claimed: true, updated_at: new Date() });

    if (!updated) {
      return res.status(400).json({ error: 'Prize has already been claimed' });
    }

    // Load treasury keypair from env
    const secretKeyBase64 = process.env.TREASURY_SECRET_KEY_BASE64;
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

    if (!secretKeyBase64) {
      // Rollback the claimed flag if transfer can't happen
      await db(entriesTable).where('id', entry.id).update({ claimed: false, updated_at: new Date() });
      return res.status(500).json({ error: 'Treasury not configured' });
    }

    let txSignature: string;
    let simulated = false;

    try {
      const secretKeyBytes = Buffer.from(secretKeyBase64, 'base64');
      const treasuryKeypair = Keypair.fromSecretKey(secretKeyBytes);

      const connection = new Connection(rpcUrl, 'confirmed');
      const recipientPubkey = new PublicKey(walletAddress);

      // Check treasury has enough funds before attempting transfer
      const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
      const lamports = Math.floor(prizeAmount * LAMPORTS_PER_SOL);

      if (treasuryBalance < lamports + 5000) {
        // Dev mode: simulate the transfer when treasury is unfunded (demo only)
        if (process.env.NODE_ENV !== 'production') {
          txSignature = `SIMULATED_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          simulated = true;
          logger.warn(`Treasury underfunded (${treasuryBalance} lamports). Simulating transfer for dev.`, {
            context: 'ClaimPrize',
          });
        } else {
          await db(entriesTable).where('id', entry.id).update({ claimed: false, updated_at: new Date() });
          return res.status(503).json({ error: 'Prize pool temporarily unavailable — please try again later' });
        }
      } else {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: treasuryKeypair.publicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );

        txSignature = await sendAndConfirmTransaction(connection, transaction, [treasuryKeypair], {
          commitment: 'confirmed',
        });
      }

      // Save tx signature to entry
      await db(entriesTable)
        .where('id', entry.id)
        .update({ claim_tx_hash: txSignature, updated_at: new Date() });

      logger.info(`Prize ${simulated ? 'simulated' : 'claimed'}: ${prizeAmount} SOL to ${walletAddress}, tx: ${txSignature}`, {
        context: 'ClaimPrize',
      });
    } catch (transferError: any) {
      // Rollback claimed flag so user can retry
      await db(entriesTable).where('id', entry.id).update({ claimed: false, updated_at: new Date() });
      logger.error('SOL transfer failed:', transferError, { context: 'ClaimPrize' });
      return res.status(500).json({
        error: 'Transfer failed — please try again',
        detail: process.env.NODE_ENV !== 'production' ? transferError.message : undefined,
      });
    }

    res.json({
      success: true,
      message: `${prizeAmount.toFixed(3)} SOL sent to your wallet`,
      txSignature,
      explorerUrl: simulated ? null : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      simulated,
    });
  } catch (error: any) {
    logger.error('Error claiming prize:', error, { context: 'ClaimPrize' });
    res.status(500).json({ error: 'Failed to claim prize' });
  }
});

// ============ ADMIN ENDPOINTS ============

/**
 * POST /api/v2/admin/contests
 * Create a new contest
 */
router.post('/admin/contests', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await db('users').where('id', userId).first();

    if (!user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      contestTypeCode,
      contractContestId,
      name,
      description,
      lockTime,
      endTime,
      createTxHash,
      customEntryFee,
      customMinPlayers,
      customMaxPlayers,
    } = req.body;

    // Get contest type config
    const contestType = await db('contest_types')
      .where('code', contestTypeCode)
      .first();

    if (!contestType) {
      return res.status(400).json({ error: 'Invalid contest type' });
    }

    const [contest] = await db('prized_contests').insert({
      contest_type_id: contestType.id,
      contract_contest_id: contractContestId || null,
      contract_address: contestType.is_free ? null : process.env.PRIZED_V2_CONTRACT_ADDRESS,
      name: name || contestType.name,
      description: description || contestType.description,
      entry_fee: customEntryFee || contestType.entry_fee,
      team_size: contestType.team_size,
      has_captain: contestType.has_captain,
      is_free: contestType.is_free,
      rake_percent: contestType.rake_percent,
      min_players: customMinPlayers || contestType.min_players,
      max_players: customMaxPlayers || contestType.max_players,
      lock_time: new Date(lockTime),
      end_time: new Date(endTime),
      create_tx_hash: createTxHash || null,
      status: 'open',
      prize_pool: contestType.is_free ? '0.05' : '0', // Platform funded for free leagues
      distributable_pool: contestType.is_free ? '0.05' : '0',
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('*');

    res.json({ success: true, contest });
  } catch (error: any) {
    console.error('Error creating contest:', error);
    res.status(500).json({ error: 'Failed to create contest' });
  }
});

// ============ HELPER FUNCTIONS ============

async function getPrizeDistributionRules(playerCount: number) {
  const rules = await db('prize_distribution_rules')
    .where('min_players', '<=', playerCount || 10)
    .where(function() {
      this.where('max_players', '>=', playerCount || 10)
        .orWhere('max_players', 0);
    })
    .orderBy('rank', 'asc');

  return rules.map(r => ({
    rank: r.rank,
    percentage: parseFloat(r.percentage),
    label: r.label,
  }));
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function getNextWeekStart(currentWeekStart: Date): Date {
  const d = new Date(currentWeekStart);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/**
 * GET /api/v2/me/history
 * Career history: all past contest entries with hydrated picks + career stats
 */
router.get('/me/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const walletAddress = req.user!.walletAddress;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!walletAddress) {
      return res.json({ success: true, data: { history: [], careerStats: { totalContests: 0, wins: 0, topThree: 0, avgScore: 0, bestScore: 0, bestRank: null }, total: 0 } });
    }

    const wa = walletAddress.toLowerCase();

    // Fetch free entries with contest info
    const freeEntries = await db('free_league_entries as e')
      .join('prized_contests as c', 'e.contest_id', 'c.id')
      .where('e.wallet_address', wa)
      .select(
        'e.id', 'e.contest_id', 'e.score', 'e.rank', 'e.score_breakdown',
        'e.team_ids', 'e.captain_id', 'e.prize_won as prize_won', 'e.claimed', 'e.created_at',
        'c.name as contest_name', 'c.status as contest_status',
        'c.lock_time as lock_time', 'c.end_time', 'c.player_count', 'c.is_free', 'c.entry_fee'
      )
      .orderBy('e.created_at', 'desc');

    // Fetch paid entries with contest info
    const paidEntries = await db('prized_entries as e')
      .join('prized_contests as c', 'e.contest_id', 'c.id')
      .where('e.wallet_address', wa)
      .select(
        'e.id', 'e.contest_id', 'e.score', 'e.rank', 'e.score_breakdown',
        'e.team_ids', 'e.captain_id', 'e.prize_amount as prize_won', 'e.claimed', 'e.created_at',
        'c.name as contest_name', 'c.status as contest_status',
        'c.lock_time as lock_time', 'c.end_time', 'c.player_count', 'c.is_free', 'c.entry_fee'
      )
      .orderBy('e.created_at', 'desc');

    // Merge and sort
    const allEntries = [
      ...freeEntries.map(e => ({ ...e, contestType: 'free' })),
      ...paidEntries.map(e => ({ ...e, contestType: 'paid' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = allEntries.length;
    const pageEntries = allEntries.slice(offset, offset + limit);

    // Collect all influencer IDs needed
    const allInfluencerIds = new Set<number>();
    for (const entry of pageEntries) {
      if (Array.isArray(entry.team_ids)) {
        entry.team_ids.forEach((id: number) => allInfluencerIds.add(id));
      }
    }

    // Batch fetch influencers
    const influencerMap: Record<number, any> = {};
    if (allInfluencerIds.size > 0) {
      const influencers = await db('influencers')
        .whereIn('id', Array.from(allInfluencerIds))
        .select('id', 'display_name', 'twitter_handle', 'tier', 'avatar_url', 'price', 'total_points');
      for (const inf of influencers) {
        influencerMap[inf.id] = inf;
      }
    }

    // Check if user has tapestry_user_id for verification badge
    const userRow = await db('users').where('id', userId).select('tapestry_user_id').first();
    const tapestryVerified = !!userRow?.tapestry_user_id;

    // Build history response
    const history = pageEntries.map(entry => {
      const picks = Array.isArray(entry.team_ids)
        ? entry.team_ids
            .map((infId: number) => {
              const inf = influencerMap[infId];
              if (!inf) return null;
              const isCaptain = infId === entry.captain_id;
              const basePoints = parseInt(inf.total_points) || 0;
              return {
                id: inf.id,
                name: inf.display_name,
                handle: inf.twitter_handle,
                tier: inf.tier,
                avatarUrl: inf.avatar_url,
                price: parseFloat(inf.price) || 0,
                isCaptain,
                points: basePoints,
                effectivePoints: isCaptain ? Math.round(basePoints * 1.5) : basePoints,
              };
            })
            .filter(Boolean)
        : [];

      const breakdown = entry.score_breakdown || {};

      return {
        contestId: entry.contest_id,
        contestName: entry.contest_name,
        contestType: entry.contestType,
        startDate: entry.lock_time,
        endDate: entry.end_time,
        status: entry.contest_status,
        score: parseFloat(entry.score) || 0,
        rank: entry.rank,
        totalPlayers: entry.player_count,
        prizeWon: parseFloat(entry.prize_won) || 0,
        claimed: entry.claimed,
        scoreBreakdown: {
          activity: parseFloat(breakdown.activity) || 0,
          engagement: parseFloat(breakdown.engagement) || 0,
          growth: parseFloat(breakdown.growth) || 0,
          viral: parseFloat(breakdown.viral) || 0,
        },
        picks,
        tapestryVerified,
        onChainId: `foresight-team-${userId}-${entry.contest_id}`,
        enteredAt: entry.created_at,
      };
    });

    // Career stats across ALL entries (not just page)
    const scores = allEntries.map(e => parseFloat(e.score) || 0);
    const ranks = allEntries.map(e => e.rank).filter(r => r != null && r > 0);
    const wins = allEntries.filter(e => e.rank === 1).length;
    const topThree = allEntries.filter(e => e.rank && e.rank <= 3).length;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;

    res.json({
      success: true,
      data: {
        history,
        careerStats: {
          totalContests: total,
          wins,
          topThree,
          avgScore,
          bestScore,
          bestRank,
        },
        total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[History] Error fetching career history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch career history' });
  }
});

export default router;
