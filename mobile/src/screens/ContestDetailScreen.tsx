import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../constants/colors';
import { useAuth } from '../providers/AuthProvider';
import { useContestLeaderboard, useActiveContests } from '../hooks/useContests';
import { useMyEntry } from '../hooks/useMyEntry';
import { formatNumber, timeUntil } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import { LiveDot } from '../components/LiveDot';
import type { LeaderboardEntry } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, 'ContestDetail'>;

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

// --- Contest Header Card ---

function ContestHeaderCard({
  contest,
  totalEntries,
}: {
  contest: { name: string; status: string; endDate: string; prizePool: number };
  totalEntries: number;
}) {
  const isLive = contest.status === 'active' || contest.status === 'live';
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
          <Text style={styles.prizeValue}>◎ {contest.prizePool} SOL</Text>
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
  const rankColor = RANK_COLORS[entry.rank] ?? colors.text;
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDraft = () => {
    haptics.impact();
    if (!isAuthenticated) {
      navigation.navigate('Auth' as any);
      return;
    }
    if (hasEntered) {
      // Already entered — scroll to their entry in leaderboard
      // (Don't open blank draft screen)
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
            <View style={{ width: '70%', height: 20, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 12 }} />
            <View style={{ width: 60, height: 24, borderRadius: 6, backgroundColor: colors.surface, marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: colors.surface, marginBottom: 6 }} />
                <View style={{ width: '70%', height: 20, borderRadius: 6, backgroundColor: colors.surface }} />
              </View>
              <View style={styles.statDivider} />
              <View style={{ flex: 1 }}>
                <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: colors.surface, marginBottom: 6 }} />
                <View style={{ width: '40%', height: 20, borderRadius: 6, backgroundColor: colors.surface }} />
              </View>
            </View>
          </View>
          {/* Skeleton action button */}
          <View style={{ height: 52, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 24 }} />
          {/* Skeleton leaderboard rows */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={{ width: 28, height: 16, borderRadius: 4, backgroundColor: colors.surface }} />
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, marginLeft: 4, marginRight: 12 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ width: '50%', height: 14, borderRadius: 7, backgroundColor: colors.surface }} />
              </View>
              <View style={{ width: 50, height: 14, borderRadius: 7, backgroundColor: colors.surface }} />
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
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textMuted} />
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
            {justEntered && (
              <View style={styles.successBanner}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                <Text style={styles.successBannerText}>You're in! Good luck.</Text>
              </View>
            )}

            {/* Action Button */}
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Header Card
  headerCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  contestName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 16,
  },

  // Action Button
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  actionButtonPrimary: {
    backgroundColor: colors.brand,
  },
  actionButtonSecondary: {
    backgroundColor: colors.cyan,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: colors.background,
  },
  actionButtonTextSecondary: {
    color: colors.background,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },

  // Entry Row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  entryRowHighlighted: {
    borderColor: colors.brand,
    borderWidth: 1.5,
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
  entryInfo: {
    flex: 1,
    marginRight: 8,
  },
  entryUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  teamName: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  entryScore: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // Empty State
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Skeleton
  skeletonRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
