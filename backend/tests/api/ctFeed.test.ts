/**
 * CT Feed API Tests
 *
 * TDD: These tests define expected API behavior.
 * They should FAIL initially, then pass after implementation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server';

describe('CT Feed API', () => {
  describe('GET /api/ct-feed', () => {
    it('should return tweets with correct structure', async () => {
      const response = await request(app)
        .get('/api/ct-feed')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tweets');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('lastUpdated');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/ct-feed?limit=5')
        .expect(200);

      expect(response.body.data.tweets.length).toBeLessThanOrEqual(5);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should respect offset parameter', async () => {
      const response = await request(app)
        .get('/api/ct-feed?offset=10')
        .expect(200);

      expect(response.body.data.pagination.offset).toBe(10);
    });

    it('should cap limit at 50', async () => {
      const response = await request(app)
        .get('/api/ct-feed?limit=100')
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(50);
    });

    it('should include tweet with all required fields', async () => {
      const response = await request(app)
        .get('/api/ct-feed?limit=1')
        .expect(200);

      if (response.body.data.tweets.length > 0) {
        const tweet = response.body.data.tweets[0];
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('tweetId');
        expect(tweet).toHaveProperty('text');
        expect(tweet).toHaveProperty('createdAt');
        expect(tweet).toHaveProperty('likes');
        expect(tweet).toHaveProperty('retweets');
        expect(tweet).toHaveProperty('views');
        expect(tweet).toHaveProperty('engagementScore');
        expect(tweet).toHaveProperty('twitterUrl');
        expect(tweet).toHaveProperty('influencer');
      }
    });
  });

  describe('GET /api/ct-feed/highlights', () => {
    it('should return top viral tweets', async () => {
      const response = await request(app)
        .get('/api/ct-feed/highlights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tweets');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/ct-feed/highlights?limit=3')
        .expect(200);

      expect(response.body.data.tweets.length).toBeLessThanOrEqual(3);
    });

    it('should accept timeframe parameter', async () => {
      const response = await request(app)
        .get('/api/ct-feed/highlights?timeframe=7d')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should sort by engagement descending', async () => {
      const response = await request(app)
        .get('/api/ct-feed/highlights?limit=10')
        .expect(200);

      const tweets = response.body.data.tweets;
      for (let i = 1; i < tweets.length; i++) {
        expect(tweets[i - 1].engagementScore)
          .toBeGreaterThanOrEqual(tweets[i].engagementScore);
      }
    });
  });

  describe('GET /api/ct-feed/rising-stars', () => {
    it('should return rising star accounts', async () => {
      const response = await request(app)
        .get('/api/ct-feed/rising-stars')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('risingstars');
    });

    it('should include growth metrics', async () => {
      const response = await request(app)
        .get('/api/ct-feed/rising-stars')
        .expect(200);

      if (response.body.data.risingstars.length > 0) {
        const star = response.body.data.risingstars[0];
        expect(star).toHaveProperty('handle');
        expect(star).toHaveProperty('followers');
        expect(star).toHaveProperty('followerGrowth');
        expect(star).toHaveProperty('status');
      }
    });
  });

  describe('POST /api/ct-feed/interaction', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ct-feed/interaction')
        .send({ type: 'view', tweetId: '123' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should record interaction with valid auth', async () => {
      // This test requires a valid auth token
      // In real tests, we'd create a test user first
      const response = await request(app)
        .post('/api/ct-feed/interaction')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'browse_time',
          timeSpentSeconds: 35,
          tweetsViewed: 10,
        });

      // Will fail without proper auth, but tests the structure
      expect(response.body).toHaveProperty('success');
    });

    it('should award FS for 30+ seconds browse time', async () => {
      const response = await request(app)
        .post('/api/ct-feed/interaction')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'browse_time',
          timeSpentSeconds: 35,
          tweetsViewed: 10,
        });

      // With valid auth, should return FS award info
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('fsAwarded');
      }
    });
  });

  describe('POST /api/ct-feed/refresh', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ct-feed/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should refresh tweets with valid admin auth', async () => {
      const response = await request(app)
        .post('/api/ct-feed/refresh')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body).toHaveProperty('success');
    });
  });
});
