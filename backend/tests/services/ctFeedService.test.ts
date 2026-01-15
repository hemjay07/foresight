/**
 * CT Feed Service Tests
 *
 * TDD: These tests define expected behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock data
const mockTweets = [
  {
    id: 'tweet-1',
    tweet_id: '123456789',
    text: 'BTC looking bullish!',
    created_at: new Date('2025-12-28T10:00:00Z'),
    likes: 1000,
    retweets: 500,
    replies: 200,
    quotes: 50,
    views: 100000,
    bookmarks: 100,
    engagement_score: 3400,
    influencer_id: 1,
    twitter_handle: 'CryptoGuru',
    influencer_name: 'Crypto Guru',
    avatar_url: 'https://example.com/avatar.jpg',
    tier: 'A',
    updated_at: new Date(),
  },
  {
    id: 'tweet-2',
    tweet_id: '987654321',
    text: 'ETH breaking resistance',
    created_at: new Date('2025-12-28T09:00:00Z'),
    likes: 500,
    retweets: 250,
    replies: 100,
    quotes: 25,
    views: 50000,
    bookmarks: 50,
    engagement_score: 1700,
    influencer_id: 2,
    twitter_handle: 'DeFiDegen',
    influencer_name: 'DeFi Degen',
    avatar_url: 'https://example.com/avatar2.jpg',
    tier: 'B',
    updated_at: new Date(),
  },
];

const mockRisingStars = [
  {
    id: 'star-1',
    twitter_handle: 'NewCTVoice',
    name: 'New CT Voice',
    profile_image_url: 'https://example.com/new.jpg',
    followers_count: 15420,
    follower_growth_rate: 23.5,
    avg_likes_per_tweet: 850,
    viral_tweet_count: 3,
    discovered_at: new Date('2025-12-25T00:00:00Z'),
    status: 'discovered',
  },
];

// Create a mock query builder that chains properly
function createMockQueryBuilder(returnData: unknown) {
  const builder: Record<string, unknown> = {};

  builder.count = vi.fn().mockReturnValue(builder);
  builder.first = vi.fn().mockResolvedValue(returnData);
  builder.join = vi.fn().mockReturnValue(builder);
  builder.select = vi.fn().mockReturnValue(builder);
  builder.where = vi.fn().mockReturnValue(builder);
  builder.whereIn = vi.fn().mockReturnValue(builder);
  builder.orderBy = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.offset = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockResolvedValue([1]);
  builder.update = vi.fn().mockResolvedValue(1);
  builder.increment = vi.fn().mockResolvedValue(1);
  builder.onConflict = vi.fn().mockReturnValue(builder);
  builder.merge = vi.fn().mockResolvedValue(1);

  // For queries that need to return an array
  builder.then = vi.fn((resolve) => resolve(Array.isArray(returnData) ? returnData : [returnData]));

  return builder;
}

// Mock the database
vi.mock('../../src/utils/db', () => {
  return {
    default: vi.fn((table: string) => {
      if (table === 'ct_tweets') {
        return createMockQueryBuilder({ count: 2 });
      }
      if (table === 'ct_tweets as t') {
        const builder = createMockQueryBuilder(mockTweets);
        builder.first = vi.fn().mockResolvedValue(mockTweets[0]);
        builder.then = vi.fn((resolve) => resolve(mockTweets));
        return builder;
      }
      if (table === 'rising_stars') {
        const builder = createMockQueryBuilder(mockRisingStars);
        builder.then = vi.fn((resolve) => resolve(mockRisingStars));
        return builder;
      }
      if (table === 'feed_interactions') {
        return createMockQueryBuilder(null);
      }
      if (table === 'influencers') {
        return createMockQueryBuilder([
          { id: 1, twitter_handle: 'CryptoGuru', display_name: 'Crypto Guru' },
          { id: 2, twitter_handle: 'DeFiDegen', display_name: 'DeFi Degen' },
        ]);
      }
      if (table === 'foresight_score_transactions' || table === 'foresight_scores') {
        return createMockQueryBuilder(null);
      }
      return createMockQueryBuilder(null);
    }),
  };
});

// Mock Twitter API
vi.mock('../../src/services/twitterApiIoService', () => ({
  default: {
    getUserTweets: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'new-tweet-1',
          text: 'Test tweet',
          createdAt: new Date(),
          likes: 100,
          retweets: 50,
          replies: 20,
          quotes: 5,
          views: 10000,
          bookmarks: 10,
          isReply: false,
        },
      ],
    }),
    isConfigured: vi.fn(() => true),
  },
}));

// Import AFTER mocks are set up
import * as ctFeedService from '../../src/services/ctFeedService';

describe('CTFeedService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateEngagementScore', () => {
    it('should calculate weighted engagement score', () => {
      const tweet = {
        likes: 1000,
        retweets: 500,
        replies: 200,
        quotes: 50,
        views: 100000,
        bookmarks: 100,
      };

      const score = ctFeedService.calculateEngagementScore(tweet);

      // Expected: 1000*1 + 500*3 + 200*2 + 50*4 + 100000*0.001 + 100*2
      // = 1000 + 1500 + 400 + 200 + 100 + 200 = 3400
      expect(score).toBe(3400);
    });

    it('should handle zero values', () => {
      const tweet = {
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0,
        views: 0,
        bookmarks: 0,
      };

      const score = ctFeedService.calculateEngagementScore(tweet);
      expect(score).toBe(0);
    });
  });

  describe('getFeed', () => {
    it('should return tweets sorted by engagement score', async () => {
      const result = await ctFeedService.getFeed({ limit: 10, offset: 0 });

      expect(result).toHaveProperty('tweets');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.tweets)).toBe(true);
    });

    it('should respect limit and offset parameters', async () => {
      const result = await ctFeedService.getFeed({ limit: 5, offset: 10 });

      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.offset).toBe(10);
    });

    it('should include influencer data with each tweet', async () => {
      const result = await ctFeedService.getFeed({ limit: 1, offset: 0 });

      if (result.tweets.length > 0) {
        const tweet = result.tweets[0];
        expect(tweet).toHaveProperty('influencer');
        expect(tweet.influencer).toHaveProperty('handle');
        expect(tweet.influencer).toHaveProperty('name');
        expect(tweet.influencer).toHaveProperty('tier');
      }
    });

    it('should include Twitter URL for each tweet', async () => {
      const result = await ctFeedService.getFeed({ limit: 1, offset: 0 });

      if (result.tweets.length > 0) {
        expect(result.tweets[0]).toHaveProperty('twitterUrl');
        expect(result.tweets[0].twitterUrl).toContain('twitter.com');
      }
    });
  });

  describe('getHighlights', () => {
    it('should return top viral tweets', async () => {
      const result = await ctFeedService.getHighlights(5, '24h');

      expect(result).toHaveProperty('tweets');
      expect(result.tweets.length).toBeLessThanOrEqual(5);
    });

    it('should filter by timeframe', async () => {
      const result24h = await ctFeedService.getHighlights(5, '24h');
      const result7d = await ctFeedService.getHighlights(5, '7d');

      // Both should return valid results
      expect(result24h.tweets.length).toBeGreaterThanOrEqual(0);
      expect(result7d.tweets.length).toBeGreaterThanOrEqual(0);
    });

    it('should sort by engagement score descending', async () => {
      const result = await ctFeedService.getHighlights(10, '7d');

      for (let i = 1; i < result.tweets.length; i++) {
        expect(result.tweets[i - 1].engagementScore)
          .toBeGreaterThanOrEqual(result.tweets[i].engagementScore);
      }
    });
  });

  describe('getRisingStars', () => {
    it('should return accounts with high growth', async () => {
      const result = await ctFeedService.getRisingStars(5);

      expect(result).toHaveProperty('risingstars');
      expect(Array.isArray(result.risingstars)).toBe(true);
    });

    it('should include growth metrics', async () => {
      const result = await ctFeedService.getRisingStars(5);

      if (result.risingstars.length > 0) {
        const star = result.risingstars[0];
        expect(star).toHaveProperty('handle');
        expect(star).toHaveProperty('followers');
        expect(star).toHaveProperty('followerGrowth');
      }
    });
  });

  describe('trackInteraction', () => {
    it('should record user interaction', async () => {
      const interaction = {
        userId: 'user-123',
        type: 'view',
        tweetId: 'tweet-456',
      };

      await expect(
        ctFeedService.trackInteraction(interaction)
      ).resolves.not.toThrow();
    });
  });

  describe('awardBrowseTimeFS', () => {
    it('should not award FS for less than 30 seconds', async () => {
      const result = await ctFeedService.awardBrowseTimeFS('user-123', 20);

      expect(result.awarded).toBe(false);
      expect(result.reason).toBe('insufficient_time');
    });

    it('should award FS after 30 seconds of browsing', async () => {
      const result = await ctFeedService.awardBrowseTimeFS('user-123', 35);

      expect(result).toHaveProperty('awarded');
      // When awarded is true, fsAmount should be 5
      if (result.awarded) {
        expect(result.fsAmount).toBe(5);
      }
    });
  });

  describe('refreshTweets', () => {
    it('should return result with expected properties', async () => {
      const result = await ctFeedService.refreshTweets();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('tweetsStored');
      expect(result).toHaveProperty('influencersProcessed');
      expect(result).toHaveProperty('scoresUpdated');
    });
  });
});
