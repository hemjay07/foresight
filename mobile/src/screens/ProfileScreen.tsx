import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { useAuth } from '../providers/AuthProvider';
import { useForesightScore } from '../hooks/useForesightScore';
import { useQuestSummary } from '../hooks/useQuests';
import { useSKRBalance } from '../hooks/useSKR';
import { haptics } from '../utils/haptics';
import { truncateAddress, formatNumber } from '../utils/formatting';
import { TIER_CONFIG } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

const TIER_COLORS: Record<string, string> = {
  S: colors.tierS,
  A: colors.tierA,
  B: colors.tierB,
  C: colors.tierC,
};

function getTierColor(tier: string): string {
  const key = tier?.charAt(0).toUpperCase();
  return TIER_COLORS[key] || colors.textMuted;
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { data: fs, isLoading: fsLoading, refetch: refetchFS } = useForesightScore(isAuthenticated);
  const { data: quests } = useQuestSummary(isAuthenticated);
  const { data: skr, isLoading: skrLoading } = useSKRBalance(user?.walletAddress);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Guest mode — show login prompt
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestContainer}>
          <MaterialCommunityIcons name="account-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.guestTitle}>Your Profile</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to track your Foresight Score,{'\n'}manage teams, and claim prizes.
          </Text>
          <TouchableOpacity
            style={styles.guestCta}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestCtaText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), refetchFS()]);
    setRefreshing(false);
  }, [refreshUser, refetchFS]);

  const copyAddress = useCallback(async () => {
    if (!user?.walletAddress) return;
    await Clipboard.setStringAsync(user.walletAddress);
    haptics.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [user?.walletAddress]);

  const copyReferral = useCallback(async () => {
    if (!user?.referralCode) return;
    await Clipboard.setStringAsync(user.referralCode);
    haptics.success();
  }, [user?.referralCode]);

  const tierProgress = fs?.tierProgress;
  const tierColor = fs ? getTierColor(fs.tier) : colors.textMuted;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {user?.avatarUrl && !avatarError ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {user?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.username}>{user?.username ?? 'Anonymous'}</Text>
          <TouchableOpacity style={styles.addressRow} onPress={copyAddress} activeOpacity={0.7}>
            <Text style={styles.address}>
              {copied ? 'Copied!' : truncateAddress(user?.walletAddress ?? '', 6)}
            </Text>
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={14}
              color={copied ? colors.success : colors.textMuted}
            />
          </TouchableOpacity>
          {user?.isFoundingMember && user.foundingMemberNumber && (
            <View style={styles.founderBadge}>
              <MaterialCommunityIcons name="star-four-points" size={14} color={colors.brand} />
              <Text style={styles.founderText}>
                Founding Member #{user.foundingMemberNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Foresight Score Card */}
        {fsLoading && !fs ? (
          <View style={styles.scoreCard}>
            <View style={styles.skeletonLine40} />
            <View style={styles.skeletonLineLarge} />
            <View style={styles.skeletonLine60} />
            <View style={[styles.skeletonProgressBar, { marginTop: 14 }]} />
            <View style={[styles.skeletonLine40, { marginTop: 8 }]} />
          </View>
        ) : fs ? (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Foresight Score</Text>
            <Text style={styles.scoreValue}>{formatNumber(fs.totalScore)}</Text>
            <View style={styles.tierRow}>
              <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
              <Text style={[styles.tierName, { color: tierColor }]}>
                {TIER_CONFIG[fs.tier as keyof typeof TIER_CONFIG]?.label ?? fs.tier}
              </Text>
              {fs.multiplierActive && fs.effectiveMultiplier > 1 && (
                <View style={styles.multiBadge}>
                  <Text style={styles.multiBadgeText}>x{fs.effectiveMultiplier}</Text>
                </View>
              )}
            </View>
            {tierProgress && (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(tierProgress.progress * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {tierProgress.currentTier} {'\u2192'} {tierProgress.nextTier}
                  {'  \u00B7  '}
                  {formatNumber(tierProgress.fsToNextTier)} FS to go
                </Text>
              </>
            )}
            <Text style={styles.rankRow}>
              {fs.allTimeRank > 0 ? `#${formatNumber(fs.allTimeRank)}` : 'Unranked'} All-Time  {'\u00B7'}  {fs.seasonRank > 0 ? `#${formatNumber(fs.seasonRank)}` : 'Unranked'} Season
            </Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Season Score</Text>
            <Text style={styles.statValue}>{formatNumber(fs?.seasonScore ?? 0)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Week Score</Text>
            <Text style={styles.statValue}>{formatNumber(fs?.weekScore ?? 0)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>All-Time Rank</Text>
            <Text style={styles.statValue}>{(fs?.allTimeRank ?? 0) > 0 ? `#${formatNumber(fs!.allTimeRank)}` : '-'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Multiplier</Text>
            <Text style={styles.statValue}>
              {(fs?.effectiveMultiplier ?? 1) > 1 ? `${fs!.effectiveMultiplier}x` : 'None'}
            </Text>
          </View>
        </View>

        {/* Quests Summary */}
        {quests && (
          <View style={styles.questSection}>
            {quests.unclaimed > 0 && (
              <View style={styles.questBanner}>
                <Text style={styles.questBannerText}>
                  {'\uD83C\uDFAF'} {quests.unclaimed} quest reward{quests.unclaimed > 1 ? 's' : ''} to claim
                </Text>
              </View>
            )}
            <Text style={styles.questProgress}>
              {quests.daily.completed}/{quests.daily.total} Daily  {'\u00B7'}  {quests.weekly.completed}/{quests.weekly.total} Weekly
            </Text>
          </View>
        )}

        {/* SKR Status */}
        {skrLoading && !skr ? (
          <View style={styles.skrCard}>
            <View style={styles.skrLeft}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface }} />
              <View>
                <View style={styles.skeletonLine60} />
                <View style={[styles.skeletonLine40, { marginTop: 4 }]} />
              </View>
            </View>
            <View style={styles.skrRight}>
              <View style={styles.skeletonLine40} />
            </View>
          </View>
        ) : skr ? (
          <TouchableOpacity
            style={[styles.skrCard, { borderColor: skr.tierColor + '44' }]}
            onPress={() => navigation.navigate('SKR')}
            activeOpacity={0.7}
          >
            <View style={styles.skrLeft}>
              <MaterialCommunityIcons name="shield-star" size={24} color={skr.tierColor} />
              <View>
                <Text style={styles.skrTitle}>SKR Token</Text>
                <Text style={[styles.skrTier, { color: skr.tierColor }]}>{skr.tierLabel}</Text>
              </View>
            </View>
            <View style={styles.skrRight}>
              <Text style={styles.skrBalance}>{formatNumber(skr.balance)}</Text>
              {skr.fsMultiplier > 1 && (
                <Text style={styles.skrMulti}>{skr.fsMultiplier}x FS</Text>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionRow} onPress={copyReferral} activeOpacity={0.7}>
            <MaterialCommunityIcons name="gift-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.actionText}>Referral Code: {user?.referralCode ?? '---'}</Text>
            <MaterialCommunityIcons name="content-copy" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => { haptics.impact(); logout(); }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Sign Out</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BRAND_BG = 'rgba(245,158,11,0.12)';
const cardBase = { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder } as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: { backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: colors.black },
  username: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  address: { fontSize: 13, color: colors.textMuted },
  founderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    backgroundColor: BRAND_BG, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  founderText: { fontSize: 12, fontWeight: '600', color: colors.brand },
  scoreCard: {
    ...cardBase, marginHorizontal: 16, marginTop: 4,
    borderRadius: 12, padding: 20, alignItems: 'center',
  },
  scoreLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { fontSize: 40, fontWeight: '800', color: colors.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierName: { fontSize: 14, fontWeight: '600' },
  multiBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 6, marginLeft: 4,
  },
  multiBadgeText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  progressBar: {
    width: '100%', height: 6, backgroundColor: colors.surface,
    borderRadius: 3, marginTop: 14, overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  rankRow: { fontSize: 13, color: colors.textSecondary, marginTop: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 16, gap: 10 },
  statCard: { ...cardBase, width: '48%', flexGrow: 1, borderRadius: 8, padding: 14 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  questSection: { marginHorizontal: 16, marginTop: 16 },
  questBanner: { backgroundColor: BRAND_BG, borderRadius: 8, padding: 12, marginBottom: 8 },
  questBannerText: { fontSize: 14, fontWeight: '600', color: colors.brand, textAlign: 'center' },
  questProgress: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  skrCard: {
    ...cardBase, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16,
    borderRadius: 12, padding: 16, gap: 12,
  },
  skrLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  skrTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  skrTier: { fontSize: 12, fontWeight: '700' },
  skrRight: { alignItems: 'flex-end', marginRight: 4 },
  skrBalance: { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  skrMulti: { fontSize: 11, fontWeight: '600', color: colors.brand },
  actions: { ...cardBase, marginHorizontal: 16, marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  actionText: { flex: 1, fontSize: 14, color: colors.text },
  separator: { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: 16 },
  // Guest mode
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  guestSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  guestCta: {
    backgroundColor: colors.brand, paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 12, marginTop: 16,
  },
  guestCtaText: { color: colors.background, fontSize: 16, fontWeight: '700' },

  // Skeleton styles
  skeletonLine40: { height: 12, width: '40%', borderRadius: 6, backgroundColor: colors.surface },
  skeletonLine60: { height: 12, width: '60%', borderRadius: 6, backgroundColor: colors.surface },
  skeletonLineLarge: { height: 32, width: '50%', borderRadius: 8, backgroundColor: colors.surface, marginTop: 8, alignSelf: 'center' as const },
  skeletonProgressBar: { height: 6, width: '100%', borderRadius: 3, backgroundColor: colors.surface },
});
