import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, Alert, Animated, LayoutAnimation, Platform, UIManager,
  KeyboardAvoidingView, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import ConfettiCannon from 'react-native-confetti-cannon';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useInfluencers } from '../hooks/useInfluencers';
import { colors } from '../constants/colors';
import { TIER_CONFIG } from '../types';
import type { Influencer } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { haptics } from '../utils/haptics';
import { formatNumber } from '../utils/formatting';
import api from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_BUDGET = 150;
const TEAM = 5;
const TIERS = ['', 'S', 'A', 'B', 'C'] as const;
const TIER_LABELS = ['All', 'S', 'A', 'B', 'C'];
const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

// --- Formation Slot ---

function FormationSlot({ influencer: inf, isCaptain, onTap, onRemove, onEmptyTap }: {
  influencer: Influencer | null; index: number; isCaptain: boolean;
  onTap: () => void; onRemove: () => void; onEmptyTap?: () => void;
}) {
  const sz = isCaptain ? 72 : 64;
  const tierColor = inf ? TIER_CONFIG[inf.tier].color : colors.cardBorder;

  if (!inf) {
    return (
      <TouchableOpacity style={[s.slotWrap, { width: sz + 24 }]} onPress={onEmptyTap} activeOpacity={0.6}>
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
    <View style={[s.slotWrap, { width: sz + 24 }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={onTap}>
        <View style={{
          width: sz, height: sz, borderRadius: sz / 2, justifyContent: 'center',
          alignItems: 'center', borderColor: isCaptain ? colors.brand : tierColor,
          borderWidth: isCaptain ? 3 : 2,
        }}>
          <Image
            source={{ uri: inf.avatar }}
            style={{ width: sz - 6, height: sz - 6, borderRadius: (sz - 6) / 2, backgroundColor: colors.surface }}
          />
          {isCaptain && (
            <View style={s.captainBadge}>
              <Text style={s.captainBadgeText}>2x</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={s.removeBtn} onPress={onRemove} hitSlop={8}>
        <Text style={s.removeBtnText}>x</Text>
      </TouchableOpacity>
      <Text style={s.slotHandle} numberOfLines={1}>@{inf.handle}</Text>
      <View style={[s.tierDot, { backgroundColor: tierColor }]} />
    </View>
  );
}

// --- Picker Card ---

function PickerCard({ influencer: inf, isPicked, isDisabled, onAdd, onLongPress }: {
  influencer: Influencer; isPicked: boolean; isDisabled: boolean; onAdd: () => void; onLongPress: () => void;
}) {
  const tc = TIER_CONFIG[inf.tier];
  return (
    <Pressable
      style={[s.card, isPicked && { opacity: 0.5 }]}
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
          <View style={[s.cardTierBadge, { backgroundColor: tc.bg }]}>
            <Text style={[s.cardTierText, { color: tc.color }]}>{tc.label}</Text>
          </View>
        </View>
      </View>
      <View style={s.cardRight}>
        <Text style={s.cardPrice}>{inf.price} cr</Text>
        <Text style={s.cardScore}>{formatNumber(inf.totalPoints)} pts</Text>
      </View>
      <TouchableOpacity
        style={[
          s.addBtn,
          isPicked && { backgroundColor: colors.success + '22', borderColor: colors.success },
          isDisabled && !isPicked && { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
        onPress={onAdd}
        disabled={isDisabled && !isPicked}
        activeOpacity={0.6}
      >
        <Text style={[
          s.addBtnText,
          isPicked && { color: colors.success, fontSize: 16 },
          isDisabled && !isPicked && { color: colors.textMuted },
        ]}>
          {isPicked ? '\u2713' : '+'}
        </Text>
      </TouchableOpacity>
    </Pressable>
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
        <View style={[s.sheetTierBadge, { backgroundColor: tc.bg }]}>
          <Text style={[s.sheetTierText, { color: tc.color }]}>{tc.label}</Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={s.sheetStats}>
        <View style={s.sheetStatItem}>
          <Text style={s.sheetStatValue}>{formatNumber(influencer.totalPoints)}</Text>
          <Text style={s.sheetStatLabel}>Total Points</Text>
        </View>
        <View style={s.sheetStatItem}>
          <Text style={s.sheetStatValue}>{influencer.price} cr</Text>
          <Text style={s.sheetStatLabel}>Cost</Text>
        </View>
        <View style={s.sheetStatItem}>
          <Text style={s.sheetStatValue}>{formatNumber(influencer.followers)}</Text>
          <Text style={s.sheetStatLabel}>Followers</Text>
        </View>
        <View style={s.sheetStatItem}>
          <Text style={s.sheetStatValue}>{influencer.engagementRate.toFixed(1)}%</Text>
          <Text style={s.sheetStatLabel}>Engagement</Text>
        </View>
      </View>
    </View>
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
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [sheetInfluencer, setSheetInfluencer] = useState<Influencer | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [overBudgetMsg, setOverBudgetMsg] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

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
  const spent = useMemo(() => picks.reduce((sum, p) => sum + (p?.price ?? 0), 0), [picks]);
  const remaining = BUDGET - spent;

  const addInfluencer = useCallback((inf: Influencer) => {
    if (pickedIds.has(inf.id)) return;
    if (inf.price > remaining) {
      haptics.error();
      setOverBudgetMsg(`${inf.handle} costs ${inf.price} cr — ${remaining} remaining`);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setOverBudgetMsg(''), 2500);
      return;
    }
    const slot = picks.findIndex((p) => p === null);
    if (slot === -1) { haptics.error(); return; }
    animate(); haptics.selection();
    const next = [...picks]; next[slot] = inf; setPicks(next);
  }, [picks, pickedIds, remaining]);

  const removeInfluencer = useCallback((idx: number) => {
    animate(); haptics.light();
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

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      haptics.impact();
      (navigation as any).navigate('Auth');
      return;
    }
    const filled = picks.filter(Boolean) as Influencer[];
    if (filled.length < TEAM) { haptics.error(); return; }
    const captain = picks[captainIndex] ?? filled[0];
    Alert.alert('Submit Team',
      `Submit with captain @${captain.handle}?`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Submit', onPress: async () => {
        setIsSubmitting(true);
        try {
          const adjectives = ['Alpha', 'Sigma', 'Based', 'Degen', 'Diamond', 'Moon', 'Turbo', 'Mega', 'Ultra', 'Chad'];
          const nouns = ['Snipers', 'Whales', 'Bulls', 'Kings', 'Scouts', 'Hunters', 'Legends', 'Squad', 'Crew', 'Pack'];
          const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
          await api.post(`/api/v2/contests/${contestId}/team`, {
            teamName: randomName,
            influencerIds: filled.map((i) => i.id),
            captainId: captain.id,
          });
          haptics.success();
          setShowConfetti(true);
          // Clear beforeRemove guard, then navigate back to contest detail
          setPicks(Array(TEAM).fill(null));
          setTimeout(() => {
            (navigation as any).navigate('ContestDetail', { contestId, justEntered: true });
          }, 1800);
        } catch (err: any) {
          haptics.error();
          const msg = err?.response?.data?.error ?? (err?.message?.includes('Network') ? 'Network error. Check your connection.' : 'Failed to submit team');
          Alert.alert('Error', msg);
        } finally { setIsSubmitting(false); }
      }}],
    );
  }, [picks, captainIndex, contestId, navigation, isAuthenticated]);

  const canSubmit = pickCount === TEAM && !isSubmitting;
  const rows = [[0], [1, 2], [3, 4]];

  const renderItem = useCallback(({ item }: { item: Influencer }) => {
    const picked = pickedIds.has(item.id);
    return (
      <PickerCard
        influencer={item}
        isPicked={picked}
        isDisabled={picked || pickCount >= TEAM || item.price > remaining}
        onAdd={() => !picked && addInfluencer(item)}
        onLongPress={() => openSheet(item)}
      />
    );
  }, [pickedIds, pickCount, remaining, addInfluencer, openSheet]);

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      {/* Budget */}
      <Animated.View style={[s.budget, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={s.budgetRow}>
          <Text style={s.budgetLabel}>Budget</Text>
          <Text style={{ fontSize: 14, fontWeight: '700' }}>
            <Text style={{ color: remaining < 15 ? colors.error : colors.brand }}>{remaining}</Text>
            <Text style={{ color: colors.textMuted }}> / {BUDGET}</Text>
          </Text>
        </View>
        <View style={s.budgetTrack}>
          <View style={[s.budgetFill, {
            width: `${(spent / BUDGET) * 100}%`,
            backgroundColor: remaining < 15 ? colors.error : colors.brand,
          }]} />
        </View>
        {overBudgetMsg !== '' && (
          <Text style={s.overBudgetMsg}>{overBudgetMsg}</Text>
        )}
      </Animated.View>

      {/* Formation */}
      <View style={s.formation}>
        {pickCount === 0 && (
          <Text style={s.formationHint}>Build your dream team</Text>
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
        <View style={{ gap: 6 }}>
          <Text style={s.pickCount}>{pickCount}/{TEAM} Picks</Text>
          <View style={s.dots}>
            {Array.from({ length: TEAM }).map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: picks[i] ? colors.brand : colors.surface }]} />
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={[s.submitBtn, !canSubmit && { backgroundColor: colors.surface }]}
          onPress={handleSubmit} disabled={!canSubmit} activeOpacity={0.75}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={[s.submitText, !canSubmit && { color: colors.textMuted }]}>Submit Team</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Influencer Detail Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[300]}
        enablePanDownToClose
        onClose={() => setSheetInfluencer(null)}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
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
          colors={[colors.brand, colors.cyan, '#10B981', '#F59E0B', '#EF4444']}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles ---

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Budget
  budget: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  budgetLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  budgetTrack: { height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: 'hidden' },
  budgetFill: { height: 4, borderRadius: 2 },
  overBudgetMsg: { color: colors.error, fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  // Formation
  formation: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  formationHint: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 4, letterSpacing: 0.3 },
  formationRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  slotWrap: { alignItems: 'center', gap: 4 },
  emptySlot: {
    borderWidth: 2, borderColor: colors.cardBorder, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card,
  },
  emptyIcon: { color: colors.textMuted, fontSize: 22, fontWeight: '700', opacity: 0.5 },
  slotHandle: { color: colors.textSecondary, fontSize: 10, fontWeight: '500', maxWidth: 80, textAlign: 'center' },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  captainBadge: {
    position: 'absolute', top: -6, right: -6, backgroundColor: colors.brand,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  captainBadgeText: { color: colors.background, fontSize: 9, fontWeight: '800' },
  removeBtn: {
    position: 'absolute', top: -2, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  removeBtnText: { color: colors.white, fontSize: 10, fontWeight: '800', lineHeight: 12 },

  // Picker
  picker: { flex: 1, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  tierTabs: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  tierTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  tierTabText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    marginHorizontal: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1,
    borderColor: colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  cardAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  cardInfo: { flex: 1, gap: 2 },
  cardHandle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { color: colors.textSecondary, fontSize: 12, maxWidth: 100 },
  cardTierBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  cardTierText: { fontSize: 10, fontWeight: '700' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardPrice: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  cardScore: { color: colors.textMuted, fontSize: 11 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.brand + '22', borderWidth: 1, borderColor: colors.brand,
  },
  addBtnText: { color: colors.brand, fontSize: 18, fontWeight: '700', lineHeight: 20 },

  // Misc
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },

  // Bottom
  bottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1,
    borderTopColor: colors.cardBorder, backgroundColor: colors.card,
  },
  pickCount: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  submitBtn: {
    backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 10, minWidth: 130, alignItems: 'center',
  },
  submitText: { color: colors.background, fontSize: 15, fontWeight: '800' },

  // Bottom Sheet
  sheetContent: { paddingHorizontal: 20, paddingBottom: 24 },
  sheetHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: 20 },
  sheetAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, overflow: 'hidden' as const, justifyContent: 'center' as const, alignItems: 'center' as const },
  sheetAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  sheetHandle: { color: colors.text, fontSize: 16, fontWeight: '700' as const },
  sheetName: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  sheetTierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sheetTierText: { fontSize: 12, fontWeight: '700' as const },
  sheetStats: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12 },
  sheetStatItem: {
    flex: 1, minWidth: '40%' as any, backgroundColor: colors.surface,
    borderRadius: 10, padding: 12, alignItems: 'center' as const,
  },
  sheetStatValue: { color: colors.text, fontSize: 18, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as any },
  sheetStatLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' as const, marginTop: 4 },
});
