import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, Alert, Platform,
  KeyboardAvoidingView, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import ReanimatedLib, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import ConfettiCannon from 'react-native-confetti-cannon';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useInfluencers } from '../hooks/useInfluencers';
import { colors, elevation, textLevels, borders, brandAlpha, successAlpha } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, TOUCH_MIN } from '../constants/spacing';
import { TIER_CONFIG } from '../types';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingTip } from '../components/OnboardingTip';
import type { Influencer } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { haptics } from '../utils/haptics';
import { formatNumber } from '../utils/formatting';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import api from '../services/api';

const AnimatedView = ReanimatedLib.createAnimatedComponent(View);
const AnimatedPressable = ReanimatedLib.createAnimatedComponent(Pressable);

const DEFAULT_BUDGET = 150;
const TEAM = 5;
const TIERS = ['', 'S', 'A', 'B', 'C'] as const;
const TIER_LABELS = ['All', 'S', 'A', 'B', 'C'];
const PRESS_SPRING = { damping: 15, stiffness: 300 };

// --- Formation Slot ---

function FormationSlot({ influencer: inf, isCaptain, onTap, onRemove, onEmptyTap }: {
  influencer: Influencer | null; index: number; isCaptain: boolean;
  onTap: () => void; onRemove: () => void; onEmptyTap?: () => void;
}) {
  const sz = isCaptain ? 72 : 64;
  const tierColor = inf ? TIER_CONFIG[inf.tier].color : borders.default;

  // Captain border pulse
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    if (inf && isCaptain) {
      pulseProgress.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseProgress.value = 0;
    }
  }, [inf, isCaptain, pulseProgress]);

  const captainBorderStyle = useAnimatedStyle(() => {
    if (!inf || !isCaptain) return {};
    const opacity = 0.6 + pulseProgress.value * 0.4; // 0.6 -> 1.0
    return { opacity };
  });

  if (!inf) {
    return (
      <TouchableOpacity
        style={[s.slotWrap, { width: sz + 24 }]}
        onPress={onEmptyTap}
        activeOpacity={0.6}
        hitSlop={spacing.xs}
      >
        <View style={[s.emptySlot, { width: sz, height: sz, borderRadius: sz / 2 }]}>
          <Text style={[s.emptyIcon, isCaptain && { color: colors.brand, fontSize: 26 }]}>+</Text>
        </View>
        <Text style={[s.slotHandle, isCaptain && { color: colors.brand }]}>
          {isCaptain ? 'Captain' : 'Pick'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <AnimatedView
      style={[s.slotWrap, { width: sz + 24 }]}
      entering={FadeIn.duration(250).springify().damping(12).stiffness(200)}
      exiting={FadeOut.duration(200)}
    >
      <Pressable onPress={onTap}>
        {isCaptain ? (
          <AnimatedView style={[{
            width: sz, height: sz, borderRadius: sz / 2, justifyContent: 'center',
            alignItems: 'center', borderColor: colors.brand, borderWidth: 3,
          }, captainBorderStyle]}>
            <Image
              source={{ uri: inf.avatar }}
              style={{ width: sz - 6, height: sz - 6, borderRadius: (sz - 6) / 2, backgroundColor: elevation.surface }}
            />
            <View style={s.captainBadge}>
              <Text style={s.captainBadgeText}>2x</Text>
            </View>
          </AnimatedView>
        ) : (
          <View style={{
            width: sz, height: sz, borderRadius: sz / 2, justifyContent: 'center',
            alignItems: 'center', borderColor: tierColor, borderWidth: 2,
          }}>
            <Image
              source={{ uri: inf.avatar }}
              style={{ width: sz - 6, height: sz - 6, borderRadius: (sz - 6) / 2, backgroundColor: elevation.surface }}
            />
          </View>
        )}
      </Pressable>
      <TouchableOpacity style={s.removeBtn} onPress={onRemove} hitSlop={12}>
        <MaterialCommunityIcons name="close" size={14} color={colors.white} />
      </TouchableOpacity>
      <Text style={s.slotHandle} numberOfLines={1}>@{inf.handle}</Text>
      <View style={[s.tierDot, { backgroundColor: tierColor }]} />
    </AnimatedView>
  );
}

// --- Picker Card ---

function PickerCard({ influencer: inf, isPicked, isDisabled, onAdd, onLongPress }: {
  influencer: Influencer; isPicked: boolean; isDisabled: boolean; onAdd: () => void; onLongPress: () => void;
}) {
  const tc = TIER_CONFIG[inf.tier];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, PRESS_SPRING);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING);
  }, [scale]);

  return (
    <AnimatedPressable
      style={[s.card, isPicked && { opacity: 0.5 }, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[s.cardAvatar, { borderColor: tc.color }]}>
        <Image source={{ uri: inf.avatar }} style={s.cardAvatarImg} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardHandle} numberOfLines={1}>@{inf.handle}</Text>
        <View style={s.cardMeta}>
          <Text style={s.cardName} numberOfLines={1}>{inf.name}</Text>
          <Badge tier={inf.tier as 'S' | 'A' | 'B' | 'C'} size="sm" />
        </View>
      </View>
      <View style={s.cardRight}>
        <Text style={s.cardPrice}>{inf.price} cr</Text>
        <Text style={s.cardScore}>{formatNumber(inf.totalPoints)} pts</Text>
      </View>
      <TouchableOpacity
        style={[
          s.addBtn,
          isPicked && { backgroundColor: successAlpha['12'], borderColor: colors.success },
          isDisabled && !isPicked && { backgroundColor: elevation.surface, borderColor: borders.default },
        ]}
        onPress={onAdd}
        disabled={isDisabled && !isPicked}
        activeOpacity={0.6}
        hitSlop={spacing.xs}
      >
        <MaterialCommunityIcons
          name={isPicked ? 'check' : 'plus'}
          size={20}
          color={isPicked ? colors.success : isDisabled && !isPicked ? textLevels.muted : colors.brand}
        />
      </TouchableOpacity>
    </AnimatedPressable>
  );
}

