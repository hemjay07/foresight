/**
 * FormationTeam - Visual football-style formation for draft team
 * Captain slot prominently displayed at top with 1.5x bonus
 */

import { Crown, Plus, X, User, Sparkle, Trash } from '@phosphor-icons/react';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: number;
}

interface FormationTeamProps {
  picks: (Influencer | null)[];
  captainId: number | null;
  budget: number;
  maxBudget: number;
  onRemove: (id: number) => void;
  onSetCaptain: (id: number) => void;
  onAutoFill?: () => void;
  onClearAll?: () => void;
  teamSize?: number;
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  S: { bg: 'bg-gold-500/20', border: 'border-gold-500', text: 'text-gold-400' },
  A: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
  B: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400' },
  C: { bg: 'bg-gray-500/20', border: 'border-gray-500', text: 'text-gray-400' },
};

export default function FormationTeam({
  picks,
  captainId,
  budget,
  maxBudget,
  onRemove,
  onSetCaptain,
  onAutoFill,
  onClearAll,
  teamSize = 5,
}: FormationTeamProps) {
  const usedBudget = picks
    .filter(Boolean)
    .reduce((sum, p) => sum + (p?.price || 0), 0);
  const remainingBudget = maxBudget - usedBudget;
  const budgetPercent = (usedBudget / maxBudget) * 100;

  // Find captain from picks
  const captain = picks.find((p) => p?.id === captainId) || null;
  const nonCaptainPicks = picks.filter((p) => p && p.id !== captainId);

  // Determine how many bottom slots to show
  // If captain is selected: 4 slots
  // If no captain but 5 players selected: show all 5 in bottom (captain slot will prompt selection)
  const bottomSlots = captain ? teamSize - 1 : teamSize;

  // Pad to required slots
  const displayPicks = [...nonCaptainPicks];
  while (displayPicks.length < bottomSlots) {
    displayPicks.push(null);
  }

  const filledCount = picks.filter(Boolean).length;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      {/* Budget Bar - Compact */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">Budget</span>
        <span className={`text-sm font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-white'}`}>
          ${usedBudget} / ${maxBudget}
          <span className={`ml-1 text-xs ${remainingBudget < 0 ? 'text-red-400' : 'text-gray-500'}`}>
            ({remainingBudget < 0 ? `-$${Math.abs(remainingBudget)}` : `$${remainingBudget}`})
          </span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-300 ${
            budgetPercent > 100 ? 'bg-red-500' : budgetPercent > 80 ? 'bg-gold-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(budgetPercent, 100)}%` }}
        />
      </div>

      {/* Action Buttons - Inline */}
      <div className="flex gap-2 mb-4">
        {onAutoFill && (
          <button
            onClick={onAutoFill}
            disabled={filledCount >= teamSize}
            className="flex-1 py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkle size={14} weight="fill" />
            Auto-fill
          </button>
        )}
        {onClearAll && filledCount > 0 && (
          <button
            onClick={onClearAll}
            className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Team Grid - All 5 slots in unified layout */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {Array.from({ length: teamSize }).map((_, idx) => {
          const player = picks[idx];
          const isCaptain = player && player.id === captainId;

          if (player) {
            return (
              <CompactPlayerSlot
                key={player.id}
                player={player}
                isCaptain={isCaptain}
                onRemove={() => onRemove(player.id)}
                onSetCaptain={() => onSetCaptain(player.id)}
              />
            );
          }

          return (
            <div
              key={`empty-${idx}`}
              className="aspect-square rounded-lg border border-dashed border-gray-700 bg-gray-800/30 flex flex-col items-center justify-center"
            >
              <Plus size={16} className="text-gray-600" />
            </div>
          );
        })}
      </div>

      {/* Captain hint */}
      {filledCount > 0 && !captainId && (
        <p className="text-center text-xs text-gold-400 mb-3 flex items-center justify-center gap-1">
          <Crown size={12} weight="fill" />
          Tap a player to make them captain (1.5× points)
        </p>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{filledCount}/{teamSize} selected</span>
        {captain && (
          <span className="text-gold-400 flex items-center gap-1">
            <Crown size={12} weight="fill" />
            @{captain.handle} (1.5×)
          </span>
        )}
      </div>
    </div>
  );
}

// Compact player slot for the unified grid layout
interface CompactSlotProps {
  player: Influencer;
  isCaptain: boolean;
  onRemove: () => void;
  onSetCaptain: () => void;
}

function CompactPlayerSlot({ player, isCaptain, onRemove, onSetCaptain }: CompactSlotProps) {
  const tierStyle = TIER_COLORS[player.tier] || TIER_COLORS.C;

  return (
    <div
      className={`relative aspect-square rounded-lg border-2 transition-all cursor-pointer group ${
        isCaptain
          ? 'bg-gold-500/20 border-gold-500'
          : `${tierStyle.bg} ${tierStyle.border} hover:border-opacity-100`
      }`}
      onClick={onSetCaptain}
    >
      {/* Captain crown */}
      {isCaptain && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
          <Crown size={14} weight="fill" className="text-gold-400" />
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={8} weight="bold" className="text-white" />
      </button>

      {/* Player content */}
      <div className="h-full flex flex-col items-center justify-center p-1">
        {player.profile_image_url ? (
          <img
            src={player.profile_image_url}
            alt={player.handle}
            className={`rounded-full w-8 h-8 sm:w-10 sm:h-10 ${isCaptain ? 'ring-2 ring-gold-400' : ''}`}
          />
        ) : (
          <div className={`rounded-full bg-gray-700 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ${isCaptain ? 'ring-2 ring-gold-400' : ''}`}>
            <User size={16} className="text-gray-400" />
          </div>
        )}

        <span className="text-[9px] sm:text-[10px] text-white truncate w-full text-center mt-1">
          @{player.handle.slice(0, 8)}
        </span>

        <div className="flex items-center gap-0.5 mt-0.5">
          <span className={`text-[8px] px-1 rounded font-bold ${tierStyle.text}`}>
            {player.tier}
          </span>
          <span className="text-[8px] text-gray-400">${player.price}</span>
        </div>
      </div>
    </div>
  );
}

interface EmptySlotProps {
  label: string;
  isCaptain?: boolean;
}

function EmptySlot({ label, isCaptain = false }: EmptySlotProps) {
  return (
    <div
      className={`p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center ${
        isCaptain
          ? 'border-gold-500/50 bg-gold-500/5 min-h-[140px] min-w-[120px]'
          : 'border-gray-700 bg-gray-800/30 min-h-[100px]'
      }`}
    >
      <Plus size={isCaptain ? 24 : 16} className={isCaptain ? 'text-gold-500' : 'text-gray-600'} />
      <span className={`text-xs mt-1 ${isCaptain ? 'text-gold-500' : 'text-gray-600'}`}>{label}</span>
    </div>
  );
}
