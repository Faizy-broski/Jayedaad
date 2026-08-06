import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, TextInput, theme } from '@jayedaad/ui-native';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
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
  if (/supabase client not configured/i.test(message)) {
    return "The app isn't configured to reach our servers yet — this is a setup issue, not your credentials.";
  }
  return message || 'Something went wrong — check your connection and try again.';
}

// Full-bleed singup.webp behind a uniform white wash (rather than a
// contained hero box) so the photo reads faintly through the whole screen —
// same pairing used on the marketing "Verified First" splash, just light
// instead of dark-green. Field order mirrors the Zameen mobile reference
// (brand mark -> title -> email/password -> Forgot Password -> Log In ->
// divider -> Google -> Sign Up prompt). Facebook/Apple omitted per the
// "Google only" scope decision already applied to web — no sign-in flow is
// wired up for them.
export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signIn } = useAuthViewModel();
  const { signInWithGoogle, isPending: isGooglePending } = useGoogleSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeChecked] = useState(false);

  async function handleSignIn() {
    setRememberMe(rememberMe);
    await signIn.mutateAsync({ email, password });
    // AuthGateProvider watches auth state and auto-closes the sheet (firing
    // whatever action triggered it) once this resolves — nothing to do here.
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

            <Button
              label={signIn.isPending ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
              disabled={signIn.isPending}
              size="lg"
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Google"
            variant="secondary"
            size="lg"
            onPress={() => {
              setRememberMe(rememberMe);
              signInWithGoogle();
            }}
            disabled={isGooglePending}
          />

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
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: 12, color: theme.colors.muted },
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
});