// --- Influencer Detail Sheet Content ---

function InfluencerSheetContent({ influencer }: { influencer: Influencer }) {
  const tc = TIER_CONFIG[influencer.tier];
  return (
    <View style={s.sheetContent}>
      {/* Header */}
      <View style={s.sheetHeader}>
        <View style={[s.sheetAvatar, { borderColor: tc.color }]}>
          <Image source={{ uri: influencer.avatar }} style={s.sheetAvatarImg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sheetHandle}>@{influencer.handle}</Text>
          <Text style={s.sheetName}>{influencer.name}</Text>
        </View>
        <Badge tier={influencer.tier as 'S' | 'A' | 'B' | 'C'} size="md" />
      </View>

      {/* Stats grid */}
      <View style={s.sheetStats}>
        <StatCard
          label="Total Points"
          value={formatNumber(influencer.totalPoints)}
          icon="chart-line"
        />
        <StatCard
          label="Cost"
          value={`${influencer.price} cr`}
          icon="currency-usd"
          iconColor={colors.brand}
        />
        <StatCard
          label="Followers"
          value={formatNumber(influencer.followers)}
          icon="account-group"
        />
        <StatCard
          label="Engagement"
          value={`${influencer.engagementRate.toFixed(1)}%`}
          icon="lightning-bolt"
        />
      </View>
    </View>
  );
}

// --- Submit Button (Reanimated press) ---

