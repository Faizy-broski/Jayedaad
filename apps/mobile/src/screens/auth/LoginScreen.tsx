import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUserEmailVerified, useAuthStore, useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, TextInput, theme } from '@jayedaad/ui-native';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useAppleSignIn } from '../../hooks/useAppleSignIn';
import { GoogleIcon, AppleIcon } from '../../components/SocialIcons';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { setRememberMe } from '../../lib/rememberMeStorage';
import { AuthBrandHeader } from '../../components/AuthBrandHeader';
import bgImage from '../../../assets/images/singup.webp';

// Supabase's real "wrong email/password" rejection has this exact message
// (AuthApiError, invalid_credentials) — anything else (missing/invalid
// Supabase client config, network failure, etc.) is a different problem and
// showing "Incorrect email or password" for it would be actively misleading.
function describeSignInError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/invalid login credentials/i.test(message)) {
    return 'Incorrect email or password.';
  }
  // "User is banned" (AuthApiError, code user_banned — confirmed
  // empirically against this project) is what a suspended account's
  // sign-in attempt actually returns. Without this branch it fell through
  // to the raw Supabase wording below, which isn't wrong but reads oddly
  // next to this screen's other messages.
  if (/user is banned/i.test(message)) {
    return 'Your account has been suspended. Contact support if you think this is a mistake.';
  }
  if (/supabase client not configured/i.test(message)) {
    return "The app isn't configured to reach our servers yet — this is a setup issue, not your credentials.";
  }
  return message || 'Something went wrong — check your connection and try again.';
}

// useGoogleSignIn/useAppleSignIn already pass through whatever raw
// error/error_description Supabase puts on the redirect (better than
// swallowing it), but a suspended account's ban rejection reads oddly
// unrewritten next to this screen's other messages — same "banned" match as
// describeSignInError above, just applied to the OAuth error string instead
// of an Error object.
function describeSocialError(message: string): string {
  if (/banned/i.test(message)) {
    return 'Your account has been suspended. Contact support if you think this is a mistake.';
  }
  return message;
}

// Full-bleed singup.webp behind a uniform white wash (rather than a
// contained hero box) so the photo reads faintly through the whole screen —
// same pairing used on the marketing "Verified First" splash, just light
// instead of dark-green. Field order mirrors the Zameen mobile reference
// (brand mark -> title -> email/password -> Forgot Password -> Log In ->
// divider -> Google/Apple -> Sign Up prompt). Facebook remains omitted (no
// sign-in flow wired up for it); Apple was added to match web's parity
// requirement — Google and Apple ID sign-in on both platforms.
export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signIn, sendOtp } = useAuthViewModel();
  const { signInWithGoogle, isPending: isGooglePending } = useGoogleSignIn();
  const { signInWithApple, isPending: isApplePending } = useAppleSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeChecked] = useState(true);
  const [socialError, setSocialError] = useState('');
  // Covers the whole post-auth flow, not just signIn/isGooglePending/
  // isApplePending — those flip back to false the instant their own
  // mutation resolves, re-enabling the button while goToVerifyIfNeeded()
  // (a real sendOtp network call) is still running underneath. A second
  // tap in that window fired a genuine duplicate OTP send. Same fix web's
  // login page already has via its own `redirecting` state.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AuthGateProvider only auto-closes the sheet once isFullySatisfied
  // (verified, no pending agency docs) — for a successful-but-unverified
  // sign-in that effect does nothing, and nothing else navigates the
  // sheet's internal AuthNavigator stack (initialRouteName only sets the
  // *starting* screen). Without this, sign-in silently succeeded in the
  // background but the sheet just sat frozen on Login forever with no OTP
  // ever sent — same explicit-navigate pattern SignupScreen.tsx already
  // uses after its own sign-up.
  async function goToVerifyIfNeeded() {
    // useAuthStore.getState() (not the hook's `user`, a stale closure from
    // this render) reads the session onAuthStateChange just updated after
    // sign-in resolved — a synchronous JWT-claim read, no round trip,
    // unlike the old GET /auth/otp/status query this used to await here.
    if (getUserEmailVerified(useAuthStore.getState().user)) return;
    let otpSendFailed = false;
    try {
      await sendOtp.mutateAsync();
    } catch {
      otpSendFailed = true;
    }
    navigation.navigate('VerifyEmail', otpSendFailed ? { otpSendFailed: true } : undefined);
  }

  async function handleGoogleSignIn() {
    setSocialError('');
    setRememberMe(rememberMe);
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      // Was `if (result.error) ... else goToVerifyIfNeeded()` — result.error
      // is also undefined when the user just cancelled/dismissed the
      // browser sheet (cancelled: true, no session ever established), so
      // that fell into the success branch too: refetchEmailVerified() with
      // no session, sendOtp() with no session, both failing, landing the
      // user on VerifyEmail with a false "couldn't send code" banner right
      // after they cancelled. Branch on success explicitly instead.
      if (result.success) await goToVerifyIfNeeded();
      else if (result.error) setSocialError(result.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAppleSignIn() {
    setSocialError('');
    setRememberMe(rememberMe);
    setIsSubmitting(true);
    try {
      const result = await signInWithApple();
      if (result.success) await goToVerifyIfNeeded();
      else if (result.error) setSocialError(result.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignIn() {
    setRememberMe(rememberMe);
    setIsSubmitting(true);
    try {
      await signIn.mutateAsync({ email, password });
      await goToVerifyIfNeeded();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.wash} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthBrandHeader />

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your search across Pakistan.</Text>

          <View style={styles.form}>
            <TextInput
              label="Email or phone"
              icon="mail-outline"
              variant="pill"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              label="Password"
              icon="lock-closed-outline"
              variant="pill"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureToggle
              autoComplete="current-password"
            />

            <View style={styles.rememberRow}>
              <Pressable style={styles.rememberMeTap} onPress={() => setRememberMeChecked((v) => !v)}>
                <Checkbox checked={rememberMe} onChange={setRememberMeChecked} />
                <Text style={styles.rememberMeLabel}>Remember me</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </View>

            {signIn.isError && <Text style={styles.error}>{describeSignInError(signIn.error)}</Text>}
            {!!socialError && <Text style={styles.error}>{describeSocialError(socialError)}</Text>}

            <Button
              label={isSubmitting ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
              disabled={isSubmitting}
              size="lg"
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Button
              label="Google"
              icon={<GoogleIcon />}
              variant="muted"
              size="lg"
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={isGooglePending || isSubmitting}
            />

            <Button
              label="Apple"
              icon={<AppleIcon />}
              variant="muted"
              size="lg"
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              disabled={isApplePending || isSubmitting}
            />
          </View>

          <Text style={styles.footer}>
            New to Jayedaad?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
              Create an account
            </Text>
          </Text>
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
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  form: { gap: theme.spacing.md },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rememberMeTap: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rememberMeLabel: { fontSize: 13, color: theme.colors.text },
  error: { fontSize: 13, color: theme.colors.danger },
  link: { color: theme.colors.primary, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginVertical: theme.spacing.lg },
  socialButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  socialButton: { flex: 1 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: 12, color: theme.colors.muted },
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
});
