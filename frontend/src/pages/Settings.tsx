/**
 * Settings Page
 * User profile and account settings
 */

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  User, SignOut, CheckCircle, Warning, Sparkle, Crown, Image,
  PencilSimple, X, TwitterLogo, Link as LinkIcon, LinkBreak,
  ShieldCheck, ArrowSquareOut, Spinner
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { getXPLevel, getLevelBadge, getLevelColors } from '../utils/xp';

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

interface TwitterStatus {
  configured: boolean;
  connected: boolean;
  handle: string | null;
  followers: number;
  connectedAt: string | null;
  followsForesight: boolean;
  lastVerifiedAt: string | null;
}

interface Team {
  id: number;
  team_name: string;
  total_score: number;
}

export default function Settings() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Twitter OAuth state
  const [twitterStatus, setTwitterStatus] = useState<TwitterStatus | null>(null);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [verifyingFollow, setVerifyingFollow] = useState(false);
  const [tweetUrl, setTweetUrl] = useState('');
  const [verifyingTweet, setVerifyingTweet] = useState(false);

  // Edit states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingTwitter, setIsEditingTwitter] = useState(false);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  // Form values
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [twitterHandleInput, setTwitterHandleInput] = useState('');
  const [teamNameInput, setTeamNameInput] = useState('');

  // Saving states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);

  const [disconnecting, setDisconnecting] = useState(false);

  // Handle Twitter OAuth callback
  useEffect(() => {
    const twitterParam = searchParams.get('twitter');
    const handleParam = searchParams.get('handle');
    const messageParam = searchParams.get('message');

    if (twitterParam === 'success') {
      showToast('success', `Twitter connected: @${handleParam}`);
      // Clear the URL params
      setSearchParams({});
      // Refresh Twitter status
      fetchTwitterStatus();
    } else if (twitterParam === 'error') {
      const errorMessages: Record<string, string> = {
        'access_denied': 'Twitter authorization was cancelled',
        'token_exchange_failed': 'Failed to connect Twitter. Please try again.',
        'user_info_failed': 'Failed to get Twitter profile. Please try again.',
        'invalid_state': 'Session expired. Please try again.',
        'missing_params': 'Invalid callback. Please try again.',
      };
      showToast('error', errorMessages[messageParam || ''] || 'Twitter connection failed');
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchTwitterStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/twitter/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setTwitterStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching Twitter status:', error);
    }
  };

  const handleConnectTwitter = async () => {
    try {
      setTwitterLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.get(`${API_URL}/api/twitter/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data.authUrl) {
        // Redirect to Twitter OAuth
        window.location.href = response.data.data.authUrl;
      }
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to start Twitter connection';
      showToast('error', errorMsg);
      setTwitterLoading(false);
    }
  };

  const handleDisconnectTwitter = async () => {
    try {
      setTwitterLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.post(
        `${API_URL}/api/twitter/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('success', 'Twitter disconnected');
      setTwitterStatus(null);
      await fetchTwitterStatus();
    } catch (error) {
      showToast('error', 'Failed to disconnect Twitter');
    } finally {
      setTwitterLoading(false);
    }
  };

  const handleVerifyFollow = async () => {
    try {
      setVerifyingFollow(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${API_URL}/api/twitter/verify-follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (response.data.data.followsForesight) {
          showToast('success', 'Follow verified! Quest completed.');
        } else {
          showToast('error', 'You are not following @ForesightCT yet');
        }
        await fetchTwitterStatus();
      }
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to verify follow';
      showToast('error', errorMsg);
    } finally {
      setVerifyingFollow(false);
    }
  };

  const handleVerifyTweet = async () => {
    if (!tweetUrl.trim()) {
      showToast('error', 'Please enter a tweet URL');
      return;
    }

    try {
      setVerifyingTweet(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${API_URL}/api/twitter/verify-tweet`,
        { tweetUrl: tweetUrl.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('success', 'Tweet verified! Quest completed.');
        setTweetUrl('');
      }
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to verify tweet';
      showToast('error', errorMsg);
    } finally {
      setVerifyingTweet(false);
    }
  };

  useEffect(() => {
    // Don't redirect if we're in the middle of disconnecting
    if (disconnecting) return;

    if (isConnected && address) {
      fetchUserData();
    }
  }, [isConnected, address, disconnecting]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const profileResponse = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileResponse.data);
      setUsernameInput(profileResponse.data.username || '');
      setAvatarUrlInput(profileResponse.data.avatarUrl || '');
      setTwitterHandleInput(profileResponse.data.twitterHandle || '');

      // Fetch Twitter status
      await fetchTwitterStatus();

      // Fetch user's team
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
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSavingProfile(true);
      const token = localStorage.getItem('authToken');

      const updates: { username?: string; avatarUrl?: string; twitterHandle?: string } = {};
      if (usernameInput !== profile?.username) updates.username = usernameInput;
      if (avatarUrlInput !== profile?.avatarUrl) updates.avatarUrl = avatarUrlInput;
      if (twitterHandleInput !== profile?.twitterHandle) updates.twitterHandle = twitterHandleInput;

      if (Object.keys(updates).length === 0) {
        showToast('error', 'No changes to save');
        return;
      }

      await axios.patch(
        `${API_URL}/api/users/profile`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('success', 'Profile updated successfully!');
      setIsEditingUsername(false);
      setIsEditingAvatar(false);
      setIsEditingTwitter(false);
      await fetchUserData();
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to update profile';
      showToast('error', errorMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateTeamName = async () => {
    try {
      setSavingTeam(true);
      const token = localStorage.getItem('authToken');

      if (teamNameInput === team?.team_name) {
        showToast('error', 'No changes to save');
        setIsEditingTeamName(false);
        return;
      }

      if (!teamNameInput || teamNameInput.trim().length < 3) {
        showToast('error', 'Team name must be at least 3 characters');
        return;
      }

      await axios.patch(
        `${API_URL}/api/league/team/name`,
        { team_name: teamNameInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('success', 'Team name updated successfully!');
      setIsEditingTeamName(false);
      await fetchUserData();
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to update team name';
      showToast('error', errorMsg);
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDisconnect = () => {
    setDisconnecting(true);
    localStorage.removeItem('authToken');
    disconnect();
    showToast('Wallet disconnected', 'success');
    // Navigate after a brief delay to ensure disconnect completes
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <User size={48} className="mx-auto mb-4 text-gray-600" />
        <h1 className="text-2xl font-bold text-white mb-2">Connect Wallet</h1>
        <p className="text-gray-400">Connect your wallet to access settings</p>
      </div>
    );
  }

  // Connected but no auth token
  const token = localStorage.getItem('authToken');
  if (!token && !loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <User size={48} className="mx-auto mb-4 text-gold-400" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 mb-4">Please sign in with your wallet to access settings</p>
        <p className="text-sm text-gray-500">The sign-in prompt should appear automatically. If not, try refreshing the page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Sparkle size={48} weight="bold" className="text-brand-400" />
          </div>
          <p className="text-gray-400 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  const xpInfo = getXPLevel(profile?.xp || 0);
  const colors = getLevelColors(xpInfo.level);
  const badge = getLevelBadge(xpInfo.level);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Settings
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="card p-8 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
            <User size={28} weight="bold" className="text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Profile</h2>
          </div>

          {/* Avatar */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-soft-lg overflow-hidden">
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
                      className="flex-1 px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-brand-500 text-white"
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
                  className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-brand-500 text-white"
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
                  className="text-brand-400 hover:text-brand-300 flex items-center gap-2"
                >
                  <PencilSimple size={18} weight="bold" />
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Twitter Handle (Manual - for display) */}
          {!twitterStatus?.connected && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Twitter Handle (Display Only)
              </label>
              {isEditingTwitter ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center">
                    <span className="px-4 py-3 bg-gray-800 border-2 border-gray-700 border-r-0 rounded-l-lg text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      value={twitterHandleInput}
                      onChange={(e) => setTwitterHandleInput(e.target.value)}
                      placeholder="username"
                      className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-r-lg focus:outline-none focus:border-brand-500 text-white"
                      maxLength={15}
                    />
                  </div>
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
                      setIsEditingTwitter(false);
                      setTwitterHandleInput(profile?.twitterHandle || '');
                    }}
                    className="btn-ghost px-4 py-3"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <span className="text-white font-medium">
                    {profile?.twitterHandle ? `@${profile.twitterHandle}` : 'Not set'}
                  </span>
                  <button
                    onClick={() => setIsEditingTwitter(true)}
                    className="text-brand-400 hover:text-brand-300 flex items-center gap-2"
                  >
                    <PencilSimple size={18} weight="bold" />
                    Edit
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Connect Twitter below for verified status and quest completion
              </p>
            </div>
          )}

          {/* Wallet Address (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Wallet Address
            </label>
            <div className="px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800 font-mono text-gray-300 text-sm">
              {address}
            </div>
          </div>

          {/* XP & Level (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Level
              </label>
              <div className={`px-4 py-3 bg-gradient-to-r ${colors.gradient} rounded-lg border border-gray-700 flex items-center gap-3`}>
                <span className="text-3xl">{badge}</span>
                <span className={`text-2xl font-bold ${colors.text}`}>
                  {xpInfo.level}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Total XP
              </label>
              <div className="px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <span className="text-2xl font-bold text-white">
                  {(profile?.xp || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Twitter Connection Section */}
        <div className="card p-8 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
            <TwitterLogo size={28} weight="bold" className="text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Twitter Connection</h2>
            {twitterStatus?.connected && (
              <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium">
                <ShieldCheck size={16} weight="bold" />
                Verified
              </span>
            )}
          </div>

          {!twitterStatus?.configured ? (
            // Twitter not configured on backend
            <div className="text-center py-8">
              <TwitterLogo size={48} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Twitter integration is being set up. Connect your Twitter to verify follows and complete quests.
              </p>
            </div>
          ) : twitterStatus?.connected ? (
            // Connected state
            <div>
              {/* Connected Twitter Info */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <TwitterLogo size={28} weight="bold" className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">@{twitterStatus.handle}</span>
                    <a
                      href={`https://twitter.com/${twitterStatus.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-cyan-400"
                    >
                      <ArrowSquareOut size={18} />
                    </a>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {twitterStatus.followers.toLocaleString()} followers
                  </p>
                </div>
              </div>

              {/* Follow Verification */}
              <div className="mb-6 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold mb-1">Follow @ForesightCT</h4>
                    <p className="text-gray-400 text-sm">
                      {twitterStatus.followsForesight
                        ? 'You are following us!'
                        : 'Follow us to complete the quest'}
                    </p>
                  </div>
                  {twitterStatus.followsForesight ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg text-emerald-400 font-medium">
                      <CheckCircle size={20} weight="bold" />
                      Verified
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href="https://twitter.com/intent/follow?screen_name=ForesightCT"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium flex items-center gap-2"
                      >
                        <TwitterLogo size={18} weight="bold" />
                        Follow
                      </a>
                      <button
                        onClick={handleVerifyFollow}
                        disabled={verifyingFollow}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center gap-2"
                      >
                        {verifyingFollow ? (
                          <Spinner size={18} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={18} weight="bold" />
                        )}
                        Verify
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tweet Verification */}
              <div className="mb-6 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                <h4 className="text-white font-semibold mb-1">Tweet About Foresight</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Share Foresight on Twitter and paste your tweet URL to complete the weekly quest
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                    placeholder="https://twitter.com/you/status/123..."
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleVerifyTweet}
                    disabled={verifyingTweet || !tweetUrl.trim()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2"
                  >
                    {verifyingTweet ? (
                      <Spinner size={18} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={18} weight="bold" />
                    )}
                    Verify Tweet
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tweet must mention "Foresight", "@ForesightCT", or "CT Draft"
                </p>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnectTwitter}
                disabled={twitterLoading}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium flex items-center gap-2"
              >
                {twitterLoading ? (
                  <Spinner size={18} className="animate-spin" />
                ) : (
                  <LinkBreak size={18} weight="bold" />
                )}
                Disconnect Twitter
              </button>
            </div>
          ) : (
            // Not connected state
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <TwitterLogo size={40} weight="bold" className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Connect Your Twitter</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                Link your Twitter account to verify follows, complete quests, and show your CT credentials.
              </p>
              <button
                onClick={handleConnectTwitter}
                disabled={twitterLoading}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-bold flex items-center gap-2 mx-auto"
              >
                {twitterLoading ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <LinkIcon size={20} weight="bold" />
                )}
                Connect Twitter
              </button>
            </div>
          )}
        </div>

        {/* Team Section */}
        {team && (
          <div className="card p-8 mb-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
              <Crown size={28} weight="bold" className="text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Team</h2>
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
                    className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-brand-500 text-white"
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
                    className="text-brand-400 hover:text-brand-300 flex items-center gap-2"
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
        <div className="card p-8 border-2 border-red-900/30">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-red-900/30">
            <Warning size={28} weight="bold" className="text-red-400" />
            <h2 className="text-2xl font-bold text-white">Danger Zone</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Disconnect Wallet
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
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
