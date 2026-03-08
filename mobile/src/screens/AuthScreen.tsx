import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMobileWallet } from '../utils/useMobileWallet';
import { useAuth } from '../providers/AuthProvider';
import api from '../services/api';
import { colors, elevation, textLevels, borders, brandAlpha, cyanAlpha } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, TOUCH_MIN } from '../constants/spacing';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoginMethod = 'idle' | 'wallet';
type Nav = NativeStackNavigationProp<RootStackParamList>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Layout-safe fade-in (no position:absolute like entering= prop)
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

export default function AuthScreen() {
  const { signIn } = useMobileWallet();
  const { login } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const [activeMethod, setActiveMethod] = useState<LoginMethod>('idle');
  const [error, setError] = useState<string | null>(null);

  const isLoading = activeMethod !== 'idle';

  // Press animation for CTA button
  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onPressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // ── Post-auth redirect ────────────────────────────────────
  const handlePostAuth = useCallback(() => {
    const returnTo = route.params?.returnTo;
    const returnParams = route.params?.returnParams;
    if (returnTo && returnTo !== 'Auth') {
      navigation.replace(returnTo as any, returnParams);
    } else {
      navigation.goBack();
    }
  }, [navigation, route.params]);

  // ── Wallet Connect (MWA / SIWS) ──────────────────────────
  const handleWalletConnect = useCallback(async () => {
    try {
      setActiveMethod('wallet');
      setError(null);
      haptics.impact();

      const account = await signIn({
        domain: 'ct-foresight.xyz',
        statement: 'Sign in to CT Foresight -- Draft. Compete. Win.',
        uri: 'https://ct-foresight.xyz',
      });

      const signInResult = account.signInResult;
      if (!signInResult) {
        throw new Error('Wallet did not return sign-in proof. Please try again.');
      }

      const response = await api.post('/api/auth/wallet-verify', {
        address: account.publicKey.toBase58(),
        signedMessage: Buffer.from(signInResult.signed_message).toString('base64'),
        signature: Buffer.from(signInResult.signature).toString('base64'),
      });

      if (response.data.success) {
        haptics.success();
        await login(
          response.data.data.accessToken,
          response.data.data.refreshToken,
          response.data.data.user,
        );
        handlePostAuth();
      }
    } catch (err: any) {
      haptics.error();
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setActiveMethod('idle');
    }
  }, [signIn, login, handlePostAuth]);

  // ── Demo Login (emulator / demo video) ───────────────────
  const handleDemoLogin = useCallback(async () => {
    try {
      setActiveMethod('wallet');
      setError(null);
      haptics.impact();

      const response = await api.post('/api/auth/demo-login');

      if (response.data.success) {
        haptics.success();
        await login(
          response.data.data.accessToken,
          response.data.data.refreshToken,
          response.data.data.user,
        );
        handlePostAuth();
      }
    } catch (err: any) {
      haptics.error();
      setError(err.response?.data?.error || err.message || 'Demo login failed');
    } finally {
      setActiveMethod('idle');
    }
  }, [login, handlePostAuth]);

  // ── Skip / Browse as Guest ────────────────────────────────
  const handleSkip = useCallback(() => {
    haptics.selection();
    navigation.goBack();
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Drag handle for modal */}
        <View style={styles.dragHandle} />

        {/* Ambient glow behind logo */}
        <FadeInView duration={600} style={styles.glowContainer}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
        </FadeInView>

        {/* Logo */}
        <FadeInView delay={100} duration={400} style={styles.logoContainer}>
          <Text style={styles.logoLine}>
            <Text style={styles.logoAccent}>CT</Text>
            <Text style={styles.logoName}> FORESIGHT</Text>
          </Text>
        </FadeInView>

        <FadeInView delay={200} duration={400}>
          <Text style={styles.tagline}>Draft. Compete. Win.</Text>
        </FadeInView>

        {/* Feature pills */}
        <FadeInView delay={300} duration={400} style={styles.pillRow}>
          <View style={styles.pill}>
            <MaterialCommunityIcons name="shield-sword" size={14} color={colors.brand} />
            <Text style={styles.pillText}>Fantasy CT</Text>
          </View>
          <View style={[styles.pill, styles.pillCyan]}>
            <MaterialCommunityIcons name="trophy" size={14} color={colors.cyan} />
            <Text style={[styles.pillText, { color: colors.cyan }]}>Win SOL</Text>
          </View>
          <View style={styles.pill}>
            <MaterialCommunityIcons name="chart-line" size={14} color={colors.brand} />
            <Text style={styles.pillText}>Track Scores</Text>
          </View>
        </FadeInView>

        {/* ── Login Options ─────────────────────── */}
        <FadeInView delay={400} duration={400} style={styles.options}>
          {/* Wallet Connect */}
          <AnimatedTouchable
            style={[styles.optionButton, buttonAnimStyle]}
            onPress={handleWalletConnect}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={isLoading}
            activeOpacity={1}
          >
            {activeMethod === 'wallet' ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="wallet" size={20} color={colors.background} />
                <Text style={styles.optionButtonText}>Connect Wallet</Text>
              </>
            )}
          </AnimatedTouchable>

          {/* Powered-by badge */}
          <View style={styles.mwaBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color={colors.textMuted} />
            <Text style={styles.mwaBadgeText}>Powered by Mobile Wallet Adapter</Text>
          </View>
        </FadeInView>

        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Skip */}
        <FadeInView delay={500} duration={400}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Browse as guest</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Try Demo — always available for judges / users without wallet */}
        <FadeInView delay={550} duration={400}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="play-circle-outline" size={16} color={colors.cyan} />
            <Text style={styles.demoText}>Try Demo</Text>
          </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={600} duration={400} style={styles.footer}>
          <View style={styles.solBadge}>
            <MaterialCommunityIcons name="circle" size={8} color={colors.success} />
            <Text style={styles.footerText}>Solana Mobile</Text>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: textLevels.muted,
    marginTop: spacing.md,
    marginBottom: spacing['2xl'],
    opacity: 0.4,
  },

  // Ambient glow
  glowContainer: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: brandAlpha['6'],
  },
  glowInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: brandAlpha['10'],
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing['3xl'],
  },
  logoLine: {
    flexDirection: 'row',
  },
  logoAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.brand,
    letterSpacing: 2,
  },
  logoName: {
    fontSize: 36,
    fontWeight: '700',
    color: textLevels.primary,
    letterSpacing: 3,
  },
  tagline: {
    ...typography.h2,
    color: textLevels.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: brandAlpha['8'],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  pillCyan: {
    backgroundColor: cyanAlpha['10'],
  },
  pillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.brand,
  },

  // Options
  options: {
    width: '100%',
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.brand,
    paddingVertical: spacing.lg + 2,
    borderRadius: 14,
    width: '100%',
    minHeight: 56,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  optionButtonText: {
    ...typography.body,
    color: colors.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mwaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
  },
  mwaBadgeText: {
    ...typography.caption,
    color: textLevels.muted,
  },

  // Error
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    marginTop: spacing.lg,
    textAlign: 'center',
  },

  // Skip
  skipButton: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
  },
  skipText: {
    ...typography.bodySm,
    color: textLevels.muted,
    fontSize: 15,
  },

  // Demo login
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: TOUCH_MIN,
    borderWidth: 1,
    borderColor: borders.subtle,
    borderRadius: 8,
    backgroundColor: elevation.surface,
  },
  demoText: {
    ...typography.caption,
    color: colors.cyan,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  solBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: elevation.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: borders.subtle,
  },
  footerText: {
    ...typography.caption,
    color: textLevels.muted,
    fontWeight: '600',
  },
});
