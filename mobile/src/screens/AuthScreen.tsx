import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMobileWallet } from '../utils/useMobileWallet';
import { useAuth } from '../providers/AuthProvider';
import api from '../services/api';
import { colors } from '../constants/colors';
import { haptics } from '../utils/haptics';

type LoginMethod = 'idle' | 'wallet' | 'twitter' | 'email';

export default function AuthScreen() {
  const { signIn } = useMobileWallet();
  const { login } = useAuth();
  const navigation = useNavigation();
  const [activeMethod, setActiveMethod] = useState<LoginMethod>('idle');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isLoading = activeMethod !== 'idle';

  // ── Wallet Connect (MWA / SIWS) ──────────────────────────────
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
        navigation.goBack();
      }
    } catch (err: any) {
      haptics.error();
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setActiveMethod('idle');
    }
  }, [signIn, login, navigation]);

  // ── Twitter OAuth ─────────────────────────────────────────────
  const handleTwitterLogin = useCallback(async () => {
    try {
      setActiveMethod('twitter');
      setError(null);
      haptics.impact();

      const response = await api.post('/api/auth/twitter-mobile');

      if (response.data.success) {
        haptics.success();
        await login(
          response.data.data.accessToken,
          response.data.data.refreshToken,
          response.data.data.user,
        );
        navigation.goBack();
      }
    } catch (err: any) {
      haptics.error();
      const msg = err?.response?.data?.error
        ?? (err?.message?.includes('Network') ? 'Network error. Check your connection.' : 'Twitter login is not available yet.');
      setError(msg);
    } finally {
      setActiveMethod('idle');
    }
  }, [login, navigation]);

  // ── Email Login ───────────────────────────────────────────────
  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setActiveMethod('email');
      setError(null);
      haptics.impact();

      const response = await api.post('/api/auth/email-mobile', { email: email.trim() });

      if (response.data.success && response.data.data?.accessToken) {
        haptics.success();
        await login(
          response.data.data.accessToken,
          response.data.data.refreshToken,
          response.data.data.user,
        );
        navigation.goBack();
      } else {
        // Magic link sent
        setEmailSent(true);
        haptics.success();
      }
    } catch (err: any) {
      haptics.error();
      const msg = err?.response?.data?.error
        ?? (err?.message?.includes('Network') ? 'Network error. Check your connection.' : 'Email login is not available yet.');
      setError(msg);
    } finally {
      setActiveMethod('idle');
    }
  }, [email, login, navigation]);

  // ── Skip / Browse as Guest ────────────────────────────────────
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

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>CT</Text>
          <Text style={styles.logoSubtext}>FORESIGHT</Text>
        </View>

        <Text style={styles.tagline}>Draft. Compete. Win.</Text>

        {/* ── Login Options ─────────────────────── */}
        <View style={styles.options}>
          {/* Wallet Connect */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleWalletConnect}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {activeMethod === 'wallet' ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="wallet" size={20} color={colors.background} />
                <Text style={styles.optionButtonText}>Connect Wallet</Text>
              </>
            )}
          </TouchableOpacity>

          {/* More sign-in options note */}
          <Text style={styles.comingSoonNote}>
            More sign-in methods coming soon
          </Text>

          {emailSent ? (
            <View style={styles.emailSentCard}>
              <MaterialCommunityIcons name="email-check-outline" size={24} color={colors.success} />
              <Text style={styles.emailSentText}>Check your email for a login link.</Text>
            </View>
          ) : (
            <View style={styles.emailInputRow}>
              <TextInput
                style={styles.emailInput}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.emailSubmitBtn, (!email.includes('@') || isLoading) && { opacity: 0.5 }]}
                onPress={handleEmailSubmit}
                disabled={!email.includes('@') || isLoading}
                activeOpacity={0.7}
              >
                {activeMethod === 'email' ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <MaterialCommunityIcons name="arrow-right" size={20} color={colors.background} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Browse as guest</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.solBadge}>
            <MaterialCommunityIcons name="circle" size={8} color={colors.success} />
            <Text style={styles.footerText}>Solana Mobile</Text>
          </View>
        </View>
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
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginTop: 12,
    marginBottom: 32,
    opacity: 0.4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.brand,
    letterSpacing: 6,
  },
  logoSubtext: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 8,
    marginTop: -4,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 40,
  },

  // Options
  options: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.brand,
    paddingVertical: 18,
    borderRadius: 14,
    width: '100%',
  },
  optionButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  socialButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },

  comingSoonNote: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 13,
  },

  // Email
  emailInputRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  emailInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  emailSubmitBtn: {
    backgroundColor: colors.brand,
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailSentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  emailSentText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // Error
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },

  // Skip
  skipButton: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  solBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  soonBadge: {
    backgroundColor: colors.textMuted + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  soonText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
