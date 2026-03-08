import React, { useCallback, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../constants/colors';
import { useAuth } from '../providers/AuthProvider';
import { useForesightScore, useDailyStatus } from '../hooks/useForesightScore';
import { useActiveContests } from '../hooks/useContests';
import { useInfluencers } from '../hooks/useInfluencers';
import { useQuestSummary } from '../hooks/useQuests';
import { formatSOL, formatNumber, timeUntil } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Contest, Influencer } from '../types';
import { TIER_CONFIG } from '../types';
import { Avatar } from '../components/Avatar';
import { LiveDot } from '../components/LiveDot';
import { Skeleton } from '../components/Skeleton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Tier color mapping ───────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  S: '#F59E0B',
  A: '#06B6D4',
  B: '#10B981',
  C: '#71717A',
};

function getTierColor(tier: string): string {
  const key = tier?.charAt(0).toUpperCase();
  return TIER_COLORS[key] ?? colors.textMuted;
}

// ─── HomeScreen ───────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuth();
  const { data: score, isLoading: scoreLoading, refetch: refetchScore } = useForesightScore(isAuthenticated);
  const { data: daily, refetch: refetchDaily } = useDailyStatus(isAuthenticated);
  const { data: contests, isLoading: contestsLoading, isError: contestsError, refetch: refetchContests } = useActiveContests();
  const { data: influencerData, isError: influencersError, refetch: refetchInfluencers } = useInfluencers({ sortBy: 'points' });
  const { data: questSummary, refetch: refetchQuests } = useQuestSummary(isAuthenticated);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.impact();
    await Promise.all([refetchScore(), refetchDaily(), refetchContests(), refetchInfluencers(), refetchQuests()]);
    setRefreshing(false);
  }, [refetchScore, refetchDaily, refetchContests, refetchInfluencers, refetchQuests]);

  const heroContest = contests?.[0];
  const featuredInfluencers = influencerData?.influencers?.slice(0, 12) ?? [];
  const displayName = isAuthenticated ? (user?.username ?? 'Anon') : 'Explorer';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        {/* ── Header ────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandMark}>CT FORESIGHT</Text>
            <Text style={styles.greeting}>GM, {displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              haptics.selection();
              if (isAuthenticated) {
                (navigation as any).navigate('Main', { screen: 'Profile' });
              } else {
                navigation.navigate('Auth' as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarLetter}>{firstLetter}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Error Banner ──────────────────────── */}
        {(contestsError || influencersError) && (
          <TouchableOpacity
            style={styles.errorBanner}
            activeOpacity={0.8}
            onPress={onRefresh}
          >
            <MaterialCommunityIcons name="wifi-off" size={16} color={colors.brand} />
            <Text style={styles.errorBannerText}>
              Couldn't load some data. Tap to retry.
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Active Contest Hero ───────────────── */}
        {contestsLoading ? (
          <View style={styles.heroCard}>
            <Skeleton style={styles.skeletonLine80} />
            <Skeleton style={[styles.skeletonLine40, { marginBottom: 12 }]} />
            <Skeleton style={styles.skeletonLineLarge} />
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Skeleton style={styles.skeletonLine40} />
              <Skeleton style={styles.skeletonLine40} />
            </View>
            <Skeleton style={[styles.skeletonButton, { marginTop: 16 }]} />
          </View>
        ) : heroContest ? (
          <ContestHeroCard
            contest={heroContest}
            navigation={navigation}
            isAuthenticated={isAuthenticated}
            influencers={featuredInfluencers.slice(0, 5)}
          />
        ) : (
          <View style={styles.heroCard}>
            <MaterialCommunityIcons name="trophy-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>No active contests</Text>
            <Text style={styles.emptySubtext}>Check back soon for upcoming contests</Text>
          </View>
        )}

        {/* ── Guest Sign-In Banner ─────────────── */}
        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.signInBanner}
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              navigation.navigate('Auth' as any);
            }}
          >
            <View style={styles.signInIconWrap}>
              <MaterialCommunityIcons name="wallet" size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.signInBannerTitle}>Connect to compete</Text>
              <Text style={styles.signInBannerText}>
                Sign in to enter contests and win SOL & SKR prizes
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* ── Featured Influencers ────────────────── */}
        {featuredInfluencers.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Text style={styles.sectionLabel}>Who Will You Draft?</Text>
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  (navigation as any).navigate('Main', { screen: 'Compete' });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredInfluencers.map((inf) => (
                <InfluencerChip key={inf.id} influencer={inf} navigation={navigation} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Foresight Score ──────────────────── */}
        {isAuthenticated && (
          scoreLoading ? (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={styles.skeletonLine40} />
                <View style={[styles.skeletonLine40, { width: 80 }]} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 120, height: 32, borderRadius: 6, backgroundColor: colors.surface }} />
                <View style={{ width: 60, height: 24, borderRadius: 10, backgroundColor: colors.surface }} />
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface }} />
            </View>
          ) : score ? (
            <ForesightScoreCard score={score} />
          ) : null
        )}

        {/* ── Daily Activities ─────────────────── */}
        {isAuthenticated && daily && <DailyActivitiesRow daily={daily} />}

        {/* ── Quest Alert Banner ───────────────── */}
        {isAuthenticated && questSummary && questSummary.unclaimed > 0 && (
          <TouchableOpacity
            style={styles.questBanner}
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              (navigation as any).navigate('Main', { screen: 'Profile' });
            }}
          >
            <MaterialCommunityIcons name="gift" size={20} color={colors.brand} />
            <Text style={styles.questBannerText}>
              You have {questSummary.unclaimed} reward{questSummary.unclaimed > 1 ? 's' : ''} to claim!
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Contest Hero Card (Redesigned) ───────────────────────────────────
function ContestHeroCard({
  contest,
  navigation,
  isAuthenticated,
  influencers,
}: {
  contest: Contest;
  navigation: Nav;
  isAuthenticated: boolean;
  influencers: Influencer[];
}) {
  const isLive = contest.status === 'active' || contest.status === 'live';
  const countdown = !isLive ? timeUntil(contest.startDate) : null;

  return (
    <TouchableOpacity
      style={styles.heroCard}
      activeOpacity={0.9}
      onPress={() => {
        haptics.selection();
        navigation.navigate('ContestDetail', { contestId: contest.id });
      }}
    >
      {/* Accent edge */}
      <View style={styles.heroAccent} />

      {/* Top row: status + entry type */}
      <View style={styles.heroTopRow}>
        <View style={[styles.statusBadge, isLive ? styles.statusLive : styles.statusUpcoming]}>
          {isLive && <LiveDot />}
          <Text style={[styles.statusText, isLive && { color: colors.success }]}>
            {isLive ? 'LIVE NOW' : countdown}
          </Text>
        </View>
        {contest.isFree || !contest.entryFee ? (
          <View style={styles.freeEntryBadge}>
            <Text style={styles.freeEntryText}>FREE ENTRY</Text>
          </View>
        ) : (
          <Text style={styles.entryFeeText}>{formatSOL(contest.entryFee ?? 0)} SOL entry</Text>
        )}
      </View>

      {/* Contest name */}
      <Text style={styles.heroName} numberOfLines={2}>
        {contest.name}
      </Text>

      {/* Prize pool - THE dominant element */}
      <View style={styles.prizeBlock}>
        <Text style={styles.prizeLabel}>PRIZE POOL</Text>
        <View style={styles.prizeRow}>
          <Text style={styles.prizeAmount}>{formatSOL(contest.prizePool)}</Text>
          <Text style={styles.prizeCurrency}>SOL</Text>
        </View>
      </View>

      {/* Influencer preview faces */}
      {influencers.length > 0 && (
        <View style={styles.facesRow}>
          <View style={styles.faceStack}>
            {influencers.map((inf, i) => (
              <View
                key={inf.id}
                style={[
                  styles.faceCircle,
                  {
                    marginLeft: i > 0 ? -10 : 0,
                    zIndex: influencers.length - i,
                    borderColor: TIER_CONFIG[inf.tier].color,
                  },
                ]}
              >
                <Avatar
                  uri={inf.avatar}
                  name={inf.handle}
                  size={28}
                  borderColor={TIER_CONFIG[inf.tier].color}
                />
              </View>
            ))}
          </View>
          <Text style={styles.facesLabel}>
            {formatNumber(contest.playerCount)} teams competing
          </Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaButton}
        activeOpacity={0.75}
        onPress={() => {
          haptics.impact();
          if (!isAuthenticated) {
            navigation.navigate('Auth' as any);
            return;
          }
          navigation.navigate('Draft', { contestId: contest.id });
        }}
      >
        <MaterialCommunityIcons name="shield-sword" size={20} color={colors.black} />
        <Text style={styles.ctaText}>Draft Your Team</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Influencer Chip (Horizontal Scroll) ──────────────────────────────
function InfluencerChip({ influencer, navigation }: { influencer: Influencer; navigation: Nav }) {
  const tc = TIER_CONFIG[influencer.tier];
  return (
    <TouchableOpacity
      style={styles.infChip}
      activeOpacity={0.7}
      onPress={() => {
        haptics.selection();
        (navigation as any).navigate('Main', { screen: 'Compete' });
      }}
    >
      <View style={[styles.infChipAvatar, { borderColor: tc.color }]}>
        <Avatar uri={influencer.avatar} name={influencer.handle} size={52} borderColor={tc.color} borderWidth={2} />
      </View>
      <Text style={styles.infChipHandle} numberOfLines={1}>@{influencer.handle}</Text>
      <View style={[styles.infChipTier, { backgroundColor: tc.bg }]}>
        <Text style={[styles.infChipTierText, { color: tc.color }]}>{tc.label.charAt(0)}</Text>
      </View>
      <Text style={styles.infChipCost}>{influencer.price} cr</Text>
    </TouchableOpacity>
  );
}

// ─── Foresight Score Card ─────────────────────────────────────────────
function ForesightScoreCard({ score }: { score: NonNullable<ReturnType<typeof useForesightScore>['data']> }) {
  const tierColor = getTierColor(score.tier);
  const progress = score.tierProgress?.progress ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.scoreHeader}>
        <Text style={styles.cardLabel}>Foresight Score</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{score.allTimeRank} All-Time</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreNumber}>{score.totalScore.toLocaleString()}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColor + '22' }]}>
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
          <Text style={[styles.tierLabel, { color: tierColor }]}>
            {score.tierProgress?.currentTier ?? score.tier}
          </Text>
        </View>
      </View>

      {score.tierProgress?.nextTier && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: tierColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {score.tierProgress.fsToNextTier} FS to {score.tierProgress.nextTier}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Daily Activities Row ─────────────────────────────────────────────
function DailyActivitiesRow({ daily }: { daily: NonNullable<ReturnType<typeof useDailyStatus>['data']> }) {
  const activities = daily.activities ?? {};
  const activityList = [
    { key: 'browse_feed', label: 'Feed', icon: 'newspaper-variant' as const },
    { key: 'check_scores', label: 'Scores', icon: 'chart-line' as const },
    { key: 'daily_login', label: 'Login', icon: 'login' as const },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.dailyHeader}>
        <Text style={styles.cardLabel}>Daily Activities</Text>
        <Text style={styles.dailyCount}>
          {daily.completedCount}/{daily.totalPossible} Daily
        </Text>
      </View>
      <View style={styles.dailyRow}>
        {activityList.map((act) => {
          const done = activities[act.key] === true;
          return (
            <View key={act.key} style={styles.dailyItem}>
              <View
                style={[
                  styles.dailyCircle,
                  done ? styles.dailyCircleFilled : styles.dailyCircleOutline,
                ]}
              >
                <MaterialCommunityIcons
                  name={act.icon}
                  size={20}
                  color={done ? colors.black : colors.textMuted}
                />
              </View>
              <Text style={[styles.dailyLabel, done && { color: colors.text }]}>{act.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  brandMark: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: 2,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brand + '44',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand,
  },

  // Hero contest card
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brand,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    width: '100%',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusUpcoming: {
    backgroundColor: 'rgba(161, 161, 170, 0.15)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  freeEntryBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeEntryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  entryFeeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Prize block
  prizeBlock: {
    width: '100%',
    marginBottom: 20,
  },
  prizeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  prizeAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.brand,
    fontVariant: ['tabular-nums'],
    lineHeight: 48,
  },
  prizeCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand,
    opacity: 0.7,
  },

  // Influencer faces
  facesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  faceStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faceCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  faceImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  facesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.black,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand,
  },

  // Sign-in banner
  signInBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.brand + '33',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  signInIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brand + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  signInBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Featured influencers
  featuredSection: {
    marginBottom: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand,
  },
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  infChip: {
    width: 88,
    alignItems: 'center',
    gap: 6,
  },
  infChipAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infChipImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  infChipHandle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    maxWidth: 80,
    textAlign: 'center',
  },
  infChipTier: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  infChipTierText: {
    fontSize: 9,
    fontWeight: '800',
  },
  infChipCost: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Generic card
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Score card
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Daily activities
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dailyItem: {
    alignItems: 'center',
    gap: 8,
  },
  dailyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCircleFilled: {
    backgroundColor: colors.brand,
  },
  dailyCircleOutline: {
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  dailyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // Quest banner
  questBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  questBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
  },

  // Skeleton placeholders
  skeletonLine80: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  skeletonLine40: {
    width: '40%',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  skeletonLineLarge: {
    width: '50%',
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 16,
    alignSelf: 'flex-start' as const,
  },
  skeletonButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
});
