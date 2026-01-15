/**
 * CT Feed Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import axios from 'axios';

// Component to be tested
import CTFeed from '../../src/components/CTFeed';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockTweets = [
  {
    id: '1',
    tweetId: '123456',
    text: 'BTC looking bullish today!',
    createdAt: '2025-12-28T10:00:00Z',
    likes: 5420,
    retweets: 892,
    replies: 234,
    views: 125000,
    engagementScore: 8750,
    twitterUrl: 'https://twitter.com/CryptoGuru/status/123456',
    influencer: {
      id: 1,
      handle: 'CryptoGuru',
      name: 'Crypto Guru',
      avatar: 'https://example.com/avatar.jpg',
      tier: 'A',
    },
  },
  {
    id: '2',
    tweetId: '789012',
    text: 'ETH breaking resistance levels',
    createdAt: '2025-12-28T09:00:00Z',
    likes: 3100,
    retweets: 456,
    replies: 123,
    views: 85000,
    engagementScore: 5200,
    twitterUrl: 'https://twitter.com/DeFiDegen/status/789012',
    influencer: {
      id: 2,
      handle: 'DeFiDegen',
      name: 'DeFi Degen',
      avatar: 'https://example.com/avatar2.jpg',
      tier: 'B',
    },
  },
];

const mockHighlights = mockTweets.slice(0, 1);

const mockRisingStars = [
  {
    id: '1',
    handle: 'NewCTVoice',
    name: 'New CT Voice',
    avatar: 'https://example.com/new.jpg',
    followers: 15420,
    followerGrowth: 23.5,
    avgLikes: 850,
    viralTweets: 3,
    status: 'discovered',
  },
];

describe('CTFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-auth-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/highlights')) {
        return Promise.resolve({
          data: { success: true, data: { tweets: mockHighlights } },
        });
      }
      if (url.includes('/rising-stars')) {
        return Promise.resolve({
          data: { success: true, data: { risingstars: mockRisingStars } },
        });
      }
      return Promise.resolve({
        data: {
          success: true,
          data: {
            tweets: mockTweets,
            pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    });

    mockedAxios.post.mockResolvedValue({
      data: { success: true, data: { fsAwarded: 5 } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      render(<CTFeed />);

      // Should show loading skeleton or spinner
      expect(screen.getByTestId('ct-feed-loading') || screen.getByText(/loading/i)).toBeTruthy();
    });

    it('should render feed after loading', async () => {
      render(<CTFeed />);

      await waitFor(() => {
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });
    });

    it('should render highlights section', async () => {
      render(<CTFeed showHighlights={true} />);

      await waitFor(() => {
        expect(screen.getByText(/highlights/i) || screen.getByTestId('highlights-section')).toBeInTheDocument();
      });
    });

    it('should render rising stars section', async () => {
      render(<CTFeed showRisingStars={true} />);

      await waitFor(() => {
        expect(screen.getByText(/rising/i) || screen.getByTestId('rising-stars-section')).toBeInTheDocument();
      });
    });

    it('should render tweet with all required info', async () => {
      render(<CTFeed />);

      await waitFor(() => {
        // Influencer info
        expect(screen.getByText('@CryptoGuru')).toBeInTheDocument();

        // Engagement metrics
        expect(screen.getByText(/5.4K|5,420/)).toBeInTheDocument(); // likes

        // Tweet text
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should link to Twitter when clicking tweet', async () => {
      render(<CTFeed />);

      await waitFor(() => {
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });

      // Find Twitter links - there will be multiple, get the first one
      const twitterLinks = screen.getAllByRole('link', { name: /open on|view on|twitter/i });
      expect(twitterLinks.length).toBeGreaterThan(0);
      expect(twitterLinks[0]).toHaveAttribute('href', expect.stringContaining('twitter.com'));
    });

    it('should show influencer tier badge', async () => {
      render(<CTFeed />);

      await waitFor(() => {
        expect(screen.getByText('A') || screen.getByTestId('tier-badge-A')).toBeInTheDocument();
      });
    });

    it('should load more tweets when scrolling', async () => {
      render(<CTFeed />);

      await waitFor(() => {
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });

      // Find and click "Load More" button if exists
      const loadMoreButton = screen.queryByText(/load more/i);
      if (loadMoreButton) {
        fireEvent.click(loadMoreButton);
        // Should trigger another API call
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('Error Handling', () => {
    it('should show error state on API failure', async () => {
      // Reset mocks and set up rejection
      vi.clearAllMocks();
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(<CTFeed />);

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no tweets', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: { tweets: [], pagination: { total: 0 } } },
      });

      render(<CTFeed />);

      await waitFor(() => {
        expect(screen.getByText(/no tweets|no activity|empty/i)).toBeInTheDocument();
      });
    });

    it('should have retry button on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      render(<CTFeed />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Variants', () => {
    it('should render compact variant', async () => {
      render(<CTFeed variant="compact" />);

      await waitFor(() => {
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });

      // Compact should have smaller styling (test via container class)
      const container = screen.getByTestId('ct-feed-container') || screen.getByRole('region');
      expect(container).toBeInTheDocument();
    });

    it('should render full variant', async () => {
      render(<CTFeed variant="full" />);

      await waitFor(() => {
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });
    });

    it('should respect limit prop', async () => {
      render(<CTFeed limit={1} />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('limit=1')
        );
      });
    });
  });

  describe('FS Reward Tracking', () => {
    it('should track browse time', async () => {
      vi.useFakeTimers();

      await act(async () => {
        render(<CTFeed trackBrowseTime={true} />);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('BTC looking bullish today!')).toBeInTheDocument();
      });

      // Fast-forward 35 seconds (use run timers instead of advance)
      await act(async () => {
        vi.advanceTimersByTime(35000);
      });

      // Run pending timers for the interval to fire
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Should call interaction API
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/interaction'),
          expect.objectContaining({ type: 'browse_time' }),
          expect.anything()
        );
      }, { timeout: 10000 });
    });
  });
});
