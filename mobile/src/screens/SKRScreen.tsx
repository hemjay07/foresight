import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../constants/colors';
import { useAuth } from '../providers/AuthProvider';
import { useSKRBalance, TIERS } from '../hooks/useSKR';
import { formatNumber } from '../utils/formatting';

const TIER_ORDER = ['bronze', 'silver', 'gold'] as const;

export default function SKRScreen() {
  const { user } = useAuth();
  const { data: skr, isLoading, refetch } = useSKRBalance(user?.walletAddress);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* Header */}
        <Text style={s.title}>SKR Token</Text>
        <Text style={s.subtitle}>Stake SKR to unlock premium features and boost your Foresight Score</Text>

        {/* Balance Card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>YOUR SKR BALANCE</Text>
          <Text style={s.balanceValue}>
            {isLoading ? '...' : formatNumber(skr?.balance ?? 0)}
          </Text>
          <View style={s.tierRow}>
            <View style={[s.tierDot, { backgroundColor: skr?.tierColor ?? colors.textMuted }]} />
            <Text style={[s.tierName, { color: skr?.tierColor ?? colors.textMuted }]}>
              {skr?.tierLabel ?? 'Loading...'}
            </Text>
            {skr && skr.fsMultiplier > 1 && (
              <View style={s.multiplierBadge}>
                <Text style={s.multiplierText}>{skr.fsMultiplier}x FS</Text>
              </View>
            )}
          </View>
          {skr?.nextTier && (
            <Text style={s.nextTierText}>
              {formatNumber(skr.toNextTier)} SKR to {skr.nextTier}
            </Text>
          )}
        </View>

        {/* Tier Benefits */}
        <Text style={s.sectionTitle}>Staking Tiers</Text>
        {TIER_ORDER.map((tierKey) => {
          const t = TIERS[tierKey];
          const isActive = skr && skr.balance >= t.min;
          const isCurrent = skr?.tier === tierKey;

          return (
            <View key={tierKey} style={[s.tierCard, isCurrent && { borderColor: t.color, borderWidth: 1.5 }]}>
              <View style={s.tierCardHeader}>
                <View style={[s.tierIcon, { backgroundColor: t.color + '22' }]}>
                  <MaterialCommunityIcons
                    name={tierKey === 'gold' ? 'crown' : tierKey === 'silver' ? 'shield-star' : 'shield'}
                    size={20}
                    color={t.color}
                  />
                </View>
                <View style={s.tierCardInfo}>
                  <Text style={[s.tierCardName, { color: t.color }]}>{t.label}</Text>
                  <Text style={s.tierCardMin}>{formatNumber(t.min)}+ SKR</Text>
                </View>
                {isActive && (
                  <View style={[s.unlockedBadge, { backgroundColor: t.color + '22' }]}>
                    <Text style={[s.unlockedText, { color: t.color }]}>
                      {isCurrent ? 'CURRENT' : 'UNLOCKED'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress bar for current/next tier */}
              {isCurrent && skr?.nextTier && (
                <View style={s.progressWrap}>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, {
                      backgroundColor: t.color,
                      width: `${Math.min(100, ((skr.balance - t.min) / (TIERS[TIER_ORDER[TIER_ORDER.indexOf(tierKey) + 1] ?? tierKey].min - t.min)) * 100)}%`,
                    }]} />
                  </View>
                </View>
              )}

              <View style={s.benefitsList}>
                <BenefitRow
                  icon="flash"
                  text={`${t.multiplier}x Foresight Score multiplier`}
                  color={t.color}
                  active={!!isActive}
                />
                {tierKey === 'silver' && (
                  <BenefitRow
                    icon="trophy"
                    text="Access to Pro Contests (higher prizes, smaller fields)"
                    color={t.color}
                    active={!!isActive}
                  />
                )}
                {tierKey === 'gold' && (
                  <>
                    <BenefitRow
                      icon="trophy"
                      text="Access to all Pro Contests"
                      color={t.color}
                      active={!!isActive}
                    />
                    <BenefitRow
                      icon="eye"
                      text="Priority drafting (see stats 1hr early)"
                      color={t.color}
                      active={!!isActive}
                    />
                  </>
                )}
              </View>
            </View>
          );
        })}

        {/* How SKR Works */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.cyan} />
          <View style={s.infoContent}>
            <Text style={s.infoTitle}>How SKR works</Text>
            <Text style={s.infoText}>
              SKR is the native token of the Solana Mobile ecosystem. Hold SKR in your wallet to automatically unlock tier benefits. Top contest finishers earn bonus SKR rewards.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BenefitRow({ icon, text, color, active }: { icon: string; text: string; color: string; active: boolean }) {
  return (
    <View style={s.benefitRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={14}
        color={active ? color : colors.textMuted}
      />
      <Text style={[s.benefitText, !active && { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },

  // Balance Card
  balanceCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 16, padding: 24, marginBottom: 28, alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 11, fontWeight: '600', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 8,
  },
  balanceValue: {
    fontSize: 44, fontWeight: '800', color: colors.text,
    fontVariant: ['tabular-nums'], marginBottom: 8,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierName: { fontSize: 16, fontWeight: '700' },
  multiplierBadge: {
    backgroundColor: colors.brand + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  multiplierText: { color: colors.brand, fontSize: 12, fontWeight: '700' },
  nextTierText: { color: colors.textMuted, fontSize: 13, marginTop: 4 },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },

  // Tier Card
  tierCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  tierCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tierIcon: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  tierCardInfo: { flex: 1 },
  tierCardName: { fontSize: 16, fontWeight: '700' },
  tierCardMin: { fontSize: 12, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  unlockedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  unlockedText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  progressWrap: { marginBottom: 12 },
  progressTrack: { height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  benefitsList: { gap: 6 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  // Info Card
  infoCard: {
    flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 12, padding: 16, marginTop: 16, gap: 12,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
