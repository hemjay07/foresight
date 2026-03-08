import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, elevation, textLevels, borders, RANK_COLORS, brandAlpha, successAlpha } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, TOUCH_MIN } from '../constants/spacing';
import { useAuth } from '../providers/AuthProvider';
import { LiveDot } from '../components/LiveDot';
import { useActiveContests } from '../hooks/useContests';
import { useFSLeaderboard } from '../hooks/useForesightScore';
import { formatNumber, timeUntil, getAvatarColor } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import type { Contest, LeaderboardEntry } from '../types';
import { TIER_CONFIG } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingTip } from '../components/OnboardingTip';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'contests' | 'leaderboard';
type LeaderboardType = 'season' | 'all_time' | 'weekly';

const LEADERBOARD_CHIPS: { key: LeaderboardType; label: string }[] = [
  { key: 'season', label: 'Season' },
  { key: 'all_time', label: 'All-Time' },
  { key: 'weekly', label: 'Weekly' },
];

// --- ContestCard ---

const ContestCard = React.memo(function ContestCard({
  contest,
  onPress,
}: {
  contest: Contest;
  onPress: () => void;
}) {
  const isLive = contest.status === 'active' || contest.status === 'live' || contest.status === 'open';
  const countdown = timeUntil(contest.endDate);

  return (
    <TouchableOpacity
      style={styles.contestCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contestCardTop}>
        <Text style={styles.contestName} numberOfLines={1}>
          {contest.name}
        </Text>
        {isLive ? (
          <View style={styles.liveBadge}>
            <LiveDot />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        ) : (
          <Text style={styles.countdownText}>{countdown}</Text>
        )}
      </View>

      <Text style={styles.prizePool}>
        {contest.prizePoolFormatted ?? `◎ ${contest.prizePool} SOL`}
      </Text>

      <View style={styles.contestCardBottom}>
        <Text style={styles.playerCount}>
          {formatNumber(contest.playerCount)} players
        </Text>
        {contest.isFree || !contest.entryFee ? (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        ) : (
          <View style={styles.feeBadge}>
            <Text style={styles.feeBadgeText}>◎{contest.entryFee}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// --- LeaderboardRow ---

const LeaderboardRow = React.memo(function LeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) {
  const isTop3 = entry.rank <= 3;
  const rankColor = RANK_COLORS[entry.rank] ?? textLevels.primary;
  const borderColor = RANK_COLORS[entry.rank];
  const initial = (entry.username?.[0] ?? '?').toUpperCase();
  const avatarBg = getAvatarColor(entry.username ?? 'unknown');

  const tier = entry.tier ? TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] : null;

  return (
    <View
      style={[
        styles.leaderboardRow,
        isTop3 && borderColor
          ? { borderLeftWidth: 3, borderLeftColor: borderColor }
          : null,
        isCurrentUser && { backgroundColor: brandAlpha['8'], borderLeftWidth: 3, borderLeftColor: colors.brand },
      ]}
    >
      <Text
        style={[
          styles.rankNumber,
          { color: rankColor },
        ]}
      >
        {entry.rank}
      </Text>

      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.leaderboardInfo}>
        <View style={styles.usernameRow}>
          <Text style={styles.username} numberOfLines={1}>
            {entry.username}
          </Text>
          {isCurrentUser && (
            <View style={{ backgroundColor: colors.brand, borderRadius: spacing.xs, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: colors.background, fontSize: 9, fontWeight: '800' }}>YOU</Text>
            </View>
          )}
          {tier && (
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: tier.bg },
              ]}
            >
              <Text style={[styles.tierBadgeText, { color: tier.color }]}>
                {tier.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.score}>
        {formatNumber(entry.totalScore)}
      </Text>
    </View>
  );
});

// --- EmptyContests ---

function EmptyContests() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏆</Text>
      <Text style={styles.emptyTitle}>No active contests</Text>
      <Text style={styles.emptySubtitle}>
        Check back soon for new competitions
      </Text>
    </View>
  );
}

// --- Main Screen ---

