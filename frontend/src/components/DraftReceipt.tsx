/**
 * DraftReceipt — On-chain proof of team submission via Tapestry Protocol
 *
 * Shown after a successful draft submission when tapestry is published.
 * Replaces the old static TapestryBadge confirmation variant.
 */

import { CheckCircle, ArrowSquareOut, Lock } from '@phosphor-icons/react';

const TAPESTRY_ICON = 'https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png';

interface DraftReceiptProps {
  entryId?: number | string;
  captainHandle?: string | null;
  teamSize?: number;
  className?: string;
}

export default function DraftReceipt({
  entryId,
  captainHandle,
  teamSize = 5,
  className = '',
}: DraftReceiptProps) {
  const lockedTime = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format entry ID as a short receipt reference
  const receiptRef = entryId
    ? `FST-${String(entryId).padStart(6, '0')}`
    : `FST-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  return (
    <div className={`rounded-xl border border-gold-500/30 bg-gold-500/5 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gold-500/20 bg-gold-500/10">
        <img src={TAPESTRY_ICON} alt="Tapestry" className="w-4 h-4 rounded-sm invert opacity-80" />
        <span className="text-sm font-semibold text-gold-400">Team Locked on Solana</span>
        <Lock size={12} className="text-gold-500/50 ml-auto" />
      </div>

      {/* Receipt rows */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Receipt ID</span>
          <span className="text-xs font-mono text-gray-300">{receiptRef}</span>
        </div>

        {captainHandle && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Captain</span>
            <span className="text-xs text-white font-medium">@{captainHandle}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Team size</span>
          <span className="text-xs text-white">{teamSize} influencers</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Locked at</span>
          <span className="text-xs text-white">{lockedTime}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Protocol</span>
          <span className="text-xs text-white">Tapestry · Solana</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-700/40 bg-gray-800/30">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={13} weight="fill" className="text-emerald-400" />
          <span className="text-xs text-gray-400">Sealed on Solana at contest lock</span>
        </div>
        <a
          href="https://www.usetapestry.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <img src={TAPESTRY_ICON} alt="" className="w-3 h-3 rounded-sm invert opacity-50 hover:opacity-80 transition-opacity" />
          Tapestry <ArrowSquareOut size={10} />
        </a>
      </div>
    </div>
  );
}
