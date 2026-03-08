import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, elevation, textLevels, borders, RANK_COLORS, successAlpha, brandAlpha } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, TOUCH_MIN } from '../constants/spacing';
import { useAuth } from '../providers/AuthProvider';
import { useContestLeaderboard, useActiveContests } from '../hooks/useContests';
import { useMyEntry } from '../hooks/useMyEntry';
import { formatNumber, timeUntil, getAvatarColor } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import { LiveDot } from '../components/LiveDot';
import type { LeaderboardEntry } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, 'ContestDetail'>;

// --- Contest Header Card ---

function ContestHeaderCard({
  contest,
  totalEntries,
}: {
  contest: { name: string; status: string; endDate: string; prizePool: number };
  totalEntries: number;
}) {
  const isLive = contest.status === 'active' || contest.status === 'live' || contest.status === 'open';
  const countdown = timeUntil(contest.endDate);

  return (
    <View style={styles.headerCard}>
      <Text style={styles.contestName}>{contest.name}</Text>

      <View style={styles.statusRow}>
        {isLive ? (
          <View style={styles.liveBadge}>
            <LiveDot />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{countdown}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Prize Pool</Text>
          <Text style={styles.prizeValue}>{(contest as any).prizePoolFormatted ?? `◎ ${contest.prizePool} SOL`}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Players</Text>
          <Text style={styles.statValue}>{formatNumber(totalEntries)}</Text>
        </View>
      </View>
    </View>
  );
}

// --- Leaderboard Entry Row ---

function EntryRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const rankColor = RANK_COLORS[entry.rank] ?? textLevels.primary;
  const initial = (entry.username?.[0] ?? '?').toUpperCase();
  const avatarBg = getAvatarColor(entry.username ?? 'unknown');

  return (
    <View
      style={[
        styles.entryRow,
        isCurrentUser && styles.entryRowHighlighted,
      ]}
    >
      <Text style={[styles.rankNumber, { color: rankColor }]}>
        {entry.rank}
      </Text>

      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.entryInfo}>
        <Text style={styles.entryUsername} numberOfLines={1}>
          {entry.username}
        </Text>
        {entry.teamName ? (
          <Text style={styles.teamName} numberOfLines={1}>
            {entry.teamName}
          </Text>
        ) : null}
      </View>

      <Text style={styles.entryScore}>
        {formatNumber(entry.totalScore)}
      </Text>
    </View>
  );
}

// --- Main Screen ---

