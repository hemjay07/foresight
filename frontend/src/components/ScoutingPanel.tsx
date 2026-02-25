/**
 * ScoutingPanel — Shows what followed players have drafted in this contest
 *
 * Uses the Tapestry social graph to surface "intel" before you lock your team.
 * Loaded lazily — only shown when auth token exists.
 */

import { useState, useEffect } from 'react';
import { Binoculars, Users, Crown, CaretDown, CaretUp, Spinner } from '@phosphor-icons/react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Scout {
  username: string;
  tapestryUserId: string;
  teamIds: number[];
  captainId: number | null;
  captainHandle: string | null;
  score: number | null;
}

interface ScoutingPanelProps {
  contestId: number | string;
  className?: string;
}

export default function ScoutingPanel({ contestId, className = '' }: ScoutingPanelProps) {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/api/v2/contests/${contestId}/social-scouts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setScouts(res.data.scouts || []);
        setMessage(res.data.message || null);
      })
      .catch(() => {
        setScouts([]);
      })
      .finally(() => setLoading(false));
  }, [contestId]);

  // Don't render if not logged in or no data
  if (!localStorage.getItem('authToken')) return null;
  if (loading) return null;

  const hasMostDrafted = scouts.length > 0;

  // Find trending pick (most common captain across scouts)
  const captainCounts: Record<string, number> = {};
  scouts.forEach(s => {
    if (s.captainHandle) {
      captainCounts[s.captainHandle] = (captainCounts[s.captainHandle] || 0) + 1;
    }
  });
  const trendingCaptain = Object.entries(captainCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const trendingCount = trendingCaptain ? captainCounts[trendingCaptain] : 0;

  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-800/30 overflow-hidden ${className}`}>
      {/* Header — always visible, tap to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Binoculars size={16} className="text-cyan-400" weight="fill" />
          <span className="text-sm font-semibold text-white">Scouts Report</span>
          {hasMostDrafted && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full">
              {scouts.length} follow{scouts.length !== 1 ? 's' : ''} entered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trendingCaptain && !open && (
            <span className="text-[10px] text-gray-400 hidden sm:block">
              Trending: @{trendingCaptain} ({trendingCount}×)
            </span>
          )}
          {open ? (
            <CaretUp size={14} className="text-gray-400" />
          ) : (
            <CaretDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-700/50">
          {!hasMostDrafted ? (
            <div className="px-4 py-4 text-center">
              <Users size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">
                {message || 'None of your follows have entered yet.'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Follow players on the leaderboard to see their picks here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/40">
              {/* Trending pick callout */}
              {trendingCaptain && trendingCount > 1 && (
                <div className="px-4 py-2 bg-gold-500/5 flex items-center gap-2">
                  <Crown size={13} weight="fill" className="text-gold-400 shrink-0" />
                  <p className="text-xs text-gold-300">
                    <span className="font-semibold">Trending captain:</span>{' '}
                    @{trendingCaptain} · picked by {trendingCount} of your follows
                  </p>
                </div>
              )}

              {/* Scout rows */}
              {scouts.map((scout) => (
                <div key={scout.tapestryUserId} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-cyan-400">
                      {(scout.username || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">@{scout.username}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {scout.teamIds?.length || 0} picks
                      {scout.captainHandle && (
                        <> · <Crown size={9} className="inline text-gold-400" weight="fill" /> @{scout.captainHandle}</>
                      )}
                    </p>
                  </div>
                  {scout.score != null && scout.score > 0 && (
                    <span className="text-xs font-mono text-gold-400 shrink-0">
                      {Math.round(scout.score)} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