export default function CompeteScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('contests');
  const [lbType, setLbType] = useState<LeaderboardType>('season');

  const {
    data: contests = [],
    isLoading: contestsLoading,
    refetch: refetchContests,
  } = useActiveContests();

  const {
    data: leaderboardData,
    isLoading: lbLoading,
    refetch: refetchLeaderboard,
  } = useFSLeaderboard(lbType);

  const [refreshing, setRefreshing] = useState(false);
  const competeTip = useOnboarding('compete_hint');

  const { width: screenWidth } = useWindowDimensions();
  const tabWidth = (screenWidth - (spacing.lg + spacing.xs) * 2) / 2;
  const underlineX = useSharedValue(0);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
    width: tabWidth,
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    if (activeTab === 'contests') {
      await refetchContests();
    } else {
      await refetchLeaderboard();
    }
    setRefreshing(false);
  }, [activeTab, refetchContests, refetchLeaderboard]);

  const handleTabChange = (tab: Tab) => {
    if (tab !== activeTab) {
      haptics.selection();
      setActiveTab(tab);
      underlineX.value = withTiming(tab === 'contests' ? 0 : tabWidth, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const handleContestPress = useCallback((contestId: string) => {
    haptics.light();
    navigation.navigate('ContestDetail', { contestId });
  }, [navigation]);

  const renderContestItem = useCallback(
    ({ item, index }: { item: Contest; index: number }) => (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 250)).duration(300)}>
        <ContestCard
          contest={item}
          onPress={() => handleContestPress(item.id)}
        />
      </Animated.View>
    ),
    [handleContestPress],
  );

  const currentUserId = user?.id;
  const renderLeaderboardItem = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 250)).duration(300)}>
        <LeaderboardRow entry={item} isCurrentUser={item.userId === currentUserId} />
      </Animated.View>
    ),
    [currentUserId],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compete</Text>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabChange('contests')}
          >
            <Text style={[styles.tabText, activeTab === 'contests' && styles.tabTextActive]}>
              Contests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabChange('leaderboard')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabTrack}>
          <Animated.View style={[styles.tabUnderline, underlineStyle]} />
        </View>
      </View>

      {competeTip.visible && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <OnboardingTip
            icon="trophy"
            title="Contests & Leaderboards"
            message="Join contests to draft CT teams and compete for SOL prizes. Check the leaderboard to see how you rank."
            onDismiss={competeTip.dismiss}
          />
        </View>
      )}

      {/* Contests Tab */}
      {activeTab === 'contests' && (
        <>
          {contestsLoading && !refreshing ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.skeletonContestCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: elevation.elevated }} />
                    <View style={{ width: 50, height: 20, borderRadius: 6, backgroundColor: elevation.elevated }} />
                  </View>
                  <View style={{ width: '40%', height: 20, borderRadius: 6, backgroundColor: elevation.elevated, marginBottom: spacing.md }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '30%', height: 12, borderRadius: 6, backgroundColor: elevation.elevated }} />
                    <View style={{ width: 50, height: 20, borderRadius: 6, backgroundColor: elevation.elevated }} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={contests}
              keyExtractor={(item) => item.id}
              renderItem={renderContestItem}
              contentContainerStyle={[
                styles.listContent,
                contests.length === 0 && styles.listContentEmpty,
              ]}
              ListEmptyComponent={EmptyContests}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.brand}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <>
          {/* Type selector chips */}
          <View style={styles.chipRow}>
            {LEADERBOARD_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.chip,
                  lbType === chip.key && styles.chipActive,
                ]}
                onPress={() => {
                  haptics.selection();
                  setLbType(chip.key);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    lbType === chip.key && styles.chipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {lbLoading && !refreshing ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.skeletonLeaderboardRow}>
                  <View style={{ width: 28, height: 16, borderRadius: spacing.xs, backgroundColor: elevation.elevated }} />
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: elevation.elevated, marginLeft: spacing.xs }} />
                  <View style={{ flex: 1, marginLeft: spacing.md, gap: 6 }}>
                    <View style={{ width: '50%', height: 14, borderRadius: 7, backgroundColor: elevation.elevated }} />
                  </View>
                  <View style={{ width: 50, height: 14, borderRadius: 7, backgroundColor: elevation.elevated }} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={leaderboardData?.entries ?? []}
              keyExtractor={(item) => `${item.rank}-${item.userId}`}
              renderItem={renderLeaderboardItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyTitle}>No rankings yet</Text>
                  <Text style={styles.emptySubtitle}>Enter a contest to appear on the leaderboard</Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.brand}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    fontWeight: '800',
    color: textLevels.primary,
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: spacing.lg + spacing.xs,
    marginBottom: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
  },
  tabTrack: {
    height: 2,
    backgroundColor: borders.subtle,
  },
  tabUnderline: {
    height: 2,
    backgroundColor: colors.brand,
  },
  tabText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: textLevels.muted,
  },
  tabTextActive: {
    color: colors.brand,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  listContentEmpty: {
    flex: 1,
  },

  // Contest Card
  contestCard: {
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  contestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contestName: {
    ...typography.body,
    fontWeight: '700',
    color: textLevels.primary,
    flex: 1,
    marginRight: spacing.md,
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
    marginRight: 5,
  },
  liveBadgeText: {
    ...typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  countdownText: {
    ...typography.mono,
    fontSize: 13,
    color: textLevels.secondary,
  },
  prizePool: {
    ...typography.monoLg,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.brand,
    marginBottom: spacing.md,
  },
  contestCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerCount: {
    ...typography.bodySm,
    fontSize: 13,
    color: textLevels.secondary,
  },
  freeBadge: {
    backgroundColor: successAlpha['15'],
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  freeBadgeText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.success,
  },
  feeBadge: {
    backgroundColor: brandAlpha['15'],
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  feeBadgeText: {
    ...typography.mono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['3xl'] + spacing.md,
  },
  emptyIcon: {
    fontSize: spacing['3xl'],
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: textLevels.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: textLevels.muted,
  },

  // Leaderboard chips
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: elevation.elevated,
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.brand,
  },
  chipText: {
    ...typography.bodySm,
    fontSize: 13,
    fontWeight: '600',
    color: textLevels.secondary,
  },
  chipTextActive: {
    color: colors.background,
  },

  // Leaderboard Row
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: TOUCH_MIN,
  },
  rankNumber: {
    width: spacing['2xl'],
    ...typography.mono,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
  leaderboardInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    ...typography.bodySm,
    fontWeight: '600',
    color: textLevels.primary,
    flexShrink: 1,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.xs,
  },
  tierBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
  },
  score: {
    ...typography.mono,
    fontSize: 15,
    fontWeight: '700',
    color: textLevels.primary,
  },

  // Skeleton loading
  skeletonList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skeletonContestCard: {
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonLeaderboardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
