/**
 * ProfilesTab
 * Displays influencer profiles with filtering, search, and comparison
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  MagnifyingGlass,
  Funnel,
  ArrowsDownUp,
  Warning,
  ArrowClockwise,
  Scales,
  X,
} from '@phosphor-icons/react';
import { useToast } from '../../contexts/ToastContext';
import InfluencerProfileCard from './InfluencerProfileCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  handle: string;
  name: string;
  avatar: string | null;
  tier: string;
  price: number;
  totalPoints: number;
  followers: number;
  engagementRate: number;
  isScouted: boolean;
}

interface ProfilesTabProps {
  onCompare?: (ids: number[]) => void;
}

type SortOption = 'total_points' | 'price' | 'followers' | 'engagement';
type TierFilter = 'all' | 'S' | 'A' | 'B' | 'C';

export default function ProfilesTab({ onCompare }: ProfilesTabProps) {
  const { showToast } = useToast();

  // State
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<TierFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('total_points');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  // Scouting state
  const [scoutingId, setScoutingId] = useState<number | null>(null);

  // Fetch influencers
  const fetchInfluencers = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const token = localStorage.getItem('authToken');
      const currentPage = reset ? 1 : page;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
      });

      if (tier !== 'all') params.append('tier', tier);
      if (search) params.append('search', search);

      const res = await axios.get(`${API_URL}/api/intel/influencers?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data.success) {
        const newInfluencers = res.data.data.influencers;
        setInfluencers(reset ? newInfluencers : [...influencers, ...newInfluencers]);
        setHasMore(res.data.data.pagination.hasMore);
        setTotal(res.data.data.pagination.total);
        setError(null);
      }
    } catch (err) {
      console.error('[ProfilesTab] Error fetching:', err);
      setError('Failed to load influencers');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, tier, search, influencers]);

  // Initial load
  useEffect(() => {
    fetchInfluencers(true);
  }, [sortBy, tier]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchInfluencers(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scout handler
  const handleScout = async (influencerId: number, influencerName: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast('Please sign in to scout influencers', 'error');
      return;
    }

    setScoutingId(influencerId);
    const influencer = influencers.find(i => i.id === influencerId);
    const isScouted = influencer?.isScouted;

    try {
      if (isScouted) {
        await axios.delete(`${API_URL}/api/watchlist/${influencerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInfluencers(prev => prev.map(i =>
          i.id === influencerId ? { ...i, isScouted: false } : i
        ));
        showToast(`Removed ${influencerName} from watchlist`, 'success');
      } else {
        await axios.post(`${API_URL}/api/watchlist/${influencerId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInfluencers(prev => prev.map(i =>
          i.id === influencerId ? { ...i, isScouted: true } : i
        ));
        showToast(`Scouted ${influencerName}!`, 'success');
      }
    } catch (err) {
      showToast('Failed to update watchlist', 'error');
    } finally {
      setScoutingId(null);
    }
  };

  // Compare mode handlers
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareIds([]);
  };

  const handleSelectForCompare = (influencer: Influencer) => {
    if (compareIds.includes(influencer.id)) {
      setCompareIds(compareIds.filter(id => id !== influencer.id));
    } else if (compareIds.length < 3) {
      setCompareIds([...compareIds, influencer.id]);
    } else {
      showToast('Maximum 3 influencers for comparison', 'error');
    }
  };

  const handleCompare = () => {
    if (compareIds.length >= 2 && onCompare) {
      onCompare(compareIds);
    }
  };

  // Load more
  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchInfluencers(false);
    }
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'total_points', label: 'Points' },
    { value: 'price', label: 'Price' },
    { value: 'followers', label: 'Followers' },
    { value: 'engagement', label: 'Engagement' },
  ];

  const tierOptions: { value: TierFilter; label: string }[] = [
    { value: 'all', label: 'All Tiers' },
    { value: 'S', label: 'S-Tier' },
    { value: 'A', label: 'A-Tier' },
    { value: 'B', label: 'B-Tier' },
    { value: 'C', label: 'C-Tier' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search influencers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Tier Filter */}
        <div className="relative">
          <Funnel size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TierFilter)}
            className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan-500"
          >
            {tierOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <ArrowsDownUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan-500"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Compare Toggle */}
        <button
          onClick={toggleCompareMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            compareMode
              ? 'bg-cyan-500 text-gray-950'
              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-cyan-500/50'
          }`}
        >
          <Scales size={16} />
          {compareMode ? 'Cancel' : 'Compare'}
        </button>
      </div>

      {/* Compare Bar (when in compare mode) */}
      {compareMode && (
        <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Scales size={16} className="text-cyan-400" />
            <span className="text-cyan-400">
              Select 2-3 influencers to compare ({compareIds.length}/3)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {compareIds.length >= 2 && (
              <button
                onClick={handleCompare}
                className="px-4 py-1.5 bg-cyan-500 text-gray-950 rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors"
              >
                Compare Now
              </button>
            )}
            <button
              onClick={() => setCompareIds([])}
              className="p-1.5 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        {total} influencers found
      </div>

      {/* Loading State */}
      {loading && influencers.length === 0 && (
        <div className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400">Loading influencers...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="py-12 text-center">
          <Warning size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchInfluencers(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            <ArrowClockwise size={16} />
            Try again
          </button>
        </div>
      )}

      {/* Influencer Grid */}
      {!error && influencers.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {influencers.map((influencer) => (
              <InfluencerProfileCard
                key={influencer.id}
                influencer={influencer}
                onScout={handleScout}
                onSelect={handleSelectForCompare}
                isCompareMode={compareMode}
                isSelected={compareIds.includes(influencer.id)}
                scouting={scoutingId === influencer.id}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && influencers.length === 0 && (
        <div className="py-12 text-center">
          <MagnifyingGlass size={40} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No influencers found</p>
          <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
