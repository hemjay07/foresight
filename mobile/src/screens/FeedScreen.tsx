import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../constants/colors';
import { useAuth } from '../providers/AuthProvider';
import { useCTFeed, useHighlights } from '../hooks/useFeed';
import { useTrackActivity } from '../hooks/useForesightScore';
import { formatNumber } from '../utils/formatting';
import { haptics } from '../utils/haptics';
import type { Tweet } from '../types';

// ─── Filter types ─────────────────────────────────────────────────────
type FilterKey = 'all' | 'highlights' | 'rising';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'rising', label: 'Rising' },
];

// ─── FeedScreen ───────────────────────────────────────────────────────
export default function FeedScreen() {
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: feedData, isLoading: feedLoading, isError: feedError, refetch: refetchFeed } = useCTFeed(activeFilter);
  const { data: highlights, refetch: refetchHighlights } = useHighlights('24h');
  const trackActivity = useTrackActivity();
  const hasTracked = useRef(false);

  // Track browse activity on mount (only for authenticated users)
  useEffect(() => {
    if (!hasTracked.current && isAuthenticated) {
      hasTracked.current = true;
      trackActivity.mutate('browse_ct_feed');
    }
  }, [isAuthenticated]);

  const tweets = useMemo(() => feedData?.tweets ?? [], [feedData]);
  const highlightTweets = useMemo(() => {
    if (activeFilter === 'all') return highlights ?? feedData?.highlights ?? [];
    return [];
  }, [activeFilter, highlights, feedData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.impact();
    await Promise.all([refetchFeed(), refetchHighlights()]);
    setRefreshing(false);
  }, [refetchFeed, refetchHighlights]);

  const onFilterPress = useCallback((key: FilterKey) => {
    haptics.selection();
    setActiveFilter(key);
  }, []);

  // ── Header component for FlatList ──────────────────────────────
  const ListHeader = useMemo(
    () => (
      <>
        {/* Highlights carousel (only in "All" filter) */}
        {activeFilter === 'all' && highlightTweets.length > 0 && (
          <View style={styles.highlightsSection}>
            <Text style={styles.sectionLabel}>Top Highlights</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsScroll}
            >
              {highlightTweets.map((tweet, index) => (
                <HighlightCard key={tweet.id} tweet={tweet} isTop={index === 0} />
              ))}
            </ScrollView>
          </View>
        )}
      </>
    ),
    [activeFilter, highlightTweets],
  );

  // ── Loading skeleton ───────────────────────────────────────────
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, { width: '40%' }]} />
            <View style={[styles.skeletonLine, { width: '90%' }]} />
            <View style={[styles.skeletonLine, { width: '65%' }]} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header + Filter Tabs ─────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>CT Feed</Text>
      </View>
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
              activeOpacity={0.7}
              onPress={() => onFilterPress(f.key)}
            >
              <Text
                style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Error Banner ──────────────────────── */}
      {feedError && (
        <TouchableOpacity
          style={styles.errorBanner}
          activeOpacity={0.8}
          onPress={onRefresh}
        >
          <MaterialCommunityIcons name="wifi-off" size={16} color={colors.brand} />
          <Text style={styles.errorBannerText}>
            Couldn't load feed. Tap to retry.
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Feed ─────────────────────────────── */}
      {feedLoading && !refreshing ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={tweets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TweetCard tweet={item} />}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tweets yet</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or try a different filter</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Highlight Card ───────────────────────────────────────────────────
function HighlightCard({ tweet, isTop }: { tweet: Tweet; isTop: boolean }) {
  return (
    <View style={[styles.highlightCard, isTop && styles.highlightCardTop]}>
      {/* Author row */}
      <View style={styles.highlightAuthor}>
        <View style={styles.highlightAvatar}>
          <Text style={styles.highlightAvatarLetter}>
            {tweet.authorHandle?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.highlightHandle} numberOfLines={1}>
          @{tweet.authorHandle}
        </Text>
      </View>
      {/* Text */}
      <Text style={styles.highlightText} numberOfLines={2}>
        {tweet.text}
      </Text>
      {/* Engagement */}
      <View style={styles.engagementRow}>
        <EngagementStat icon="heart" count={tweet.likes} />
        <EngagementStat icon="repeat-variant" count={tweet.retweets} />
        <EngagementStat icon="comment-outline" count={tweet.replies} />
      </View>
    </View>
  );
}

// ─── Tweet Card ───────────────────────────────────────────────────────
function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <View style={styles.tweetCard}>
      {/* Avatar */}
      <View style={styles.tweetAvatar}>
        <Text style={styles.tweetAvatarLetter}>
          {tweet.authorHandle?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.tweetContent}>
        <Text style={styles.tweetHandle} numberOfLines={1}>
          @{tweet.authorHandle}
        </Text>
        <Text style={styles.tweetText} numberOfLines={3}>
          {tweet.text}
        </Text>
        {/* Engagement row */}
        <View style={styles.tweetEngagement}>
          <EngagementStat icon="heart" count={tweet.likes} />
          <EngagementStat icon="repeat-variant" count={tweet.retweets} />
          <EngagementStat icon="comment-outline" count={tweet.replies} />
          <EngagementStat icon="eye-outline" count={tweet.views} />
        </View>
      </View>
    </View>
  );
}

// ─── Small Engagement Stat ────────────────────────────────────────────
function EngagementStat({ icon, count }: { icon: string; count: number }) {
  return (
    <View style={styles.engagementStat}>
      <MaterialCommunityIcons
        name={icon as any}
        size={14}
        color={colors.textMuted}
      />
      <Text style={styles.engagementCount}>{formatNumber(count)}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  // Filter tabs
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterTabActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.black,
  },

  // Highlights section
  highlightsSection: {
    paddingTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  highlightsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  highlightCard: {
    width: 280,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  highlightCardTop: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  highlightAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightAvatarLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand,
  },
  highlightHandle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  highlightText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  // Feed
  feedContent: {
    paddingBottom: 32,
  },
  separator: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 20,
  },

  // Tweet card
  tweetCard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  tweetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tweetAvatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cyan,
  },
  tweetContent: {
    flex: 1,
  },
  tweetHandle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  tweetText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  tweetEngagement: {
    flexDirection: 'row',
    gap: 16,
  },

  // Engagement stat
  engagementRow: {
    flexDirection: 'row',
    gap: 14,
  },
  engagementStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },

  // Skeleton loading
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.card,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
