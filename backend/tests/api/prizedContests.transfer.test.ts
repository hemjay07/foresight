/**
 * Transfer Limit Enforcement Tests — Prized Contests
 *
 * TDD: These tests define expected behavior.
 * They FAIL until update-free-team enforces XP-based transfer limits.
 *
 * Business Rules:
 * - NOVICE (0-99 XP): 1 free update per contest window
 * - APPRENTICE (100-249 XP): 2 free updates
 * - SKILLED (250-499 XP): 3 free updates
 * - EXPERT (500-999 XP): 4 free updates
 * - MASTER (1000-2499 XP): 5 free updates
 * - LEGENDARY (2500+ XP): unlimited
 *
 * "Update" = full team replacement via PUT /api/v2/contests/:id/update-free-team
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import db from '../../src/utils/db';

// Shared test state
let noviceToken: string;
let apprenticeToken: string;
let contestId: number;
let noviceWallet: string;
let apprenticeWallet: string;

const VALID_TEAM = ['influencer_1', 'influencer_2', 'influencer_3', 'influencer_4', 'influencer_5'];
const ALT_TEAM   = ['influencer_1', 'influencer_2', 'influencer_3', 'influencer_4', 'influencer_6'];

beforeAll(async () => {
  // Fetch auth tokens for test users
  // (relies on seeded test users in test DB)
  const noviceRes = await request(app)
    .post('/api/auth/login')
    .send({ walletAddress: process.env.TEST_NOVICE_WALLET || 'test-novice-wallet' });
  noviceToken = noviceRes.body?.token;
  noviceWallet = process.env.TEST_NOVICE_WALLET || 'test-novice-wallet';

  const apprenticeRes = await request(app)
    .post('/api/auth/login')
    .send({ walletAddress: process.env.TEST_APPRENTICE_WALLET || 'test-apprentice-wallet' });
  apprenticeToken = apprenticeRes.body?.token;

  // Get an open free contest for testing
  const contestsRes = await request(app).get('/api/v2/contests?status=open&type=FREE_LEAGUE&limit=1');
  contestId = contestsRes.body?.contests?.[0]?.id || contestsRes.body?.data?.[0]?.id;
});

// ─── Transfer Status Endpoint ─────────────────────────────────────────────

describe('GET /api/v2/contests/:id/transfer-status', () => {
  it('returns transfer info for authenticated user', async () => {
    if (!noviceToken || !contestId) return; // skip if no test setup

    const res = await request(app)
      .get(`/api/v2/contests/${contestId}/transfer-status`)
      .set('Authorization', `Bearer ${noviceToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      transfersAllowed: expect.any(Number),
      transfersUsed: expect.any(Number),
      transfersRemaining: expect.any(Number),
      level: expect.any(String),
    });
    expect(res.body.data.transfersRemaining).toBeGreaterThanOrEqual(0);
  });

  it('returns 401 without auth token', async () => {
    if (!contestId) return;
    await request(app)
      .get(`/api/v2/contests/${contestId}/transfer-status`)
      .expect(401);
  });
});

// ─── Transfer Limit Enforcement ───────────────────────────────────────────

describe('PUT /api/v2/contests/:id/update-free-team — transfer limits', () => {
  it('NOVICE: allows first team update', async () => {
    if (!noviceToken || !contestId) return;

    const res = await request(app)
      .put(`/api/v2/contests/${contestId}/update-free-team`)
      .set('Authorization', `Bearer ${noviceToken}`)
      .send({ teamIds: VALID_TEAM, captainId: VALID_TEAM[0] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.transfersRemaining).toBeDefined();
    expect(res.body.transfersRemaining).toBe(0); // NOVICE: 1 allowed, 1 used
  });

  it('NOVICE: blocks second team update (limit = 1)', async () => {
    if (!noviceToken || !contestId) return;

    // Second update should be blocked
    const res = await request(app)
      .put(`/api/v2/contests/${contestId}/update-free-team`)
      .set('Authorization', `Bearer ${noviceToken}`)
      .send({ teamIds: ALT_TEAM, captainId: ALT_TEAM[0] })
      .expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/transfer limit/i);
    expect(res.body.transfersRemaining).toBe(0);
  });

  it('response includes transfersRemaining count on success', async () => {
    if (!apprenticeToken || !contestId) return;

    const res = await request(app)
      .put(`/api/v2/contests/${contestId}/update-free-team`)
      .set('Authorization', `Bearer ${apprenticeToken}`)
      .send({ teamIds: VALID_TEAM, captainId: VALID_TEAM[0] })
      .expect(200);

    expect(res.body.transfersRemaining).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.transfersRemaining).toBe('number');
  });

  it('LEGENDARY: allows unlimited updates', async () => {
    // LEGENDARY users (2500+ XP) should never be blocked
    // This is a unit-level test of the logic, not a full integration test
    const { getXPLevel } = await import('../../src/utils/xp');
    const legendary = getXPLevel(3000);
    expect(legendary.levelInfo.maxTransfers).toBe(999);
  });
});

// ─── update_count column exists ────────────────────────────────────────────

describe('free_league_entries schema', () => {
  it('has update_count column', async () => {
    // This verifies the migration has been applied
    const hasColumn = await db.schema.hasColumn('free_league_entries', 'update_count');
    expect(hasColumn).toBe(true);
  });
});
