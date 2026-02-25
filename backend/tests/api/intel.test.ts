/**
 * Intel API Tests
 *
 * TDD: These tests define expected behavior.
 * They should FAIL initially, then pass after implementation.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server';

describe('Intel API', () => {
  describe('GET /api/intel/influencers/:id/weekly-history', () => {
    it('should return 4 weeks of performance data', async () => {
      const response = await request(app)
        .get('/api/intel/influencers/1/weekly-history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.weeks).toBeDefined();
      expect(Array.isArray(response.body.data.weeks)).toBe(true);
      expect(response.body.data.weeks.length).toBeLessThanOrEqual(4);
    });

    it('should return correct week structure', async () => {
      const response = await request(app)
        .get('/api/intel/influencers/1/weekly-history')
        .expect(200);

      if (response.body.data.weeks.length > 0) {
        const week = response.body.data.weeks[0];
        expect(week).toHaveProperty('weekLabel');
        expect(week).toHaveProperty('tweetCount');
        expect(week).toHaveProperty('totalLikes');
        expect(week).toHaveProperty('totalRetweets');
        expect(week).toHaveProperty('estimatedPts');
      }
    });

    it('should return consistency stats', async () => {
      const response = await request(app)
        .get('/api/intel/influencers/1/weekly-history')
        .expect(200);

      expect(response.body.data).toHaveProperty('consistency');
      expect(response.body.data).toHaveProperty('avgWeeklyPts');
      expect(response.body.data).toHaveProperty('trend');
    });

    it('should return 404 for invalid influencer', async () => {
      await request(app)
        .get('/api/intel/influencers/999999/weekly-history')
        .expect(404);
    });
  });

  describe('GET /api/intel/community-picks', () => {
    it('should return a ranked list of most drafted influencers', async () => {
      const response = await request(app)
        .get('/api/intel/community-picks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.picks).toBeDefined();
      expect(Array.isArray(response.body.data.picks)).toBe(true);
    });

    it('should return correct pick structure', async () => {
      const response = await request(app)
        .get('/api/intel/community-picks')
        .expect(200);

      if (response.body.data.picks.length > 0) {
        const pick = response.body.data.picks[0];
        expect(pick).toHaveProperty('influencerId');
        expect(pick).toHaveProperty('handle');
        expect(pick).toHaveProperty('draftCount');
        expect(pick).toHaveProperty('uniqueDrafters');
      }
    });

    it('should be sorted by draftCount descending', async () => {
      const response = await request(app)
        .get('/api/intel/community-picks')
        .expect(200);

      const picks = response.body.data.picks;
      for (let i = 1; i < picks.length; i++) {
        expect(picks[i].draftCount).toBeLessThanOrEqual(picks[i - 1].draftCount);
      }
    });
  });
});
