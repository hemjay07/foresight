/**
 * Intel Page - CT Research Command Center
 * Three-tab architecture: Feed / Profiles / Rising Stars
 * With comparison tool and browse time tracking for FS rewards
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Newspaper,
  Fire,
  TrendUp,
  Sparkle,
  Users,
  Clock,
  Trophy,
  Lightning,
  Eye,
  Heart,
  ChatCircle,
  Repeat,
  TwitterLogo,
  Warning,
  ArrowClockwise,
  Binoculars,
  Check,
  CheckCircle,
  Rocket,
  UsersFour,
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { useBrowseTimeTracker } from '../hooks/useBrowseTimeTracker';
import ProfilesTab from '../components/intel/ProfilesTab';
import RisingStarsTab from '../components/intel/RisingStarsTab';
import ComparisonTool from '../components/intel/ComparisonTool';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type MainTab = 'feed' | 'profiles' | 'rising';
type TierFilter = 'all' | 'team' | 'scouted' | 'S' | 'A' | 'B' | 'C';
type TimeFilter = '1h' | '24h' | '7d' | 'all';

interface Influencer {
  id: number;
  handle: string;
  name: string;
  avatar: string;
  tier: string;
  price: number;
  totalPoints: number;
}

interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  engagementScore: number;
  relativeScore?: number;
  twitterUrl: string;
  influencer: Influencer;
}

interface TeamPick {
  influencer_id: number;
  influencer_handle: string;
  influencer_name: string;
  tier: string;
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  S: { text: 'text-gold-400', bg: 'bg-gold-500/20', border: 'border-gold-500/40' },
  A: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' },
  B: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  C: { text: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40' },
};

// Reusable card for Viral / Emerging sections
interface HighlightCardProps {
  tweet: Tweet;
  onTeam: boolean;
  scouted: boolean;
  scouting: boolean;
  draftCount: number;
  onScout: () => void;
  engagementLabel: string;
  tierStyle: { text: string; bg: string; border: string };
  formatNumber: (n: number) => string;
  accent?: 'orange' | 'cyan';
}

function HighlightCard({
  tweet, onTeam, scouted, scouting, draftCount, onScout,
  engagementLabel, tierStyle, formatNumber, accent = 'orange',
}: HighlightCardProps) {
  const accentRing = onTeam
    ? 'bg-gold-500/5 border-gold-500/30'
    : accent === 'cyan'
    ? 'bg-cyan-500/5 border-cyan-500/20'
    : 'bg-gray-900/50 border-gray-800';

  return (
    <div className={`p-3 rounded-xl border transition-all ${accentRing}`}>
      <div className="flex items-center gap-2 mb-2">
        {tweet.influencer.avatar ? (
          <img src={tweet.influencer.avatar} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
            <TwitterLogo size={12} className="text-gray-500" />
          </div>
        )}
        <span className="text-xs font-medium text-white truncate flex-1">
          @{tweet.influencer.handle}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${tierStyle.bg} ${tierStyle.text}`}>
          {tweet.influencer.tier}
        </span>
        {draftCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium whitespace-nowrap">
            🏆 {draftCount}
          </span>
        )}
        {onTeam && <Trophy size={12} weight="fill" className="text-gold-400" />}
      </div>
      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{tweet.text}</p>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Heart size={10} /> {formatNumber(tweet.likes)}
          </span>
          <span className="flex items-center gap-0.5">
            <Repeat size={10} /> {formatNumber(tweet.retweets)}
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold font-mono">
          {engagementLabel} eng
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!onTeam && (
          <button
            onClick={onScout}
            disabled={scouting}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              scouted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400'
            }`}
          >
            {scouting ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : scouted ? (
              <><Check size={10} weight="bold" />Scouted</>
            ) : (
              <><Binoculars size={10} />Scout ${tweet.influencer.price}</>
            )}
          </button>
        )}
        <a
          href={tweet.twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-[10px] text-gray-400 transition-colors ${onTeam ? 'flex-1' : ''}`}
        >
          <TwitterLogo size={10} weight="fill" />
          Open
        </a>
      </div>
    </div>
  );
}

export default function Intel() {
  const { isConnected } = useAuth();
  const { showToast } = useToast();

  // Main tab state
  const [activeTab, setActiveTab] = useState<MainTab>('feed');

  // Feed-specific state
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track browse time for FS reward (quest awards +10 FS)
  const { secondsSpent, rewardEarned, fsAmount } = useBrowseTimeTracker({
    activityType: 'browse_ct_feed',
    enabled: isConnected,
  });
  const REQUIRED_SECONDS = 30;
  const FS_REWARD = 10; // Quest reward amount

  // Data
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [highlights, setHighlights] = useState<Tweet[]>([]);
  const [emerging, setEmerging] = useState<Tweet[]>([]);
  const [teamInfluencerIds, setTeamInfluencerIds] = useState<number[]>([]);
  const [hasTeam, setHasTeam] = useState(false);
  const [scoutedIds, setScoutedIds] = useState<number[]>([]);
  const [scoutingId, setScoutingId] = useState<number | null>(null);
  const [communityPicks, setCommunityPicks] = useState<Record<number, number>>({});

  // Comparison state
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch user's team and watchlist
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const [teamRes, watchlistRes] = await Promise.all([
          axios.get(`${API_URL}/api/league/team/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
          axios.get(`${API_URL}/api/watchlist/ids`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
        ]);

        if (teamRes?.data.team?.picks) {
          const ids = teamRes.data.team.picks.map((p: TeamPick) => p.influencer_id);
          setTeamInfluencerIds(ids);
          setHasTeam(true);
        }

        if (watchlistRes?.data.success) {
          setScoutedIds(watchlistRes.data.data.influencerIds || []);
        }
      } catch (err) {
        console.log('Error fetching user data');
      }
    };

    if (isConnected) {
      fetchUserData();
    }
  }, [isConnected]);

  // Scout/Unscout an influencer
  const toggleScout = async (influencerId: number, influencerName: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast('Please sign in to scout influencers', 'error');
      return;
    }

    setScoutingId(influencerId);
    const isScouted = scoutedIds.includes(influencerId);

    try {
      if (isScouted) {
        await axios.delete(`${API_URL}/api/watchlist/${influencerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setScoutedIds((prev) => prev.filter((id) => id !== influencerId));
        showToast(`Removed ${influencerName} from watchlist`, 'success');
      } else {
        await axios.post(
          `${API_URL}/api/watchlist/${influencerId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setScoutedIds((prev) => [...prev, influencerId]);
        showToast(`Scouted ${influencerName}! View in Profile → Watchlist`, 'success');

        // Secondary: Write to Tapestry (non-blocking)
        try {
          await axios.post(
            `${API_URL}/api/tapestry/content`,
            {
              title: `Scouted ${influencerName}`,
              body: `Watching @${influencerName} for potential future team picks`,
              contentType: 'scout',
              metadata: {
                influencerId,
                influencerName,
              },
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (tapestryErr) {
          console.log('[Intel] Tapestry scout write failed (non-blocking):', tapestryErr);
        }
      }
    } catch (err) {
      showToast('Failed to update watchlist', 'error');
    } finally {
      setScoutingId(null);
    }
  };

  // Fetch community picks
  useEffect(() => {
    const fetchCommunityPicks = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get(`${API_URL}/api/intel/community-picks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data.success && res.data.data) {
          const picksMap: Record<number, number> = {};
          res.data.data.picks?.forEach((pick: any) => {
            picksMap[pick.influencerId] = pick.draftCount;
          });
          setCommunityPicks(picksMap);
        }
      } catch (err) {
        console.log('[Intel] Error fetching community picks:', err);
      }
    };

    fetchCommunityPicks();
  }, []);

  // Fetch feed data
  useEffect(() => {
    if (activeTab === 'feed') {
      fetchFeed();
    }
  }, [timeFilter, activeTab]);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const feedTimeframe = timeFilter === '1h' ? '1h' : timeFilter === 'all' ? '30d' : timeFilter;
      const [feedRes, highlightsRes, emergingRes] = await Promise.all([
        axios.get(`${API_URL}/api/ct-feed?limit=50&timeframe=${feedTimeframe}`),
        axios.get(`${API_URL}/api/ct-feed/highlights?limit=6&timeframe=${feedTimeframe}`),
        // Emerging movers: 1h breakouts with relative virality (different from all-day highlights)
        feedTimeframe !== '1h'
          ? axios.get(`${API_URL}/api/ct-feed/highlights?limit=6&timeframe=1h`).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (feedRes.data.success) {
        setTweets(feedRes.data.data.tweets || []);
      }
      if (highlightsRes.data.success) {
        setHighlights(highlightsRes.data.data.tweets || []);
      }
      if (emergingRes?.data?.success) {
        // Filter out tweets already in highlights to avoid duplicates
        const highlightIds = new Set(highlightsRes.data.data.tweets?.map((t: Tweet) => t.id) || []);
        const emergingTweets = emergingRes.data.data.tweets?.filter((t: Tweet) => !highlightIds.has(t.id)) || [];
        setEmerging(emergingTweets);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  // Filter tweets based on tier
  const getFilteredTweets = () => {
    let filtered = tweets;

    if (tierFilter === 'team') {
      filtered = filtered.filter(t => teamInfluencerIds.includes(t.influencer.id));
    } else if (tierFilter === 'scouted') {
      filtered = filtered.filter(t => scoutedIds.includes(t.influencer.id));
    } else if (tierFilter !== 'all') {
      filtered = filtered.filter(t => t.influencer.tier === tierFilter);
    }

    return filtered;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTimeAgo = (dateString: string): string => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTierStyle = (tier: string) => TIER_COLORS[tier] || TIER_COLORS.C;

  const isOnTeam = (influencerId: number) => teamInfluencerIds.includes(influencerId);
  const isScouted = (influencerId: number) => scoutedIds.includes(influencerId);

  // Real engagement score from DB — formatted for display
  const engagementLabel = (tweet: Tweet): string => {
    const score = tweet.engagementScore;
    if (!score || score === 0) return '—';
    return formatNumber(score);
  };

  const filteredTweets = getFilteredTweets();

  const tierTabs: { id: TierFilter; label: string; icon?: React.ElementType; count?: number }[] = [
    { id: 'all', label: 'All' },
    ...(hasTeam ? [{ id: 'team' as TierFilter, label: 'My Team', icon: Trophy, count: teamInfluencerIds.length }] : []),
    ...(scoutedIds.length > 0 ? [{ id: 'scouted' as TierFilter, label: 'Scouted', icon: Binoculars, count: scoutedIds.length }] : []),
    { id: 'S', label: 'S-Tier' },
    { id: 'A', label: 'A-Tier' },
    { id: 'B', label: 'B-Tier' },
    { id: 'C', label: 'C-Tier' },
  ];

  const timeTabs: { id: TimeFilter; label: string }[] = [
    { id: '1h', label: '1h' },
    { id: '24h', label: '24h' },
    { id: '7d', label: '7d' },
    { id: 'all', label: 'All' },
  ];

  const mainTabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'feed', label: 'Feed', icon: Newspaper },
    { id: 'profiles', label: 'Profiles', icon: UsersFour },
    { id: 'rising', label: 'Rising Stars', icon: Rocket },
  ];

  // Handle compare from ProfilesTab
  const handleCompare = (ids: number[]) => {
    setCompareIds(ids);
    setShowComparison(true);
  };

  const handleRemoveFromCompare = (id: number) => {
    const newIds = compareIds.filter(cId => cId !== id);
    if (newIds.length < 2) {
      setShowComparison(false);
      setCompareIds([]);
    } else {
      setCompareIds(newIds);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Newspaper size={28} weight="fill" className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CT Intelligence</h1>
                <p className="text-sm text-gray-400">
                  Research command center for Crypto Twitter
                </p>
              </div>
            </div>
            {/* FS Reward Badge */}
            {isConnected && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                rewardEarned
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-gold-500/10 border border-gold-500/30'
              }`}>
                {rewardEarned ? (
                  <>
                    <CheckCircle size={16} weight="fill" className="text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">
                      +{fsAmount || FS_REWARD} FS earned!
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkle size={16} weight="fill" className="text-gold-400" />
                    <span className="text-sm text-gold-400 font-medium">
                      {secondsSpent < REQUIRED_SECONDS
                        ? `${REQUIRED_SECONDS - secondsSpent}s to +${FS_REWARD} FS`
                        : `+${FS_REWARD} FS daily`}
                    </span>
                    <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (secondsSpent / REQUIRED_SECONDS) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            {!isConnected && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                <Sparkle size={16} weight="fill" className="text-gold-400" />
                <span className="text-sm text-gold-400 font-medium">+{FS_REWARD} FS daily</span>
              </div>
            )}
          </div>

          {/* Main Tab Navigation */}
          <div className="flex gap-1 p-1 bg-gray-900 rounded-xl mb-4">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-gray-950'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <>
            {/* Feed Filters */}
            <div className="mb-4">
              {/* Time Filter */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>Time:</span>
                </div>
                <div className="flex gap-1">
                  {timeTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTimeFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        timeFilter === tab.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2">
                {tierTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isTeamTab = tab.id === 'team';
                  const tierStyle = ['S', 'A', 'B', 'C'].includes(tab.id) ? getTierStyle(tab.id) : null;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTierFilter(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        tierFilter === tab.id
                          ? isTeamTab
                            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                            : tierStyle
                            ? `${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`
                            : 'bg-gray-700 text-white border border-gray-600'
                          : 'bg-gray-800/50 text-gray-400 border border-transparent hover:border-gray-700'
                      }`}
                    >
                      {Icon && <Icon size={14} weight="fill" />}
                      {tab.label}
                      {isTeamTab && teamInfluencerIds.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-gold-500/30 rounded">
                          {teamInfluencerIds.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
                <div className="animate-spin w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400">Loading feed...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 text-center">
                <Warning size={40} className="mx-auto mb-3 text-red-400" />
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchFeed}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                >
                  <ArrowClockwise size={16} />
                  Try again
                </button>
              </div>
            )}

            {/* Feed Content */}
            {!loading && !error && (
              <>
                {/* Viral Highlights */}
                {highlights.length > 0 && tierFilter === 'all' && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Fire size={18} weight="fill" className="text-orange-400" />
                      <span className="text-sm font-semibold text-white">Viral Right Now</span>
                      <span className="text-xs text-gray-500">
                        Diverse top picks · {timeFilter === '1h' ? 'last hour' : timeFilter}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {highlights.slice(0, 6).map((tweet) => (
                        <HighlightCard
                          key={tweet.id}
                          tweet={tweet}
                          onTeam={isOnTeam(tweet.influencer.id)}
                          scouted={isScouted(tweet.influencer.id)}
                          scouting={scoutingId === tweet.influencer.id}
                          draftCount={communityPicks[tweet.influencer.id] || 0}
                          onScout={() => toggleScout(tweet.influencer.id, tweet.influencer.name)}
                          engagementLabel={engagementLabel(tweet)}
                          tierStyle={getTierStyle(tweet.influencer.tier)}
                          formatNumber={formatNumber}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Emerging Movers — last-hour breakouts (relative virality) */}
                {emerging.length > 0 && tierFilter === 'all' && timeFilter !== '1h' && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendUp size={18} weight="fill" className="text-cyan-400" />
                      <span className="text-sm font-semibold text-white">Emerging Movers</span>
                      <span className="text-xs text-gray-500">Breaking out in the last hour · relative to audience</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {emerging.slice(0, 6).map((tweet) => (
                        <HighlightCard
                          key={tweet.id}
                          tweet={tweet}
                          onTeam={isOnTeam(tweet.influencer.id)}
                          scouted={isScouted(tweet.influencer.id)}
                          scouting={scoutingId === tweet.influencer.id}
                          draftCount={communityPicks[tweet.influencer.id] || 0}
                          onScout={() => toggleScout(tweet.influencer.id, tweet.influencer.name)}
                          engagementLabel={engagementLabel(tweet)}
                          tierStyle={getTierStyle(tweet.influencer.tier)}
                          formatNumber={formatNumber}
                          accent="cyan"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Feed */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="p-3 border-b border-gray-800 bg-gradient-to-r from-[#1DA1F2]/10 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TwitterLogo size={18} weight="fill" className="text-[#1DA1F2]" />
                        <span className="font-semibold text-white text-sm">
                          {tierFilter === 'team' ? 'Your Team\'s Tweets' : 'Feed'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {filteredTweets.length} tweets
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        Live
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-800/50 max-h-[600px] overflow-y-auto">
                    {filteredTweets.map((tweet) => {
                      const tierStyle = getTierStyle(tweet.influencer.tier);
                      const onTeam = isOnTeam(tweet.influencer.id);

                      return (
                        <div
                          key={tweet.id}
                          className={`p-4 hover:bg-gray-800/30 transition-colors ${
                            onTeam ? 'border-l-2 border-l-gold-500' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              {tweet.influencer.avatar ? (
                                <img src={tweet.influencer.avatar} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center">
                                  <TwitterLogo size={16} weight="fill" className="text-white" />
                                </div>
                              )}
                              {onTeam && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center">
                                  <Trophy size={10} weight="fill" className="text-gray-950" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-white text-sm">
                                  {tweet.influencer.name}
                                </span>
                                <span className="text-xs text-gray-500">@{tweet.influencer.handle}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${tierStyle.bg} ${tierStyle.text}`}>
                                  {tweet.influencer.tier}
                                </span>
                                {onTeam && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 font-medium">
                                    YOUR TEAM
                                  </span>
                                )}
                                <span className="text-xs text-gray-600 ml-auto">
                                  {getTimeAgo(tweet.createdAt)}
                                </span>
                              </div>

                              <p className="text-sm text-gray-300 mb-2">{tweet.text}</p>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
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
                              </div>

                              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-800/50">
                                {onTeam ? (
                                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                    <Lightning size={12} weight="fill" />
                                    {tweet.engagementScore > 0 ? `${formatNumber(tweet.engagementScore)} score` : 'On your team'}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => toggleScout(tweet.influencer.id, tweet.influencer.name)}
                                    disabled={scoutingId === tweet.influencer.id}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      isScouted(tweet.influencer.id)
                                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                                    }`}
                                  >
                                    {scoutingId === tweet.influencer.id ? (
                                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                    ) : isScouted(tweet.influencer.id) ? (
                                      <>
                                        <Check size={12} weight="bold" />
                                        Scouted
                                      </>
                                    ) : (
                                      <>
                                        <Binoculars size={12} />
                                        Scout · ${tweet.influencer.price}
                                      </>
                                    )}
                                  </button>
                                )}
                                <a
                                  href={tweet.twitterUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto flex items-center gap-1 text-xs text-[#1DA1F2] hover:underline"
                                >
                                  <TwitterLogo size={12} weight="fill" />
                                  Open
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty State */}
                    {filteredTweets.length === 0 && (
                      <div className="p-12 text-center">
                        {tierFilter === 'team' ? (
                          <>
                            <Trophy size={48} className="mx-auto mb-3 text-gray-600" />
                            <p className="text-gray-400 mb-1">No tweets from your team</p>
                            <p className="text-xs text-gray-600">
                              {hasTeam
                                ? 'Your drafted influencers haven\'t posted recently'
                                : 'Draft a team to see their tweets here'}
                            </p>
                          </>
                        ) : (
                          <>
                            <Newspaper size={48} className="mx-auto mb-3 text-gray-600" />
                            <p className="text-gray-400">No tweets match your filters</p>
                            <p className="text-xs text-gray-600 mt-1">Try adjusting the time or tier filters</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'profiles' && (
          <ProfilesTab onCompare={handleCompare} />
        )}

        {activeTab === 'rising' && (
          <RisingStarsTab />
        )}

        {/* Comparison Modal */}
        {showComparison && compareIds.length >= 2 && (
          <ComparisonTool
            influencerIds={compareIds}
            onClose={() => {
              setShowComparison(false);
              setCompareIds([]);
            }}
            onRemove={handleRemoveFromCompare}
          />
        )}
      </div>
    </div>
  );
}
