/**
 * Settings Page — Profile + Linked Accounts
 * Uses Privy's useLinkAccount for wallet/twitter/email linking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePrivy } from '@privy-io/react-auth';
import { useLinkAccount } from '@privy-io/react-auth';
import {
  User, SignOut, CheckCircle, Warning, Crown, Image,
  PencilSimple, X, XLogo, Wallet, Envelope, Link as LinkIcon,
  Star
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { getXPLevel } from '../utils/xp';
import SEO from '../components/SEO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UserProfile {
  id: number;
  walletAddress: string;
  username?: string;
  twitterHandle?: string;
  avatarUrl?: string;
  xp: number;
  voteStreak: number;
  ctMasteryScore: number;
  ctMasteryLevel: number;
}

interface Team {
  id: number;
  team_name: string;
  total_score: number;
}

export default function Settings() {
  const { address, isConnected, logout, email, twitterHandle } = useAuth();
  const { user, unlinkTwitter, unlinkEmail, unlinkWallet } = usePrivy();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { linkTwitter, linkEmail, linkWallet } = useLinkAccount({
    onSuccess: () => {
      showToast('Account linked successfully!', 'success');
    },
    onError: (error) => {
      console.error('Link error:', error);
      const msg = String(error?.message || error || '');
      if (msg.includes('not allowed')) {
        showToast('This login method is not configured yet', 'error');
      } else {
        showToast('Failed to link account', 'error');
      }
    },
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  // Form values
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [teamNameInput, setTeamNameInput] = useState('');

  // Saving states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const [disconnecting, setDisconnecting] = useState(false);

  // Count linked accounts to prevent unlinking the last one
  const linkedCount = user?.linkedAccounts?.length ?? 0;

  // Extract linked account details from Privy user
  const walletAccount = user?.linkedAccounts?.find(
    (a: any) => a.type === 'wallet' && a.chainType === 'solana'
  ) || user?.linkedAccounts?.find((a: any) => a.type === 'wallet');
  const walletAddress = walletAccount && 'address' in walletAccount
    ? (walletAccount as any).address as string
    : undefined;

  const emailAccount = user?.linkedAccounts?.find((a: any) => a.type === 'email');
  const linkedEmail = emailAccount && 'address' in emailAccount
    ? (emailAccount as any).address as string
    : undefined;

  const twitterAccount = user?.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth');
  const linkedTwitter = twitterAccount
    ? ((twitterAccount as any).username || (twitterAccount as any).name || undefined)
    : undefined;
  const twitterSubject = twitterAccount
    ? ((twitterAccount as any).subject || (twitterAccount as any).username || undefined)
    : undefined;

  useEffect(() => {
    if (disconnecting) return;
    if (isConnected) {
      fetchUserData();
    }
  }, [isConnected, disconnecting]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const profileResponse = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = profileResponse.data?.data || profileResponse.data;
      setProfile(profileData);
      setUsernameInput(profileData.username || '');
      setAvatarUrlInput(profileData.avatarUrl || '');

      try {
        const teamResponse = await axios.get(`${API_URL}/api/league/team/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamResponse.data.team) {
          setTeam(teamResponse.data.team);
          setTeamNameInput(teamResponse.data.team.team_name || '');
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
          console.error('Error fetching team:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSavingProfile(true);
      const token = localStorage.getItem('authToken');

      const updates: { username?: string; avatarUrl?: string } = {};
      if (usernameInput !== profile?.username) updates.username = usernameInput;
      if (avatarUrlInput !== profile?.avatarUrl) updates.avatarUrl = avatarUrlInput;

      if (Object.keys(updates).length === 0) {
        showToast('No changes to save', 'error');
        return;
      }

      await axios.patch(
        `${API_URL}/api/users/profile`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Profile updated successfully!', 'success');
      setIsEditingUsername(false);
      setIsEditingAvatar(false);
      await fetchUserData();
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to update profile';
      showToast(errorMsg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateTeamName = async () => {
    try {
      setSavingTeam(true);
      const token = localStorage.getItem('authToken');

      if (teamNameInput === team?.team_name) {
        showToast('No changes to save', 'error');
        setIsEditingTeamName(false);
        return;
      }

      if (!teamNameInput || teamNameInput.trim().length < 3) {
        showToast('Team name must be at least 3 characters', 'error');
        return;
      }

      await axios.patch(
        `${API_URL}/api/league/team/name`,
        { team_name: teamNameInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Team name updated successfully!', 'success');
      setIsEditingTeamName(false);
      await fetchUserData();
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to update team name';
      showToast(errorMsg, 'error');
    } finally {
      setSavingTeam(false);
    }
  };

  const handleUnlink = async (type: 'twitter' | 'email' | 'wallet') => {
    if (linkedCount <= 1) {
      showToast('Cannot unlink your only sign-in method', 'error');
      return;
    }
    try {
      setUnlinking(type);
      if (type === 'twitter' && twitterSubject) {
        await unlinkTwitter(twitterSubject);
      } else if (type === 'email' && linkedEmail) {
        await unlinkEmail(linkedEmail);
      } else if (type === 'wallet' && walletAddress) {
        await unlinkWallet(walletAddress);
      }
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} unlinked`, 'success');
    } catch (error) {
      showToast(`Failed to unlink ${type}`, 'error');
    } finally {
      setUnlinking(null);
    }
  };

  const handleDisconnect = () => {
    setDisconnecting(true);
    logout();
    showToast('Signed out', 'success');
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <User size={48} className="mx-auto mb-4 text-gray-600" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
        <p className="text-gray-400">Sign in to access settings</p>
      </div>
    );
  }

  const token = localStorage.getItem('authToken');
  if (!token && !loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <User size={48} className="mx-auto mb-4 text-gold-400" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 mb-4">Please sign in to access settings</p>
        <p className="text-sm text-gray-500">The sign-in prompt should appear automatically. If not, try refreshing the page.</p>
      </div>
    );
  }

  const xpInfo = getXPLevel(profile?.xp || 0);

  return (
    <div className="min-h-screen bg-gray-950">
      <SEO title="Settings" description="Manage your Foresight profile, linked accounts, and preferences." path="/settings" />
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-500 text-sm">
            Manage your profile and linked accounts
          </p>
        </div>

        {/* Profile Section */}
        <div className="card p-6 rounded-xl mb-6">
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-800">
            <User size={28} weight="bold" className="text-gold-400" />
            <h2 className="text-lg font-semibold text-white">Profile</h2>
          </div>

          {/* Avatar */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-white text-2xl font-bold shadow-soft-lg overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} weight="bold" />
                )}
              </div>
              <div className="flex-1">
                {isEditingAvatar ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      placeholder="Enter image URL..."
                      className="flex-1 px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gold-500 text-white"
                    />
                    <button
                      onClick={handleUpdateProfile}
                      disabled={savingProfile}
                      className="btn-primary px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={18} weight="bold" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAvatar(false);
                        setAvatarUrlInput(profile?.avatarUrl || '');
                      }}
                      className="btn-ghost px-4 py-2"
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingAvatar(true)}
                    className="btn-ghost px-4 py-2 flex items-center gap-2"
                  >
                    <Image size={18} weight="bold" />
                    Change Picture
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Username
            </label>
            {isEditingUsername ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username..."
                  className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gold-500 text-white"
                  maxLength={30}
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={savingProfile}
                  className="btn-primary px-6 py-3 flex items-center gap-2"
                >
                  <CheckCircle size={18} weight="bold" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingUsername(false);
                    setUsernameInput(profile?.username || '');
                  }}
                  className="btn-ghost px-4 py-3"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <span className="text-white font-medium">
                  {profile?.username || 'Not set'}
                </span>
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="text-gold-400 hover:text-gold-300 flex items-center gap-2"
                >
                  <PencilSimple size={18} weight="bold" />
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* XP & Level (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Level
              </label>
              <div className="px-4 py-3 bg-gold-500/10 rounded-lg border border-gold-500/30 flex items-center gap-3">
                <Star size={24} weight="fill" className="text-gold-400" />
                <span className="text-2xl font-bold text-gold-400">
                  {xpInfo.level}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Total XP
              </label>
              <div className="px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  {(profile?.xp || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="card p-6 rounded-xl mb-6">
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-800">
            <LinkIcon size={28} weight="bold" className="text-gold-400" />
            <h2 className="text-lg font-semibold text-white">Linked Accounts</h2>
          </div>

          <div className="space-y-3">
            {/* Wallet Row */}
            <LinkedAccountRow
              icon={<Wallet size={20} weight="bold" />}
              label="Solana Wallet"
              value={walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : undefined}
              isLinked={!!walletAddress}
              onLink={() => linkWallet()}
              onUnlink={() => handleUnlink('wallet')}
              canUnlink={linkedCount > 1}
              isUnlinking={unlinking === 'wallet'}
            />

            {/* Twitter Row */}
            <LinkedAccountRow
              icon={<XLogo size={20} weight="bold" />}
              label="Twitter"
              value={linkedTwitter ? `@${linkedTwitter}` : undefined}
              isLinked={!!linkedTwitter}
              onLink={() => linkTwitter()}
              onUnlink={() => handleUnlink('twitter')}
              canUnlink={linkedCount > 1}
              isUnlinking={unlinking === 'twitter'}
            />

            {/* Email Row */}
            <LinkedAccountRow
              icon={<Envelope size={20} weight="bold" />}
              label="Email"
              value={linkedEmail}
              isLinked={!!linkedEmail}
              onLink={() => linkEmail()}
              onUnlink={() => handleUnlink('email')}
              canUnlink={linkedCount > 1}
              isUnlinking={unlinking === 'email'}
            />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Link multiple methods so you can sign in any way. You must keep at least one linked.
          </p>
        </div>

        {/* Team Section */}
        {team && (
          <div className="card p-6 rounded-xl mb-6">
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-800">
              <Crown size={28} weight="bold" className="text-gold-400" />
              <h2 className="text-lg font-semibold text-white">Team</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Team Name
              </label>
              {isEditingTeamName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    placeholder="Enter team name..."
                    className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gold-500 text-white"
                    maxLength={50}
                  />
                  <button
                    onClick={handleUpdateTeamName}
                    disabled={savingTeam}
                    className="btn-primary px-6 py-3 flex items-center gap-2"
                  >
                    <CheckCircle size={18} weight="bold" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTeamName(false);
                      setTeamNameInput(team.team_name || '');
                    }}
                    className="btn-ghost px-4 py-3"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <span className="text-white font-medium text-lg">
                    {team.team_name}
                  </span>
                  <button
                    onClick={() => setIsEditingTeamName(true)}
                    className="text-gold-400 hover:text-gold-300 flex items-center gap-2"
                  >
                    <PencilSimple size={18} weight="bold" />
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4 text-sm text-gray-400">
              <p>Your team name appears in leaderboards and when competing with friends.</p>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card p-6 rounded-xl border border-red-900/30">
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-red-900/30">
            <Warning size={28} weight="bold" className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Sign Out
              </h3>
              <p className="text-gray-400 text-sm">
                You will be logged out and need to reconnect to access your account
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 font-bold flex items-center gap-2 transition-all"
            >
              <SignOut size={20} weight="bold" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Linked Account Row ─────────────────────────────────────────────── */

function LinkedAccountRow({
  icon,
  label,
  value,
  isLinked,
  onLink,
  onUnlink,
  canUnlink,
  isUnlinking,
  comingSoon,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isLinked: boolean;
  onLink: () => void;
  onUnlink: () => void;
  canUnlink: boolean;
  isUnlinking: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isLinked
            ? 'bg-gold-500/15 border-2 border-gold-500/40 text-gold-400'
            : 'bg-gray-800 border-2 border-gray-700 text-gray-500'
        }`}
      >
        {icon}
      </div>

      {/* Label + value */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className={`text-xs truncate ${isLinked ? 'text-gray-400' : 'text-gray-600'}`}>
          {isLinked ? value : 'Not linked'}
        </p>
      </div>

      {/* Action */}
      {isLinked ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium">
            <CheckCircle size={14} weight="bold" />
            Connected
          </span>
          {canUnlink && (
            <button
              onClick={onUnlink}
              disabled={isUnlinking}
              className="px-3 py-1 text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
            >
              {isUnlinking ? 'Unlinking...' : 'Unlink'}
            </button>
          )}
        </div>
      ) : comingSoon ? (
        <span className="px-3 py-1.5 text-xs text-gray-600 font-medium shrink-0">
          Coming soon
        </span>
      ) : (
        <button
          onClick={onLink}
          className="px-4 py-1.5 bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 rounded-lg text-gold-400 text-xs font-semibold transition-colors shrink-0"
        >
          Link
        </button>
      )}
    </div>
  );
}
