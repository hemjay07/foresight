/**
 * FormationTeam - 1-2-2 pyramid formation (Foresight visual signature)
 * Captain slot centered top (larger), 2 mid slots, 2 bottom slots
 */

import { Crown, Plus, X, User, Sparkle, Trash, LinkSimple } from '@phosphor-icons/react';

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
  showTapestryBadge?: boolean;
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
  showTapestryBadge = false,
}: FormationTeamProps) {
  const usedBudget = picks
    .filter(Boolean)
    .reduce((sum, p) => sum + (p?.price || 0), 0);
  const remainingBudget = maxBudget - usedBudget;
  const budgetPercent = (usedBudget / maxBudget) * 100;
  const filledCount = picks.filter(Boolean).length;

  // Organize picks into pyramid slots: [top, mid1, mid2, bot1, bot2]
  // When captain is selected → captain goes top. Otherwise first pick goes top.
  const allFilled = picks.filter(Boolean) as Influencer[];
  const captain = allFilled.find((p) => p.id === captainId) || null;

  let topPlayer: Influencer | null;
  let restPicks: Influencer[];

  if (captain) {
    topPlayer = captain;
    restPicks = allFilled.filter((p) => p.id !== captainId);
  } else {
    // No captain yet — first pick occupies top slot visually
    topPlayer = allFilled[0] || null;
    restPicks = allFilled.slice(1);
  }

  const midRow: (Influencer | null)[] = [restPicks[0] || null, restPicks[1] || null];
  const botRow: (Influencer | null)[] = [restPicks[2] || null, restPicks[3] || null];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      {/* Header with budget + Tapestry badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-400">Budget</span>
        <div className="flex items-center gap-3">
          {showTapestryBadge && (
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              <LinkSimple size={12} />
              Sealed on Solana
            </span>
          )}
          <span className={`text-sm font-bold font-mono tabular-nums ${remainingBudget < 0 ? 'text-red-400' : 'text-white'}`}>
            {usedBudget} / {maxBudget} pts
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-150 ${
            budgetPercent > 100 ? 'bg-red-500' : budgetPercent > 80 ? 'bg-gold-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(budgetPercent, 100)}%` }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        {onAutoFill && (
          <button
            onClick={onAutoFill}
            disabled={filledCount >= teamSize}
            className="flex-1 py-2 px-3 border border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkle size={14} weight="fill" />
            Auto-fill
          </button>
        )}
        {onClearAll && filledCount > 0 && (
          <button
            onClick={onClearAll}
            className="py-2 px-3 text-gray-500 hover:text-red-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash size={14} />
            Clear
          </button>
        )}
      </div>

      {/* 1-2-2 Pyramid Formation */}
      <div className="space-y-2 mb-3">
        {/* Row 1: Top slot (captain or first pick, centered, larger) */}
        <div className="flex justify-center">
          {topPlayer ? (
            <PlayerSlot
              player={topPlayer}
              isCaptain={!!captain}
              isLarge={true}
              onRemove={() => onRemove(topPlayer!.id)}
              onSetCaptain={() => onSetCaptain(topPlayer!.id)}
            />
          ) : (
            <EmptySlot isCaptain={true} label="Captain" hint="2.0x pts" />
          )}
        </div>

        {/* Row 2: 2 mid slots */}
        <div className="flex justify-center gap-2">
          {midRow.map((player, idx) =>
            player ? (
              <PlayerSlot
                key={player.id}
                player={player}
                isCaptain={false}
                isLarge={false}
                onRemove={() => onRemove(player.id)}
                onSetCaptain={() => onSetCaptain(player.id)}
              />
            ) : (
              <EmptySlot key={`mid-${idx}`} label={`Slot ${idx + 2}`} />
            )
          )}
        </div>

        {/* Row 3: 2 bottom slots */}
        <div className="flex justify-center gap-2">
          {botRow.map((player, idx) =>
            player ? (
              <PlayerSlot
                key={player.id}
                player={player}
                isCaptain={false}
                isLarge={false}
                onRemove={() => onRemove(player.id)}
                onSetCaptain={() => onSetCaptain(player.id)}
              />
            ) : (
              <EmptySlot key={`bot-${idx}`} label={`Slot ${idx + 4}`} />
            )
          )}
        </div>
      </div>

      {/* Captain hint */}
      {filledCount > 0 && !captainId && (
        <p className="text-center text-xs text-gold-400 mb-3 flex items-center justify-center gap-1">
          <Crown size={12} weight="fill" />
          Tap a player to make them captain (2.0x points)
        </p>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{filledCount}/{teamSize} selected</span>
        {captain && (
          <span className="text-gold-400 flex items-center gap-1">
            <Crown size={12} weight="fill" />
            @{captain.handle} (2.0x)
          </span>
        )}
      </div>
    </div>
  );
}

// Player slot for pyramid formation
interface PlayerSlotProps {
  player: Influencer;
  isCaptain: boolean;
  isLarge: boolean;
  onRemove: () => void;
  onSetCaptain: () => void;
}

function PlayerSlot({ player, isCaptain, isLarge, onRemove, onSetCaptain }: PlayerSlotProps) {
  const tierStyle = TIER_COLORS[player.tier] || TIER_COLORS.C;
  const avatarSize = isLarge ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12';
  const slotWidth = isLarge ? 'w-[120px] sm:w-[140px]' : 'w-[100px] sm:w-[120px]';

  return (
    <div
      className={`relative rounded-xl border-2 transition-colors cursor-pointer group p-2 flex flex-col items-center ${slotWidth} ${
        isCaptain
          ? 'bg-gold-500/10 border-gold-500'
          : `bg-gray-800/50 ${tierStyle.border} border-opacity-50 hover:border-opacity-100`
      }`}
      onClick={onSetCaptain}
    >
      {/* Captain crown */}
      {isCaptain && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <Crown size={16} weight="fill" className="text-gold-400" />
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 hover:bg-red-500 rounded-full flex items-center justify-center z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
      >
        <X size={10} weight="bold" className="text-white" />
      </button>

      {/* Avatar */}
      {player.profile_image_url ? (
        <img
          src={player.profile_image_url}
          alt={player.handle}
          className={`rounded-full ${avatarSize} ${isCaptain ? 'ring-2 ring-gold-400' : ''}`}
        />
      ) : (
        <div className={`rounded-full bg-gray-700 flex items-center justify-center ${avatarSize} ${isCaptain ? 'ring-2 ring-gold-400' : ''}`}>
          <User size={isLarge ? 20 : 16} className="text-gray-400" />
        </div>
      )}

      {/* Handle */}
      <span className="text-[10px] sm:text-xs text-white truncate w-full text-center mt-1.5">
        @{player.handle.length > 10 ? `${player.handle.slice(0, 10)}...` : player.handle}
      </span>

      {/* Tier + Price */}
      <div className="flex items-center gap-1 mt-0.5">
        <span className={`text-[9px] px-1 rounded font-bold ${tierStyle.text}`}>
          {player.tier}
        </span>
        <span className="text-[9px] text-gray-400 font-mono tabular-nums">{player.price} pts</span>
      </div>

      {/* Captain multiplier badge */}
      {isCaptain && (
        <span className="text-[9px] text-gold-400 font-bold mt-0.5">2.0x</span>
      )}
    </div>
  );
}

// Empty slot for pyramid formation
interface EmptySlotProps {
  isCaptain?: boolean;
  label: string;
  hint?: string;
}

function EmptySlot({ isCaptain = false, label, hint }: EmptySlotProps) {
  const slotWidth = isCaptain ? 'w-[120px] sm:w-[140px]' : 'w-[100px] sm:w-[120px]';
  const minHeight = isCaptain ? 'min-h-[110px] sm:min-h-[130px]' : 'min-h-[90px] sm:min-h-[110px]';

  return (
    <div
      className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center ${slotWidth} ${minHeight} ${
        isCaptain
          ? 'border-gold-500/40 bg-gold-500/5'
          : 'border-gray-700 bg-gray-800/30'
      }`}
    >
      <Plus size={isCaptain ? 20 : 16} className={isCaptain ? 'text-gold-500/60' : 'text-gray-600'} />
      <span className={`text-[10px] mt-1 ${isCaptain ? 'text-gold-500/60' : 'text-gray-600'}`}>
        {label}
      </span>
      {hint && (
        <span className="text-[9px] text-gold-400/50 mt-0.5">{hint}</span>
      )}
    </div>
  );
}
