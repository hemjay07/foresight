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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, elevation, textLevels, borders, brandAlpha, successAlpha, mutedAlpha } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, TOUCH_MIN } from '../constants/spacing';
import { useAuth } from '../providers/AuthProvider';
import { useForesightScore, useDailyStatus } from '../hooks/useForesightScore';
import { useActiveContests } from '../hooks/useContests';
import { useInfluencers } from '../hooks/useInfluencers';
import { useQuestSummary } from '../hooks/useQuests';
import { formatSOL, formatNumber, timeUntil, getAvatarColor } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Contest, Influencer } from '../types';
import { TIER_CONFIG } from '../types';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { LiveDot } from '../components/LiveDot';
import { Skeleton } from '../components/Skeleton';
import { useSolBalance } from '../hooks/useSolBalance';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingTip } from '../components/OnboardingTip';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Layout-safe fade-in (no position:absolute like entering= prop) ──
function FadeInView({
  delay = 0,
  duration = 300,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  style?: any;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── HomeScreen ───────────────────────────────────────────────────────

function getTierColor(tier: string): string {
  const key = tier?.charAt(0).toUpperCase() as keyof typeof TIER_CONFIG;
  return TIER_CONFIG[key]?.color ?? textLevels.muted;
}
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuth();
  const { data: score, isLoading: scoreLoading, refetch: refetchScore } = useForesightScore(isAuthenticated);
  const { data: daily, refetch: refetchDaily } = useDailyStatus(isAuthenticated);
  const { data: contests, isLoading: contestsLoading, isError: contestsError, refetch: refetchContests } = useActiveContests();
  const { data: influencerData, isError: influencersError, refetch: refetchInfluencers } = useInfluencers({ sortBy: 'points' });
  const { data: questSummary, refetch: refetchQuests } = useQuestSummary(isAuthenticated);
  const { data: solBalance } = useSolBalance(isAuthenticated ? user?.walletAddress : undefined);

  const [refreshing, setRefreshing] = useState(false);
  const welcomeTip = useOnboarding('welcome');

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
            {solBalance != null && solBalance > 0 && (
              <View style={styles.solChip}>
                <MaterialCommunityIcons name="circle" size={6} color={colors.success} />
                <Text style={styles.solChipText}>◎ {formatSOL(solBalance)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: getAvatarColor(displayName) }]}
            onPress={() => {
              haptics.selection();
              if (isAuthenticated) {
                (navigation as any).navigate('Main', { screen: 'Profile' });
              } else {
                navigation.navigate('Auth');
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

        {welcomeTip.visible && (
          <OnboardingTip
            icon="rocket-launch"
            title="Welcome to CT Foresight"
            message="Draft teams of CT influencers, earn points from their engagement, and compete for SOL prizes."
            onDismiss={welcomeTip.dismiss}
          />
        )}

        {/* ── Active Contest Hero ───────────────── */}
        <FadeInView delay={0}>
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
        </FadeInView>

        {/* ── Guest Sign-In Banner ─────────────── */}
        {!isAuthenticated && (
          <FadeInView delay={50}>
          <TouchableOpacity
            style={styles.signInBanner}
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              navigation.navigate('Auth');
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
          </FadeInView>
        )}

        {/* ── Featured Influencers ────────────────── */}
        {featuredInfluencers.length > 0 && (
          <FadeInView delay={100} style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Text style={styles.sectionLabel}>Who Will You Draft?</Text>
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  navigation.navigate('InfluencerList' as any);
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
          </FadeInView>
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
            <FadeInView delay={150}>
              <ForesightScoreCard score={score} />
            </FadeInView>
          ) : null
        )}

        {/* ── Daily Activities ─────────────────── */}
        {isAuthenticated && daily && (
          <FadeInView delay={200}>
            <DailyActivitiesRow daily={daily} />
          </FadeInView>
        )}

        {/* ── Quest Alert Banner ───────────────── */}
        {isAuthenticated && questSummary && questSummary.unclaimed > 0 && (
          <FadeInView delay={250}>
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
          </FadeInView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Contest Hero Card (Redesigned) ───────────────────────────────────
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const isLive = contest.status === 'active' || contest.status === 'live' || contest.status === 'open';
  const countdown = !isLive ? timeUntil(contest.startDate) : null;

  const heroScale = useSharedValue(1);
  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.heroCard, heroAnimStyle]}
      activeOpacity={1}
      onPressIn={() => { heroScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { heroScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={() => {
        haptics.selection();
        navigation.navigate('ContestDetail', { contestId: contest.id });
      }}
    >
      {/* Accent glow */}
      <View style={styles.heroAccent} />

      {/* Featured badge */}
      <View style={styles.featuredBadge}>
        <MaterialCommunityIcons name="fire" size={12} color={colors.brand} />
        <Text style={styles.featuredText}>FEATURED</Text>
      </View>

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
          <Text style={styles.prizeAmount}>
            {contest.prizePoolFormatted ?? `${formatSOL(contest.prizePool)} SOL`}
          </Text>
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
            navigation.navigate('Auth', {
              returnTo: 'Draft',
              returnParams: { contestId: contest.id },
            });
            return;
          }
          navigation.navigate('Draft', { contestId: contest.id });
        }}
      >
        <MaterialCommunityIcons name="shield-sword" size={20} color={colors.black} />
        <Text style={styles.ctaText}>Draft Your Team</Text>
      </TouchableOpacity>
    </AnimatedTouchable>
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
        navigation.navigate('InfluencerList' as any);
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
        <AnimatedNumber value={score.totalScore} style={styles.scoreNumber} />
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
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brandMark: {
    ...typography.label,
    color: colors.brand,
    letterSpacing: 2,
    marginBottom: 2,
  },
  greeting: {
    ...typography.h1,
    fontWeight: '800',
    color: textLevels.primary,
  },
  solChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: elevation.surface, borderWidth: 1, borderColor: borders.subtle,
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6,
    alignSelf: 'flex-start', marginTop: spacing.xs,
  },
  solChipText: { ...typography.mono, fontSize: 11, fontWeight: '600', color: textLevels.secondary },
  avatar: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    backgroundColor: elevation.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brand + '44',
  },
  avatarLetter: {
    ...typography.body,
    fontWeight: '700',
    color: colors.brand,
  },

  // Hero contest card
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg + spacing.xs,
    backgroundColor: elevation.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.brand,
    padding: spacing.xl,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: brandAlpha['6'],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: brandAlpha['12'],
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand,
    letterSpacing: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  heroName: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '800',
    color: textLevels.primary,
    width: '100%',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusLive: {
    backgroundColor: successAlpha['15'],
  },
  statusUpcoming: {
    backgroundColor: mutedAlpha['15'],
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '800',
    color: textLevels.secondary,
    letterSpacing: 0.5,
    fontSize: 11,
  },
  freeEntryBadge: {
    backgroundColor: successAlpha['12'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  freeEntryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  entryFeeText: {
    ...typography.caption,
    fontWeight: '600',
    color: textLevels.muted,
  },

  // Prize block
  prizeBlock: {
    width: '100%',
    marginBottom: spacing.lg + spacing.xs,
  },
  prizeLabel: {
    ...typography.label,
    color: textLevels.muted,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  prizeAmount: {
    ...typography.display,
    fontSize: 44,
    fontWeight: '800',
    color: colors.brand,
    fontVariant: ['tabular-nums'],
    lineHeight: 48,
  },
  prizeCurrency: {
    ...typography.h2,
    color: colors.brand,
    opacity: 0.7,
  },

  // Influencer faces
  facesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg + spacing.xs,
    gap: spacing.md,
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
    backgroundColor: elevation.surface,
  },
  faceImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  facesLabel: {
    ...typography.bodySm,
    fontWeight: '600',
    color: textLevels.secondary,
    fontSize: 13,
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.brand,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    minHeight: 56,
  },
  ctaText: {
    ...typography.body,
    fontSize: 17,
    fontWeight: '800',
    color: colors.black,
    letterSpacing: 0.3,
  },
  emptyText: {
    ...typography.body,
    fontWeight: '600',
    color: textLevels.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: textLevels.muted,
    marginTop: spacing.xs,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandAlpha['10'],
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBannerText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.brand,
    fontSize: 13,
  },

  // Sign-in banner
  signInBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: elevation.surface,
    borderWidth: 1,
    borderColor: colors.brand + '33',
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minHeight: TOUCH_MIN,
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
    ...typography.bodySm,
    fontSize: 15,
    fontWeight: '700',
    color: textLevels.primary,
    marginBottom: 2,
  },
  signInBannerText: {
    ...typography.caption,
    color: textLevels.secondary,
    fontSize: 13,
  },

  // Featured influencers
  featuredSection: {
    marginBottom: spacing.lg + spacing.xs,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg + spacing.xs,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.body,
    fontWeight: '700',
    color: textLevels.primary,
  },
  seeAllText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.brand,
    fontSize: 13,
  },
  featuredScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm + 2,
  },
  infChip: {
    width: 88,
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  infChipAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: elevation.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infChipImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  infChipHandle: {
    ...typography.caption,
    fontWeight: '600',
    color: textLevels.secondary,
    maxWidth: 80,
    textAlign: 'center',
    fontSize: 11,
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
    ...typography.caption,
    fontWeight: '600',
    color: textLevels.muted,
    fontSize: 10,
  },

  // Generic card
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: elevation.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: borders.subtle,
    padding: spacing.lg,
  },
  cardLabel: {
    ...typography.label,
    color: textLevels.secondary,
  },

  // Score card
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rankBadge: {
    backgroundColor: elevation.elevated,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  rankText: {
    ...typography.caption,
    fontWeight: '600',
    color: textLevels.secondary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  scoreNumber: {
    ...typography.monoLg,
    fontSize: 36,
    color: textLevels.primary,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    gap: spacing.xs + 2,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierLabel: {
    ...typography.bodySm,
    fontWeight: '700',
    fontSize: 13,
  },
  progressSection: {
    gap: spacing.xs + 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: elevation.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    ...typography.caption,
    color: textLevels.muted,
  },

  // Daily activities
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dailyCount: {
    ...typography.mono,
    fontWeight: '700',
    color: colors.brand,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dailyItem: {
    alignItems: 'center',
    gap: spacing.sm,
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
    borderColor: borders.default,
  },
  dailyLabel: {
    ...typography.caption,
    fontWeight: '500',
    color: textLevels.muted,
  },

  // Quest banner
  questBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandAlpha['8'],
    borderWidth: 1,
    borderColor: brandAlpha['20'],
    borderRadius: 14,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm + 2,
    minHeight: TOUCH_MIN,
  },
  questBannerText: {
    flex: 1,
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.brand,
  },

  // Skeleton placeholders
  skeletonLine80: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    backgroundColor: elevation.surface,
    marginBottom: spacing.sm + 2,
  },
  skeletonLine40: {
    width: '40%',
    height: 12,
    borderRadius: 6,
    backgroundColor: elevation.surface,
    marginBottom: spacing.sm,
  },
  skeletonLineLarge: {
    width: '50%',
    height: 28,
    borderRadius: 8,
    backgroundColor: elevation.surface,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start' as const,
  },
  skeletonButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: elevation.surface,
  },
});
