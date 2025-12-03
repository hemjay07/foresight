import { ShareNetwork } from '@phosphor-icons/react';

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showShare?: boolean;
  onClick?: () => void;
}

const rarityColors = {
  common: {
    border: 'border-gray-600/30',
    bg: 'bg-gray-800/40',
    glow: 'hover:shadow-gray-500/10',
  },
  rare: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-900/20',
    glow: 'hover:shadow-blue-500/20',
  },
  epic: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-900/20',
    glow: 'hover:shadow-purple-500/20',
  },
  legendary: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-900/20',
    glow: 'hover:shadow-cyan-500/30',
  },
};

const sizeClasses = {
  sm: 'w-12 h-12 text-2xl',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-20 h-20 text-4xl',
};

const AchievementBadge = ({
  icon,
  name,
  description,
  rarity,
  unlocked,
  unlockedAt,
  size = 'md',
  showName = false,
  showShare = false,
  onClick,
}: AchievementBadgeProps) => {
  const colors = rarityColors[rarity];

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `just unlocked "${name}" on @ForesightCT ${icon}`;
    const url = 'https://foresight.ct';
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div
      className={`group relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Badge */}
      <div
        className={`
          ${sizeClasses[size]}
          ${unlocked ? colors.bg : 'bg-gray-900/50'}
          ${unlocked ? colors.border : 'border-gray-800/30'}
          border rounded-lg
          flex items-center justify-center
          transition-all duration-300
          ${unlocked ? colors.glow : ''}
          ${unlocked ? 'hover:scale-110' : 'grayscale opacity-40 blur-[1px]'}
        `}
      >
        <span className={unlocked ? '' : 'opacity-50'}>{icon}</span>
      </div>

      {/* Name (if shown) */}
      {showName && (
        <div className="mt-2 text-center">
          <div className={`text-xs font-medium ${unlocked ? 'text-white' : 'text-gray-600'}`}>
            {name}
          </div>
        </div>
      )}

      {/* Share button (only for unlocked achievements if showShare is true) */}
      {showShare && unlocked && (
        <button
          onClick={handleShare}
          className="absolute -top-2 -right-2 w-6 h-6 bg-[#1DA1F2] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 z-10"
          title="Share on Twitter"
        >
          <ShareNetwork size={12} weight="fill" className="text-white" />
        </button>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className={`font-semibold text-sm ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                {name}
              </div>
              <div className={`text-xs capitalize ${
                rarity === 'legendary' ? 'text-cyan-400' :
                rarity === 'epic' ? 'text-purple-400' :
                rarity === 'rare' ? 'text-blue-400' :
                'text-gray-500'
              }`}>
                {rarity}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {description}
          </div>
          {unlocked && unlockedAt && (
            <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-800">
              unlocked {new Date(unlockedAt).toLocaleDateString()}
            </div>
          )}
          {!unlocked && (
            <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-800">
              locked
            </div>
          )}
        </div>
        {/* Arrow */}
        <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 mx-auto -mt-1"></div>
      </div>
    </div>
  );
};

export default AchievementBadge;
