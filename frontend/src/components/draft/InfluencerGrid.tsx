/**
 * InfluencerGrid - Tier-grouped influencer selection for drafting
 * Simplified cards with essential info only
 */

import { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Check, TrendUp, Users, Fire, Info } from '@phosphor-icons/react';
import InfluencerDetailModal from './InfluencerDetailModal';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: number;
  follower_count?: number;
  engagement_rate?: number;
  total_points?: number;
  archetype?: string;
}

const ARCHETYPE_STYLE: Record<string, string> = {
  'Activity Beast':     'text-blue-400',
  'Engagement Wizard':  'text-gold-400',
  'Growth Machine':     'text-emerald-400',
  'Viral Sniper':       'text-rose-400',
  'All-Rounder':        'text-gray-400',
};

interface InfluencerGridProps {
  influencers: Influencer[];
  selectedIds: number[];
  captainId: number | null;
  remainingBudget: number;
  onSelect: (influencer: Influencer) => void;
  onSetCaptain: (id: number) => void;
  maxSelections?: number;
}

const TIER_ORDER = ['S', 'A', 'B', 'C'];

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; accent: string }> = {
  S: { label: 'S-TIER (Elite)', color: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/30', accent: 'border-l-gold-500' },
  A: { label: 'A-TIER (Strong)', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', accent: 'border-l-cyan-500' },
  B: { label: 'B-TIER (Solid)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', accent: 'border-l-emerald-500' },
  C: { label: 'C-TIER (Value)', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', accent: 'border-l-gray-600' },
};

export default function InfluencerGrid({
  influencers,
  selectedIds,
  captainId,
  remainingBudget,
  onSelect,
  onSetCaptain,
  maxSelections = 5,
}: InfluencerGridProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [detailInfluencer, setDetailInfluencer] = useState<Influencer | null>(null);

  // Group by tier
  const groupedInfluencers = useMemo(() => {
    let filtered = influencers;

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.handle.toLowerCase().includes(s) || i.name.toLowerCase().includes(s)
      );
    }

    // Tier filter
    if (tierFilter) {
      filtered = filtered.filter((i) => i.tier === tierFilter);
    }

    // Group by tier
    const groups: Record<string, Influencer[]> = {};
    for (const tier of TIER_ORDER) {
      groups[tier] = filtered.filter((i) => i.tier === tier);
    }

    return groups;
  }, [influencers, search, tierFilter]);

  const isSelected = (id: number) => selectedIds.includes(id);
  const canAfford = (price: number) => price <= remainingBudget;
  const isFull = selectedIds.length >= maxSelections;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search influencers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Tier Filters */}
        <div className="flex gap-1">
          <button
            onClick={() => setTierFilter(null)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !tierFilter ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {TIER_ORDER.map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tierFilter === tier
                  ? `${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].color} border ${TIER_CONFIG[tier].border}`
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Tier Sections */}
      <div className="space-y-6">
        {TIER_ORDER.map((tier) => {
          const items = groupedInfluencers[tier];
          if (!items || items.length === 0) return null;

          const config = TIER_CONFIG[tier];
          const priceRange = items.length > 0
            ? `${Math.min(...items.map((i) => i.price))} - ${Math.max(...items.map((i) => i.price))} pts`
            : '';

          return (
            <div key={tier}>
              {/* Tier Header */}
              <div className={`flex items-center justify-between mb-3 pb-2 border-b ${config.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-gray-500">{items.length} players</span>
                </div>
                <span className="text-xs text-gray-500">{priceRange}</span>
              </div>

              {/* Influencer Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {items.map((inf) => {
                  const selected = isSelected(inf.id);
                  const affordable = canAfford(inf.price);
                  const disabled = !selected && (isFull || !affordable);

                  return (
                    <button
                      key={inf.id}
                      onClick={() => !disabled && onSelect(inf)}
                      disabled={disabled && !selected}
                      className={`relative p-3 rounded-lg text-left transition-all border ${
                        selected
                          ? `${config.bg} ${config.border} border-l-[3px] ${config.accent}`
                          : disabled
                          ? `bg-gray-900/50 border-gray-800 border-l-[3px] ${config.accent} opacity-50 cursor-not-allowed`
                          : `bg-gray-800/50 border-gray-700 border-l-[3px] ${config.accent} hover:border-gray-600`
                      }`}
                    >
                      {/* Selected indicator */}
                      {selected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check size={12} weight="bold" className="text-white" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        {inf.profile_image_url ? (
                          <img src={inf.profile_image_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">@{inf.handle}</p>
                          <p className={`text-sm font-bold ${config.color}`}>{inf.price} pts</p>
                        </div>
                      </div>

                      {/* Mini stats */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-2">
                          {inf.follower_count && (
                            <span className="flex items-center gap-0.5">
                              <Users size={10} />
                              {(inf.follower_count / 1000).toFixed(0)}K
                            </span>
                          )}
                          {inf.total_points && (
                            <span className="flex items-center gap-0.5">
                              <Fire size={10} />
                              {inf.total_points}
                            </span>
                          )}
                        </div>
                        {/* Info button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailInfluencer(inf);
                          }}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Info size={12} className="text-gray-400 hover:text-white" />
                        </button>
                      </div>

                      {/* Archetype label */}
                      {inf.archetype && inf.archetype !== 'All-Rounder' && (
                        <p className={`text-[9px] mt-1 italic truncate ${ARCHETYPE_STYLE[inf.archetype] ?? 'text-gray-400'}`}>
                          {inf.archetype}
                        </p>
                      )}

                      {/* Can't afford label */}
                      {!affordable && !selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
                          <span className="text-xs text-red-400">Over budget</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {detailInfluencer && (
        <InfluencerDetailModal
          influencer={detailInfluencer}
          isSelected={selectedIds.includes(detailInfluencer.id)}
          isCaptain={captainId === detailInfluencer.id}
          canAfford={detailInfluencer.price <= remainingBudget}
          onClose={() => setDetailInfluencer(null)}
          onSelect={() => {
            onSelect(detailInfluencer);
            setDetailInfluencer(null);
          }}
          onSetCaptain={() => {
            onSetCaptain(detailInfluencer.id);
            setDetailInfluencer(null);
          }}
        />
      )}
    </div>
  );
}
