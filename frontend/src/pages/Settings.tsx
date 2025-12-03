/**
 * Settings Page
 * User profile and account settings
 */

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, SignOut, CheckCircle, Warning, Sparkle, Crown, Image,
  PencilSimple, X
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

interface Team {
  id: number;
  team_name: string;
  total_score: number;
}

export default function Settings() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      navigate('/');
    }
  }, [isConnected, address, navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/');
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

      // Fetch user's team
      try {
        const teamResponse = await axios.get(`${API_URL}/api/league/team/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamResponse.data.team) {
          setTeam(teamResponse.data.team);
          setTeamNameInput(teamResponse.data.team.team_name || '');
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
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

      const updates: any = {};
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update team name';
      showToast('error', errorMsg);
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    localStorage.removeItem('authToken');
    showToast('success', 'Wallet disconnected');
    navigate('/');
  };

  if (!isConnected) {
    return null;
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

          {/* Twitter Handle */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Twitter Handle
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
          </div>

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
