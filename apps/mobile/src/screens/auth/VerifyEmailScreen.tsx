import { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, theme } from '@jayedaad/ui-native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthBrandHeader } from '../../components/AuthBrandHeader';
import bgImage from '../../../assets/images/singup.webp';

const CODE_LENGTH = 6;

// Same full-bleed-background + brand-header treatment as the other
// redesigned auth screens, plus a boxed-digit code input (a single hidden
// TextInput captures keystrokes; the boxes below are purely visual) instead
// of the old plain labeled field.
export function VerifyEmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'VerifyEmail'>>();
  const { verifyOtp, sendOtp, isEmailVerified, role, agentId, user } = useAuthViewModel();
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSendFailed, setOtpSendFailed] = useState(!!route.params?.otpSendFailed);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Mirrors web's verify-email landingRoute() special-case: once verified,
  // a freshly self-registered agency owner goes to the document-upload step
  // instead of AuthGateProvider silently closing the sheet (which it won't
  // do yet anyway — see needsAgencyDocuments there — but nothing else would
  // navigate this screen away on its own).
  useEffect(() => {
    if (!isEmailVerified || isProfileLoading) return;
    if (role === 'agent' && agentId && profile?.agency && profile.agency.verificationStatus !== 'verified') {
      navigation.navigate('BecomeAnAgent');
    }
  }, [isEmailVerified, isProfileLoading, role, agentId, profile, navigation]);

  async function handleVerify() {
    // Same re-entry guard as web's verify-email page — closes the narrow
    // race where a duplicate submission (double-tap before `disabled`
    // re-renders) races the first request, consuming the code twice and
    // surfacing a confusing "No active code" error right before an
    // unrelated-seeming redirect once the first request's refreshSession()
    // resolves.
    if (verifyOtp.isPending) return;
    await verifyOtp.mutateAsync(code);
    // AuthGateProvider watches auth state and auto-closes the sheet (firing
    // whatever action triggered it) once isEmailVerified flips true — unless
    // needsAgencyDocuments holds it open, in which case the effect above
    // routes here to BecomeAnAgent instead.
  }

  // sendOtp.isPending must actually gate this, not just relabel it —
  // previously the "Resend" text stayed pressable the whole time a request
  // was in flight (RN Text's onPress has no built-in disabled behavior the
  // way a Button/Pressable's disabled prop does), so a burst of taps before
  // the first request resolved could fire several real emails before
  // setResendCooldown(60) below ever landed — unlike web's Button, which
  // already disables on `sendOtp.isPending || resendCooldown > 0`.
  async function handleResend() {
    if (sendOtp.isPending || resendCooldown > 0) return;
    try {
      await sendOtp.mutateAsync();
      setOtpSendFailed(false);
      setResendCooldown(60);
    } catch {
      setOtpSendFailed(true);
    }
  }

  const errorMessage = (verifyOtp.error as any)?.response?.data?.message;

  return (
    <View style={styles.root}>
      <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.wash} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthBrandHeader />

          <Text style={styles.title}>Enter Your Code</Text>
          <Text style={styles.subtitle}>
            We sent a {CODE_LENGTH}-digit code to <Text style={styles.subtitleBold}>{user?.email}</Text>
          </Text>

          {otpSendFailed && (
            <Text style={styles.banner}>
              Your account was created, but we couldn&apos;t send your verification code. Tap &quot;Resend&quot; below to try
              again.
            </Text>
          )}

          <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View key={i} style={[styles.codeBox, i === code.length && styles.codeBoxActive]}>
                <Text style={styles.codeDigit}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
          <RNTextInput
            ref={inputRef}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoComplete="one-time-code"
            autoFocus
            style={styles.hiddenInput}
          />

          {verifyOtp.isError && <Text style={styles.error}>{errorMessage || 'Incorrect or expired code.'}</Text>}

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn&apos;t get it? </Text>
            {resendCooldown > 0 ? (
              <Text style={styles.resendCountdown}>Resend in 00:{String(resendCooldown).padStart(2, '0')}</Text>
            ) : (
              <Pressable onPress={handleResend} disabled={sendOtp.isPending} hitSlop={8}>
                <Text style={styles.link}>{sendOtp.isPending ? 'Sending…' : 'Resend'}</Text>
              </Pressable>
            )}
          </View>

          <Button
            label={verifyOtp.isPending ? 'Verifying…' : 'Verify & Continue'}
            onPress={handleVerify}
            disabled={verifyOtp.isPending || code.length !== CODE_LENGTH}
            size="lg"
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  wash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)' },
  safeArea: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingTop: theme.spacing.xxl, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.md },
  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  subtitleBold: { fontWeight: '700', color: theme.colors.text },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderWidth: 2, borderColor: theme.colors.primary },
  codeDigit: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  error: { fontSize: 13, color: theme.colors.danger, textAlign: 'center', marginBottom: theme.spacing.md },
  banner: {
    fontSize: 13,
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  resendLabel: { color: theme.colors.muted },
  resendCountdown: { fontWeight: '600', color: theme.colors.primary },
  link: { color: theme.colors.primary, fontWeight: '600' },
});
