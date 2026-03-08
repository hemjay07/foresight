import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { LiveDot } from '../components/LiveDot';
import { useActiveContests } from '../hooks/useContests';
import { useFSLeaderboard } from '../hooks/useForesightScore';
import { formatNumber, timeUntil } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import type { Contest, LeaderboardEntry } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'contests' | 'leaderboard';
type LeaderboardType = 'season' | 'all_time' | 'weekly';

const LEADERBOARD_CHIPS: { key: LeaderboardType; label: string }[] = [
  { key: 'season', label: 'Season' },
  { key: 'all_time', label: 'All-Time' },
  { key: 'weekly', label: 'Weekly' },
];

const RANK_COLORS: Record<number, string> = {
  1: '#F59E0B',
  2: '#A1A1AA',
  3: '#CD7F32',
};

const AVATAR_COLORS = [
  '#F59E0B', '#06B6D4', '#10B981', '#F43F5E',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// --- ContestCard ---

function ContestCard({
  contest,
  onPress,
}: {
  contest: Contest;
  onPress: () => void;
}) {
  const isLive = contest.status === 'active' || contest.status === 'live';
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
        ◎ {contest.prizePool} SOL
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
}

// --- LeaderboardRow ---

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;
  const rankColor = RANK_COLORS[entry.rank] ?? colors.text;
  const borderColor = RANK_COLORS[entry.rank];
  const initial = (entry.username?.[0] ?? '?').toUpperCase();
  const avatarBg = getAvatarColor(entry.username ?? 'unknown');

  const tierConfig: Record<string, { color: string; label: string }> = {
    S: { color: '#F59E0B', label: 'S' },
    A: { color: '#06B6D4', label: 'A' },
    B: { color: '#10B981', label: 'B' },
    C: { color: '#71717A', label: 'C' },
  };

  const tier = entry.tier ? tierConfig[entry.tier] : null;

  return (
    <View
      style={[
        styles.leaderboardRow,
        isTop3 && borderColor
          ? { borderLeftWidth: 3, borderLeftColor: borderColor }
          : null,
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
          {tier && (
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: tier.color + '26' },
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
}

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
    }
  };

  const handleContestPress = useCallback((contestId: string) => {
    haptics.light();
    navigation.navigate('ContestDetail', { contestId });
  }, [navigation]);

  const renderContestItem = useCallback(
    ({ item }: { item: Contest }) => (
      <ContestCard
        contest={item}
        onPress={() => handleContestPress(item.id)}
      />
    ),
    [handleContestPress],
  );

  const renderLeaderboardItem = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <LeaderboardRow entry={item} />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compete</Text>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contests' && styles.tabActive]}
          onPress={() => handleTabChange('contests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'contests' && styles.tabTextActive,
            ]}
          >
            Contests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
          onPress={() => handleTabChange('leaderboard')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'leaderboard' && styles.tabTextActive,
            ]}
          >
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contests Tab */}
      {activeTab === 'contests' && (
        <>
          {contestsLoading && !refreshing ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.skeletonContestCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: colors.surface }} />
                    <View style={{ width: 50, height: 20, borderRadius: 6, backgroundColor: colors.surface }} />
                  </View>
                  <View style={{ width: '40%', height: 20, borderRadius: 6, backgroundColor: colors.surface, marginBottom: 12 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '30%', height: 12, borderRadius: 6, backgroundColor: colors.surface }} />
                    <View style={{ width: 50, height: 20, borderRadius: 6, backgroundColor: colors.surface }} />
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
                  <View style={{ width: 28, height: 16, borderRadius: 4, backgroundColor: colors.surface }} />
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, marginLeft: 4 }} />
                  <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
                    <View style={{ width: '50%', height: 14, borderRadius: 7, backgroundColor: colors.surface }} />
                  </View>
                  <View style={{ width: 50, height: 14, borderRadius: 7, backgroundColor: colors.surface }} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={leaderboardData?.entries ?? []}
              keyExtractor={(item) => `${item.rank}-${item.userId}`}
              renderItem={renderLeaderboardItem}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brand,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Contest Card
  contestCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contestName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  prizePool: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.brand,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  contestCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  feeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand,
    fontVariant: ['tabular-nums'],
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Leaderboard chips
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.brand,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.background,
  },

  // Leaderboard Row
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rankNumber: {
    width: 32,
    fontSize: 16,
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
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  leaderboardInfo: {
    flex: 1,
    marginRight: 8,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // Skeleton loading
  skeletonList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonContestCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  skeletonLeaderboardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});
