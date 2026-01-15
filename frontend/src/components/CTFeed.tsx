/**
 * CT Feed Component
 * Shows real tweets from CT influencers with highlights and rising stars
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import axios from 'axios';
import {
  Fire, Heart, Repeat, ChatCircle, Eye,
  TwitterLogo, CaretRight, TrendUp, Star,
  Sparkle, Pulse, Warning, ArrowClockwise,
} from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  handle: string;
  name: string;
  avatar: string;
  tier: string;
}

interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes?: number;
  views: number;
  bookmarks?: number;
  engagementScore: number;
  twitterUrl: string;
  influencer: Influencer;
}

interface RisingStar {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  followers: number;
  followerGrowth: number;
  avgLikes: number;
  viralTweets: number;
  discoveredAt: string;
  status: string;
}

interface Props {
  variant?: 'compact' | 'full';
  limit?: number;
  showHighlights?: boolean;
  showRisingStars?: boolean;
  trackBrowseTime?: boolean;
  tierFilter?: 'S' | 'A' | 'B' | 'C';
}

const TIER_COLORS = {
  S: 'text-gold-400 bg-gold-500/20',
  A: 'text-cyan-400 bg-cyan-500/20',
  B: 'text-emerald-400 bg-emerald-500/20',
  C: 'text-gray-400 bg-gray-500/20',
} as const;

export default function CTFeed({
  variant = 'compact',
  limit = 20,
  showHighlights = false,
  showRisingStars = false,
  trackBrowseTime = false,
  tierFilter,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [highlights, setHighlights] = useState<Tweet[]>([]);
  const [risingStars, setRisingStars] = useState<RisingStar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const browseRewardedRef = useRef<boolean>(false);

  // Use useLayoutEffect to ensure data fetch starts synchronously
  // Wrapped in setTimeout(0) to work properly with test fake timers
  useLayoutEffect(() => {
    // Schedule the fetch for the next macrotask
    // This allows vi.runAllTimersAsync() to trigger the fetch in tests
    const timeoutId = setTimeout(() => {
      fetchFeed();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [limit]);

  // Browse time tracking for FS rewards
  // Uses a single 30-second timeout for efficiency
  useEffect(() => {
    if (!trackBrowseTime || loading || browseRewardedRef.current) return;

    const timeoutId = setTimeout(async () => {
      if (browseRewardedRef.current) return;
      browseRewardedRef.current = true;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          await axios.post(
            `${API_URL}/api/ct-feed/interaction`,
            {
              type: 'browse_time',
              timeSpentSeconds: Math.floor(elapsed),
              tweetsViewed: tweets.length,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.warn('Could not record browse time:', err);
      }
    }, 30000); // Fire exactly at 30 seconds

    return () => clearTimeout(timeoutId);
  }, [trackBrowseTime, loading, tweets.length]);

  const fetchFeed = () => {
    setLoading(true);
    setError(null);

    const requests: Promise<{ data: { success: boolean; data: Record<string, unknown> } }>[] = [
      axios.get(`${API_URL}/api/ct-feed?limit=${limit}&offset=${offset}`),
    ];

    if (showHighlights) {
      requests.push(axios.get(`${API_URL}/api/ct-feed/highlights?limit=5`));
    }

    if (showRisingStars) {
      requests.push(axios.get(`${API_URL}/api/ct-feed/rising-stars?limit=5`));
    }

    Promise.all(requests)
      .then((results) => {
        const feedRes = results[0];
        if (feedRes.data.success) {
          setTweets((feedRes.data.data.tweets as Tweet[]) || []);
          setHasMore((feedRes.data.data.pagination as { hasMore?: boolean })?.hasMore || false);
        }

        if (showHighlights && results[1]?.data.success) {
          setHighlights((results[1].data.data.tweets as Tweet[]) || []);
        }

        if (showRisingStars) {
          const rsRes = results[showHighlights ? 2 : 1];
          if (rsRes?.data.success) {
            setRisingStars((rsRes.data.data.risingstars as RisingStar[]) || []);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching CT feed:', err);
        setError('Failed to load feed. Please try again.');
        setLoading(false);
      });
  };

  const loadMore = async () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    try {
      const res = await axios.get(`${API_URL}/api/ct-feed?limit=${limit}&offset=${newOffset}`);
      if (res.data.success) {
        setTweets((prev) => [...prev, ...(res.data.data.tweets || [])]);
        setHasMore(res.data.data.pagination?.hasMore || false);
      }
    } catch (err) {
      console.error('Error loading more:', err);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  };

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.C;
  };

  // Loading state
  if (loading) {
    return (
      <div
        data-testid="ct-feed-loading"
        className="bg-gray-900/50 rounded-xl border border-gray-800 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-800 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-1/4"></div>
                <div className="h-3 bg-gray-800 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        data-testid="ct-feed-container"
        role="region"
        className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 text-center"
      >
        <Warning size={40} className="mx-auto mb-3 text-red-400" />
        <p className="text-gray-400">{error}</p>
        <button
          onClick={fetchFeed}
          role="button"
          aria-label="Retry loading feed"
          className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <ArrowClockwise size={16} />
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (tweets.length === 0) {
    return (
      <div
        data-testid="ct-feed-container"
        role="region"
        className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 text-center"
      >
        <Pulse size={40} className="mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400">No tweets available</p>
        <p className="text-xs text-gray-600 mt-1">Check back soon!</p>
      </div>
    );
  }

  return (
    <div
      data-testid="ct-feed-container"
      role="region"
      className={`bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden ${
        variant === 'compact' ? 'max-h-[500px]' : ''
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-[#1DA1F2]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TwitterLogo size={20} weight="fill" className="text-[#1DA1F2]" />
            <span className="font-bold text-white">CT Feed</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Pulse size={12} className="text-green-400" />
            Live
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      {showHighlights && highlights.length > 0 && (
        <div
          data-testid="highlights-section"
          className="p-3 border-b border-gray-800/50 bg-gradient-to-r from-orange-500/5 to-transparent"
        >
          <div className="flex items-center gap-2 mb-2">
            <Fire size={14} weight="fill" className="text-orange-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Highlights</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {highlights.map((tweet) => (
              <a
                key={tweet.id}
                href={tweet.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="link"
                aria-label="Open on Twitter"
                className="flex-shrink-0 w-56 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {tweet.influencer.avatar ? (
                    <img
                      src={tweet.influencer.avatar}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                      <TwitterLogo size={10} className="text-gray-500" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-white truncate">
                    @{tweet.influencer.handle}
                  </span>
                  <span
                    data-testid={`tier-badge-${tweet.influencer.tier}`}
                    className={`text-[10px] px-1 py-0.5 rounded ${getTierColor(tweet.influencer.tier)}`}
                  >
                    {tweet.influencer.tier}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{tweet.text}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Heart size={10} /> {formatNumber(tweet.likes)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Repeat size={10} /> {formatNumber(tweet.retweets)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Rising Stars Section */}
      {showRisingStars && risingStars.length > 0 && (
        <div
          data-testid="rising-stars-section"
          className="p-3 border-b border-gray-800/50 bg-gradient-to-r from-green-500/5 to-transparent"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendUp size={14} weight="fill" className="text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Rising Stars</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {risingStars.map((star) => (
              <a
                key={star.id}
                href={`https://twitter.com/${star.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {star.avatar ? (
                    <img src={star.avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Star size={14} className="text-white" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">@{star.handle}</div>
                    <div className="text-xs text-green-400">+{star.followerGrowth}% growth</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Feed list */}
      <div className={`divide-y divide-gray-800/50 ${variant === 'compact' ? 'max-h-[300px]' : ''} overflow-y-auto`}>
        {tweets
          .filter((tweet) => !tierFilter || tweet.influencer.tier === tierFilter)
          .map((tweet) => (
          <div
            key={tweet.id}
            className="p-3 hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {tweet.influencer.avatar ? (
                  <img
                    src={tweet.influencer.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center">
                    <TwitterLogo size={16} weight="fill" className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">
                    {tweet.influencer.name}
                  </span>
                  <span className="text-xs text-gray-500">@{tweet.influencer.handle}</span>
                  <span
                    data-testid={`tier-badge-${tweet.influencer.tier}`}
                    className={`text-[10px] px-1 py-0.5 rounded ${getTierColor(tweet.influencer.tier)}`}
                  >
                    {tweet.influencer.tier}
                  </span>
                  <span className="text-xs text-gray-600 ml-auto">
                    {getTimeAgo(tweet.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{tweet.text}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart size={12} className="text-pink-500/70" />
                    {formatNumber(tweet.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat size={12} className="text-green-500/70" />
                    {formatNumber(tweet.retweets)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatCircle size={12} className="text-blue-500/70" />
                    {formatNumber(tweet.replies)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} className="text-gray-400" />
                    {formatNumber(tweet.views)}
                  </span>
                  <a
                    href={tweet.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="link"
                    aria-label="View on Twitter"
                    className="ml-auto flex items-center gap-1 text-[#1DA1F2] hover:underline"
                  >
                    <TwitterLogo size={12} weight="fill" />
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full p-3 bg-gray-800/30 hover:bg-gray-800/50 text-gray-400 text-sm transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  );
}