function SubmitButton({ canSubmit, isSubmitting, onPress }: {
  canSubmit: boolean; isSubmitting: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (canSubmit) scale.value = withSpring(0.95, PRESS_SPRING);
  }, [canSubmit, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING);
  }, [scale]);

  return (
    <AnimatedPressable
      style={[
        s.submitBtn,
        !canSubmit && { backgroundColor: elevation.surface },
        canSubmit && {
          shadowColor: colors.brand,
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={!canSubmit}
    >
      {isSubmitting ? (
        <ActivityIndicator color={colors.background} size="small" />
      ) : (
        <Text style={[s.submitText, !canSubmit && { color: textLevels.muted }]}>Submit Team</Text>
      )}
    </AnimatedPressable>
  );
}

// --- Budget Bar (Reanimated) ---

function BudgetBar({ shakeAnim, remaining, budget, spent, overBudgetMsg }: {
  shakeAnim: ReturnType<typeof useSharedValue<number>>;
  remaining: number; budget: number; spent: number; overBudgetMsg: string;
}) {
  const budgetPct = Math.min((spent / budget) * 100, 100);

  const budgetProgress = useSharedValue(budgetPct);

  useEffect(() => {
    budgetProgress.value = withTiming(budgetPct, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [budgetPct, budgetProgress]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  const fillStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      budgetProgress.value,
      [0, 60, 85, 100],
      [colors.success, colors.success, colors.brand, colors.error],
    );
    return {
      width: `${budgetProgress.value}%` as any,
      backgroundColor: color,
    };
  });

  return (
    <AnimatedView style={[s.budget, shakeStyle]}>
      <View style={s.budgetRow}>
        <Text style={s.budgetLabel}>BUDGET</Text>
        <Text style={s.budgetValue}>
          <Text style={{ color: remaining < 15 ? colors.error : colors.brand }}>{remaining}</Text>
          <Text style={{ color: textLevels.muted }}> / {budget}</Text>
        </Text>
      </View>
      <View style={s.budgetTrack}>
        <AnimatedView style={[s.budgetFill, fillStyle]} />
      </View>
      {overBudgetMsg !== '' && (
        <Text style={s.overBudgetMsg}>{overBudgetMsg}</Text>
      )}
    </AnimatedView>
  );
}

// --- Main Screen ---

export default function DraftScreen() {
  const { contestId } = useRoute<RouteProp<RootStackParamList, 'Draft'>>().params;
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const [picks, setPicks] = useState<(Influencer | null)[]>(Array(TEAM).fill(null));
  const [captainIndex, setCaptainIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamName, setTeamName] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [sheetInfluencer, setSheetInfluencer] = useState<Influencer | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [overBudgetMsg, setOverBudgetMsg] = useState('');
  const shakeAnim = useSharedValue(0);
  const searchInputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const draftTip = useOnboarding('draft_hint');

  const openSheet = useCallback((inf: Influencer) => {
    haptics.impact();
    setSheetInfluencer(inf);
    bottomSheetRef.current?.expand();
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setSheetInfluencer(null);
  }, []);

  // Debounce search input by 300ms
  useEffect(() => {
    debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  // Warn before leaving with unsaved picks
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      const hasPicks = picks.some(Boolean);
      if (!hasPicks) return;
      e.preventDefault();
      Alert.alert('Discard Draft?', 'You have unsaved picks. Leave anyway?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsubscribe;
  }, [navigation, picks]);

  const { data, isLoading } = useInfluencers({
    tier: tierFilter || undefined,
    search: debouncedSearch || undefined,
  });
  const influencers = data?.influencers ?? [];
  const BUDGET = data?.budget ?? DEFAULT_BUDGET;

  const pickedIds = useMemo(() => new Set(picks.filter(Boolean).map((p) => p!.id)), [picks]);
  const pickCount = useMemo(() => picks.filter(Boolean).length, [picks]);
  const spent = useMemo(() => picks.reduce((sum, p) => sum + (Number(p?.price) || 0), 0), [picks]);
  const remaining = BUDGET - spent;

  const addInfluencer = useCallback((inf: Influencer) => {
    if (pickedIds.has(inf.id)) return;
    if (Number(inf.price) > remaining) {
      haptics.error();
      setOverBudgetMsg(`${inf.handle} costs ${inf.price} cr — ${remaining} remaining`);
      shakeAnim.value = withTiming(10, { duration: 50 }, () => {
        shakeAnim.value = withTiming(-10, { duration: 50 }, () => {
          shakeAnim.value = withTiming(0, { duration: 50 });
        });
      });
      setTimeout(() => setOverBudgetMsg(''), 2500);
      return;
    }
    const slot = picks.findIndex((p) => p === null);
    if (slot === -1) { haptics.error(); return; }
    haptics.selection();
    const next = [...picks]; next[slot] = inf; setPicks(next);
  }, [picks, pickedIds, remaining]);

  const removeInfluencer = useCallback((idx: number) => {
    haptics.light();
    const next = [...picks]; next[idx] = null; setPicks(next);
    if (captainIndex === idx) {
      const newCaptain = picks.findIndex((p, i) => p !== null && i !== idx);
      setCaptainIndex(newCaptain === -1 ? 0 : newCaptain);
    }
  }, [picks, captainIndex]);

  const toggleCaptain = useCallback((idx: number) => {
    if (!picks[idx]) return;
    haptics.impact(); setCaptainIndex(idx);
  }, [picks]);

  const doSubmit = useCallback(async (name: string) => {
    const filled = picks.filter(Boolean) as Influencer[];
    const captain = picks[captainIndex] ?? filled[0];
    setIsSubmitting(true);
    try {
      await api.post(`/api/v2/contests/${contestId}/enter-free`, {
        teamIds: filled.map((i) => i.id),
        captainId: captain.id,
      });
      haptics.success();
      setShowConfetti(true);
      setPicks(Array(TEAM).fill(null));
      setTimeout(() => {
        (navigation as any).navigate('ContestDetail', { contestId, justEntered: true });
      }, 1800);
    } catch (err: any) {
      haptics.error();
      const msg = err?.response?.data?.error ?? (err?.message?.includes('Network') ? 'Network error. Check your connection.' : 'Failed to submit team');
      Alert.alert('Error', msg);
    } finally { setIsSubmitting(false); }
  }, [picks, captainIndex, contestId, navigation]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      haptics.impact();
      (navigation as any).navigate('Auth', { returnTo: 'Draft', returnParams: { contestId } });
      return;
    }
    const filled = picks.filter(Boolean) as Influencer[];
    if (filled.length < TEAM) { haptics.error(); return; }
    const captain = picks[captainIndex] ?? filled[0];

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Name Your Team',
        `Captain: @${captain.handle} (2x points)`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: (name) => doSubmit(name?.trim() || 'My Team') },
        ],
        'plain-text',
        teamName || '',
        'default',
      );
    } else {
      // Android: use Alert with pre-set name (no prompt support)
      const name = teamName.trim() || 'My Team';
      Alert.alert('Submit Team',
        `"${name}" with captain @${captain.handle} (2x points)`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Submit', onPress: () => doSubmit(name) }],
      );
    }
  }, [picks, captainIndex, contestId, navigation, isAuthenticated, teamName, doSubmit]);

  const canSubmit = pickCount === TEAM && !isSubmitting;
  const rows = [[0], [1, 2], [3, 4]];

  const renderItem = useCallback(({ item }: { item: Influencer }) => {
    const picked = pickedIds.has(item.id);
    return (
      <PickerCard
        influencer={item}
        isPicked={picked}
        isDisabled={picked || pickCount >= TEAM || Number(item.price) > remaining}
        onAdd={() => !picked && addInfluencer(item)}
        onLongPress={() => openSheet(item)}
      />
    );
  }, [pickedIds, pickCount, remaining, addInfluencer, openSheet]);

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      {/* Budget */}
      <BudgetBar
        shakeAnim={shakeAnim}
        remaining={remaining}
        budget={BUDGET}
        spent={spent}
        overBudgetMsg={overBudgetMsg}
      />

      {draftTip.visible && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <OnboardingTip
            icon="account-group"
            title="Draft Your Team"
            message="Pick 5 influencers within budget. Tap a player in formation to make them captain for 2x points."
            onDismiss={draftTip.dismiss}
          />
        </View>
      )}

      {/* Formation */}
      <View style={s.formation}>
        {pickCount === 0 && (
          <Text style={s.formationHint}>Build your dream team</Text>
        )}
        {pickCount > 0 && pickCount < TEAM && (
          <Text style={s.captainHint}>Tap a player to make them captain (2x points)</Text>
        )}
        {rows.map((row, ri) => (
          <View key={ri} style={s.formationRow}>
            {row.map((idx) => (
              <FormationSlot
                key={idx} index={idx} influencer={picks[idx]}
                isCaptain={captainIndex === idx}
                onTap={() => toggleCaptain(idx)}
                onRemove={() => removeInfluencer(idx)}
                onEmptyTap={() => { haptics.selection(); searchInputRef.current?.focus(); }}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Picker */}
      <KeyboardAvoidingView
        style={s.picker}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={s.searchWrap}>
          <View style={s.searchBar}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              ref={searchInputRef}
              style={s.searchInput}
              placeholder="Search influencers..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery} onChangeText={setSearchQuery}
              autoCapitalize="none" autoCorrect={false}
            />
          </View>
        </View>
        <View style={s.tierTabs}>
          {TIERS.map((tier, i) => {
            const active = tierFilter === tier;
            const tc = tier ? TIER_CONFIG[tier as keyof typeof TIER_CONFIG].color : colors.brand;
            return (
              <TouchableOpacity key={tier || 'all'} activeOpacity={0.7}
                style={[s.tierTab, active && { backgroundColor: tc + '22', borderColor: tc }]}
                onPress={() => setTierFilter(tier)}>
                <Text style={[s.tierTabText, active && { color: tc }]}>{TIER_LABELS[i]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isLoading ? (
          <View style={s.center}><ActivityIndicator color={colors.brand} /></View>
        ) : (
          <FlatList
            data={influencers} keyExtractor={(i) => String(i.id)}
            renderItem={renderItem} contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={s.empty}>No influencers found</Text>}
          />
        )}
      </KeyboardAvoidingView>

      {/* Bottom Bar */}
      <View style={s.bottom}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          {canSubmit && (
            <TextInput
              style={s.teamNameInput}
              placeholder="Team name..."
              placeholderTextColor={textLevels.muted}
              value={teamName}
              onChangeText={setTeamName}
              maxLength={30}
              autoCapitalize="words"
            />
          )}
          {!canSubmit && (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.pickCount}>{pickCount}/{TEAM} Picks</Text>
              <View style={s.dots}>
                {Array.from({ length: TEAM }).map((_, i) => (
                  <View key={i} style={[s.dot, { backgroundColor: picks[i] ? colors.brand : elevation.surface }]} />
                ))}
              </View>
            </View>
          )}
        </View>
        <SubmitButton canSubmit={canSubmit} isSubmitting={isSubmitting} onPress={handleSubmit} />
      </View>

      {/* Influencer Detail Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[300]}
        enablePanDownToClose
        onClose={() => setSheetInfluencer(null)}
        backgroundStyle={{ backgroundColor: elevation.elevated }}
        handleIndicatorStyle={{ backgroundColor: textLevels.muted }}
      >
        <BottomSheetView>
          {sheetInfluencer && <InfluencerSheetContent influencer={sheetInfluencer} />}
        </BottomSheetView>
      </BottomSheet>

      {/* Confetti on successful submit */}
      {showConfetti && (
        <ConfettiCannon
          count={120}
          origin={{ x: -10, y: 0 }}
          fadeOut
          autoStart
          colors={[colors.brand, colors.cyan, colors.success, colors.brand, colors.error]}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles ---

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Budget
  budget: { paddingHorizontal: spacing.lg + spacing.xs, paddingTop: spacing.sm, paddingBottom: spacing.md },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs + 2 },
  budgetLabel: { ...typography.label, color: textLevels.secondary },
  budgetValue: { ...typography.mono, fontWeight: '700' },
  budgetTrack: { height: 4, backgroundColor: elevation.surface, borderRadius: 2, overflow: 'hidden' },
  budgetFill: { height: 4, borderRadius: 2 },
  overBudgetMsg: { ...typography.caption, color: colors.error, fontWeight: '600', marginTop: spacing.xs, textAlign: 'center' },

  // Formation
  formation: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.sm },
  formationHint: { ...typography.bodySm, color: textLevels.secondary, fontWeight: '600', marginBottom: spacing.xs, letterSpacing: 0.3 },
  captainHint: { ...typography.caption, color: textLevels.muted, fontWeight: '500', marginBottom: 2, textAlign: 'center' },
  formationRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  slotWrap: { alignItems: 'center', gap: spacing.xs },
  emptySlot: {
    borderWidth: 2, borderColor: borders.default, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: elevation.surface,
  },
  emptyIcon: { color: textLevels.muted, fontSize: 22, fontWeight: '700', opacity: 0.5 },
  slotHandle: { ...typography.caption, color: textLevels.secondary, maxWidth: 80, textAlign: 'center' },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  captainBadge: {
    position: 'absolute', top: -6, right: -6, backgroundColor: colors.brand,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  captainBadgeText: { color: colors.background, fontSize: 9, fontWeight: '800' },
  removeBtn: {
    position: 'absolute', top: -4, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },

  // Picker
  picker: { flex: 1, borderTopWidth: 1, borderTopColor: borders.subtle },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: elevation.surface,
    borderRadius: 10, borderWidth: 1, borderColor: borders.default, paddingHorizontal: spacing.md, height: TOUCH_MIN,
  },
  searchInput: { flex: 1, color: textLevels.primary, ...typography.bodySm, paddingVertical: 0 },
  tierTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm + 2, gap: spacing.sm },
  tierTab: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 16,
    borderWidth: 1, borderColor: borders.default, minHeight: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  tierTabText: { ...typography.caption, fontWeight: '600', color: textLevels.muted },

  // Picker Card
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: elevation.surface,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 8, borderWidth: 1,
    borderColor: borders.subtle, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm + 2,
  },
  cardAvatar: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: 22, borderWidth: 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  cardInfo: { flex: 1, gap: 2 },
  cardHandle: { ...typography.bodySm, color: textLevels.primary, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  cardName: { ...typography.caption, color: textLevels.secondary, maxWidth: 100 },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardPrice: { ...typography.mono, color: colors.brand },
  cardScore: { ...typography.caption, color: textLevels.muted },
  addBtn: {
    width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, justifyContent: 'center', alignItems: 'center',
    backgroundColor: brandAlpha['12'], borderWidth: 1, borderColor: colors.brand,
  },

  // Misc
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing['3xl'] },
  empty: { ...typography.bodySm, color: textLevels.muted, textAlign: 'center', paddingVertical: spacing['3xl'] },

  // Bottom
  bottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg + spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1,
    borderTopColor: borders.subtle, backgroundColor: elevation.surface,
  },
  teamNameInput: {
    backgroundColor: elevation.surface, borderWidth: 1, borderColor: borders.default,
    borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: textLevels.primary,
    ...typography.bodySm, fontWeight: '600',
  },
  pickCount: { ...typography.caption, color: textLevels.secondary, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  submitBtn: {
    backgroundColor: colors.brand, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: 10, minWidth: 130, minHeight: TOUCH_MIN, alignItems: 'center', justifyContent: 'center',
  },
  submitText: { ...typography.body, color: colors.background, fontWeight: '800' },

  // Bottom Sheet
  sheetContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg + spacing.xs },
  sheetAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  sheetAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  sheetHandle: { ...typography.body, color: textLevels.primary, fontWeight: '700' },
  sheetName: { ...typography.caption, color: textLevels.secondary, marginTop: 2 },
  sheetStats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
