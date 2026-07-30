import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, TextInput, theme } from '@jayedaad/ui-native';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { setRememberMe } from '../../lib/rememberMeStorage';

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

// Field order/styling mirrors the Zameen mobile reference (icon badge ->
// title -> email/password -> Forgot Password -> Log In -> divider -> Google
// -> Sign Up prompt). Facebook omitted per the "Google only" scope decision
// already applied to web.
export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signIn } = useAuthViewModel();
  const { signInWithGoogle, isPending: isGooglePending } = useGoogleSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeChecked] = useState(true);

  async function handleSignIn() {
    setRememberMe(rememberMe);
    await signIn.mutateAsync({ email, password });
    // AuthGateProvider watches auth state and auto-closes the sheet (firing
    // whatever action triggered it) once this resolves — nothing to do here.
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconBadge}>
          <Ionicons name="mail-outline" size={32} color={theme.colors.primary} />
          <View style={styles.iconCheck}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Log In to Continue</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            autoComplete="current-password"
          />

          <View style={styles.rememberRow}>
            <Pressable style={styles.rememberMeTap} onPress={() => setRememberMeChecked((v) => !v)}>
              <Checkbox checked={rememberMe} onChange={setRememberMeChecked} />
              <Text style={styles.rememberMeLabel}>Remember Me</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Forgot Password?</Text>
            </Pressable>
          </View>

          {signIn.isError && <Text style={styles.error}>{describeSignInError(signIn.error)}</Text>}

          <Button
            label={signIn.isPending ? 'Logging in…' : 'Log In'}
            onPress={handleSignIn}
            disabled={signIn.isPending}
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
          onPress={() => {
            setRememberMe(rememberMe);
            signInWithGoogle();
          }}
          disabled={isGooglePending}
        />

        <Text style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
            Sign Up with Email
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  iconBadge: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.bg,
    borderRadius: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.xl },
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