export default function ContestDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { contestId } = route.params;
  const justEntered = (route.params as any)?.justEntered ?? false;
  const { isAuthenticated, user } = useAuth();

  const {
    data: leaderboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useContestLeaderboard(contestId);

  // Pull contest metadata from the active contests list (lightweight approach)
  const { data: contests = [] } = useActiveContests();
  const contest = contests.find((c) => c.id === contestId);

  const [refreshing, setRefreshing] = useState(false);
  const [showMyTeam, setShowMyTeam] = useState(false);
  const [showBanner, setShowBanner] = useState(justEntered);

  // Auto-dismiss success banner after 5s
  useEffect(() => {
    if (showBanner) {
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showBanner]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShare = async () => {
    haptics.light();
    const name = contestMeta.name;
    const prize = contestMeta.prizePool;
    try {
      await Share.share({
        message: `Join "${name}" on CT Foresight! ◎${prize} SOL prize pool. Draft your CT dream team and compete.\n\nhttps://ct-foresight.xyz/contest/${contestId}`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleDraft = () => {
    haptics.impact();
    if (!isAuthenticated) {
      navigation.navigate('Auth', { returnTo: 'Draft', returnParams: { contestId } });
      return;
    }
    if (hasEntered) {
      haptics.selection();
      setShowMyTeam((v) => !v);
      return;
    }
    navigation.navigate('Draft', { contestId });
  };

  const { data: myEntry } = useMyEntry(contestId, isAuthenticated);
  const hasEntered = myEntry?.hasEntry ?? false;

  const currentUserId = user?.id;
  const renderEntry = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <EntryRow entry={item} isCurrentUser={item.userId === currentUserId} />
    ),
    [currentUserId],
  );

  // Set dynamic header title
  const contestName = contest?.name;
  useEffect(() => {
    if (contestName) {
      navigation.setOptions({ title: contestName });
    }
  }, [contestName, navigation]);

  const lb = leaderboardData as any;
  const contestMeta = contest ?? {
    name: lb?.contestName ?? 'Contest',
    status: lb?.status ?? 'active',
    endDate: lb?.endDate ?? new Date().toISOString(),
    prizePool: lb?.prizePool ?? 0,
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.listContent}>
          {/* Skeleton header card */}
          <View style={styles.headerCard}>
            <View style={{ width: '70%', height: 20, borderRadius: spacing.sm, backgroundColor: elevation.elevated, marginBottom: spacing.md }} />
            <View style={{ width: 60, height: 24, borderRadius: 6, backgroundColor: elevation.elevated, marginBottom: spacing.lg }} />
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: elevation.elevated, marginBottom: 6 }} />
                <View style={{ width: '70%', height: 20, borderRadius: 6, backgroundColor: elevation.elevated }} />
              </View>
              <View style={styles.statDivider} />
              <View style={{ flex: 1 }}>
                <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: elevation.elevated, marginBottom: 6 }} />
                <View style={{ width: '40%', height: 20, borderRadius: 6, backgroundColor: elevation.elevated }} />
              </View>
            </View>
          </View>
          {/* Skeleton action button */}
          <View style={{ height: 52, borderRadius: spacing.md, backgroundColor: elevation.elevated, marginBottom: spacing.xl }} />
          {/* Skeleton leaderboard rows */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={{ width: 28, height: 16, borderRadius: spacing.xs, backgroundColor: elevation.elevated }} />
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: elevation.elevated, marginLeft: spacing.xs, marginRight: spacing.md }} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ width: '50%', height: 14, borderRadius: 7, backgroundColor: elevation.elevated }} />
              </View>
              <View style={{ width: 50, height: 14, borderRadius: 7, backgroundColor: elevation.elevated }} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={textLevels.muted} />
          <Text style={styles.errorTitle}>Failed to load contest</Text>
          <Text style={styles.errorSubtitle}>
            {(error as any)?.message?.includes('Network') ? 'Check your connection and try again' : 'Something went wrong'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { haptics.light(); refetch(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const entries = leaderboardData?.entries ?? [];
  const totalEntries = leaderboardData?.totalEntries ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => `${item.rank}-${item.userId}`}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
        ListHeaderComponent={
          <>
            {/* Contest Header Card */}
            <ContestHeaderCard
              contest={contestMeta}
              totalEntries={totalEntries}
            />

            {/* Success banner after entering */}
            {showBanner && (
              <View style={styles.successBanner}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                <Text style={styles.successBannerText}>You're in! Good luck.</Text>
              </View>
            )}

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  hasEntered ? styles.actionButtonSecondary : styles.actionButtonPrimary,
                ]}
                onPress={handleDraft}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    hasEntered ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
                  ]}
                >
                  {hasEntered ? `Entered: ${myEntry?.teamName ?? 'My Team'}` : 'Draft Your Team'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color={textLevels.primary} />
              </TouchableOpacity>
            </View>

            {/* My Team (expandable) */}
            {hasEntered && showMyTeam && (
              <View style={styles.myTeamSection}>
                <View style={styles.myTeamRow}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
                  <Text style={styles.myTeamHandle}>{myEntry?.teamName ?? 'My Team'}</Text>
                </View>
                <Text style={{ color: textLevels.secondary, ...typography.caption, marginTop: spacing.xs }}>
                  Your entry is locked in. Scores update live during the contest.
                </Text>
              </View>
            )}

            {/* Leaderboard Header */}
            {entries.length > 0 && (
              <Text style={styles.sectionTitle}>Leaderboard</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to draft a team
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: elevation.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Header Card
  headerCard: {
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  contestName: {
    ...typography.h1,
    fontWeight: '800',
    color: textLevels.primary,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: successAlpha['15'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  liveBadgeText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.success,
  },
  pendingBadge: {
    backgroundColor: elevation.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  pendingBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: textLevels.secondary,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
  },
  statLabel: {
    ...typography.label,
    color: textLevels.muted,
    marginBottom: spacing.xs,
  },
  prizeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand,
    fontVariant: ['tabular-nums'],
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: textLevels.primary,
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: borders.subtle,
    marginHorizontal: spacing.lg,
  },

  // Action Button
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: successAlpha['12'],
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.success,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    borderRadius: spacing.md,
    minHeight: TOUCH_MIN,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: spacing.md,
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.brand,
  },
  actionButtonSecondary: {
    backgroundColor: colors.cyan,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: elevation.base,
  },
  actionButtonTextSecondary: {
    color: elevation.base,
  },

  // Section
  sectionTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: textLevels.primary,
    marginBottom: spacing.md,
  },

  // Entry Row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_MIN,
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryRowHighlighted: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  rankNumber: {
    width: spacing['2xl'],
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
  },
  entryInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  entryUsername: {
    ...typography.bodySm,
    fontWeight: '600',
    color: textLevels.primary,
  },
  teamName: {
    ...typography.caption,
    color: textLevels.muted,
    marginTop: 2,
  },
  entryScore: {
    ...typography.mono,
    fontSize: 15,
    fontWeight: '700',
    color: textLevels.primary,
  },

  // Empty State
  emptyState: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '700',
    color: textLevels.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: textLevels.muted,
  },

  // Skeleton
  skeletonRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing['2xl'],
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.h2,
    fontWeight: '700' as const,
    color: textLevels.primary,
    marginTop: spacing.sm,
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: textLevels.muted,
    textAlign: 'center' as const,
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 10,
    minHeight: TOUCH_MIN,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  retryButtonText: {
    color: elevation.base,
    ...typography.bodySm,
    fontWeight: '700' as const,
  },
  myTeamSection: {
    backgroundColor: elevation.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: borders.subtle,
  },
  myTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  myTeamHandle: {
    ...typography.bodySm,
    color: textLevels.primary,
    fontWeight: '600',
  },
  captainLabel: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: brandAlpha['15'],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.xs,
    overflow: 'hidden',
  },
});
