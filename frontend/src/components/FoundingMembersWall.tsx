/**
 * Founding Members Wall
 * Displays the first 1000 users who joined - the Founding Members
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Users, Crown, Fire, CaretRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FoundingMember {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  foundingMemberNumber: number;
  joinedAt: string;
}

interface FoundingMembersData {
  founders: FoundingMember[];
  claimed: number;
  total: number;
  remaining: number;
  isClosed: boolean;
}

interface Props {
  variant?: 'compact' | 'full';
  limit?: number;
  showCTA?: boolean;
}

export default function FoundingMembersWall({ variant = 'compact', limit = 20, showCTA = true }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FoundingMembersData | null>(null);

  useEffect(() => {
    fetchFounders();
  }, [limit]);

  const fetchFounders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/v2/fs/founding-members`, {
        params: { limit }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching founding members:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-800 rounded w-1/3"></div>
          <div className="flex gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-gray-800"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.claimed === 0) return null;

  // Compact variant - just avatars and progress
  if (variant === 'compact') {
    const progress = (data.claimed / data.total) * 100;

    return (
      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={20} weight="fill" className="text-yellow-400" />
              <span className="font-bold text-white">Founding Members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">{data.claimed}</span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">{data.total}</span>
            </div>
          </div>
        </div>

        {/* Founders avatars */}
        <div className="p-4">
          <div className="flex -space-x-2 overflow-hidden mb-4">
            {data.founders.slice(0, 12).map((founder) => (
              <div
                key={founder.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 border-2 border-gray-900 flex items-center justify-center overflow-hidden"
                title={`Founder #${founder.foundingMemberNumber}: ${founder.username || 'Anonymous'}`}
              >
                {founder.avatarUrl ? (
                  <img src={founder.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-white">
                    {founder.foundingMemberNumber}
                  </span>
                )}
              </div>
            ))}
            {data.claimed > 12 && (
              <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center">
                <span className="text-[10px] text-gray-400">+{data.claimed - 12}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {data.remaining > 0 ? (
                <>{data.remaining} spots remaining</>
              ) : (
                <span className="text-red-400">Founding spots closed</span>
              )}
            </span>
            {data.remaining > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Fire size={14} weight="fill" />
                1.5x multiplier
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        {showCTA && data.remaining > 0 && (
          <Link
            to="/progress"
            className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-t border-yellow-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 transition-colors"
          >
            <span className="text-sm font-medium text-white">Earn FS to claim your spot</span>
            <CaretRight size={16} className="text-yellow-400" />
          </Link>
        )}
      </div>
    );
  }

  // Full variant - detailed grid view
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-yellow-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Star size={22} weight="fill" className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Founding Members Wall</h3>
              <p className="text-sm text-gray-400">
                The first {data.total} believers • 1.5x multiplier for 90 days
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{data.claimed}</div>
            <div className="text-xs text-gray-500">of {data.total} claimed</div>
          </div>
        </div>
      </div>

      {/* Founders grid */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {data.founders.map((founder) => (
            <div
              key={founder.id}
              className="group relative"
              title={`#${founder.foundingMemberNumber}: ${founder.username || 'Anonymous'}`}
            >
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center overflow-hidden hover:border-yellow-500/50 transition-colors">
                {founder.avatarUrl ? (
                  <img src={founder.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={20} className="text-gray-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded bg-gray-900 border border-yellow-500/50 text-[8px] font-bold text-yellow-400">
                #{founder.foundingMemberNumber}
              </div>
            </div>
          ))}

          {/* Unclaimed spots */}
          {data.remaining > 0 && [...Array(Math.min(20, data.remaining))].map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-full aspect-square rounded-lg border border-dashed border-gray-700 flex items-center justify-center opacity-50"
            >
              <span className="text-[10px] text-gray-600">?</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.remaining > 0 ? (
              <>
                <Fire size={18} weight="fill" className="text-orange-400" />
                <span className="text-sm text-gray-400">
                  <span className="text-white font-semibold">{data.remaining}</span> spots remaining
                </span>
              </>
            ) : (
              <>
                <Crown size={18} weight="fill" className="text-yellow-400" />
                <span className="text-sm text-yellow-400">All founding spots claimed!</span>
              </>
            )}
          </div>
          {data.remaining > 0 && (
            <Link
              to="/progress"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Earn FS
              <CaretRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
