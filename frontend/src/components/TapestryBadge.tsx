/**
 * TapestryBadge — Shows Tapestry Protocol integration status
 *
 * Variants:
 * - inline: Small badge for leaderboard rows ("Verified on Tapestry")
 * - card: Larger card for profile page with details
 * - confirmation: Success state after publishing to Tapestry
 */

import { CheckCircle, ArrowSquareOut } from '@phosphor-icons/react';

const TAPESTRY_ICON = 'https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png';

interface TapestryBadgeProps {
  variant?: 'inline' | 'card' | 'confirmation';
  tapestryUserId?: string | null;
  teamsShared?: number;
  className?: string;
}

export default function TapestryBadge({
  variant = 'inline',
  tapestryUserId,
  teamsShared = 0,
  className = '',
}: TapestryBadgeProps) {
  const isConnected = !!tapestryUserId;

  if (variant === 'inline') {
    if (!isConnected) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-gray-400 ${className}`}>
        <img src={TAPESTRY_ICON} alt="" className="w-3 h-3 rounded-sm invert opacity-50" />
        On Tapestry
      </span>
    );
  }

  if (variant === 'confirmation') {
    return (
      <div className={`px-4 py-3 rounded-xl bg-gold-500/10 border border-gold-500/20 ${className}`}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={18} weight="fill" className="text-gold-400" />
          <span className="text-sm text-gold-400 font-semibold">Saved to Solana</span>
        </div>
        <p className="text-xs text-gray-400 ml-[26px]">
          Your team is stored on Solana's social graph — immutable and verifiable.
        </p>
      </div>
    );
  }

  // variant === 'card'
  return (
    <div className={`rounded-xl border p-5 ${
      isConnected
        ? 'bg-gold-500/5 border-gold-500/20'
        : 'bg-gray-800/30 border-gray-700'
    } ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img src={TAPESTRY_ICON} alt="Tapestry" className="w-5 h-5 rounded-sm invert opacity-70" />
          <h3 className="font-semibold text-white">Tapestry Protocol</h3>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-xs bg-gold-500/10 text-gold-400 px-2 py-1 rounded-full">
            <CheckCircle size={12} weight="fill" />
            Connected
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Your profile and teams are stored on Tapestry's social graph.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Teams shared</span>
              <span className="ml-2 font-mono text-white">{teamsShared}</span>
            </div>
            <div>
              <span className="text-gray-500">Profile ID</span>
              <span className="ml-2 font-mono text-xs text-gray-400">
                {tapestryUserId?.slice(0, 8)}...
              </span>
            </div>
          </div>
          <a
            href="https://www.usetapestry.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors"
          >
            View on Tapestry <ArrowSquareOut size={12} />
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Sign in to link your Tapestry social profile. Teams and scores will be published to the social graph.
        </p>
      )}
    </div>
  );
}
