import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, TextInput, theme } from '@jayedaad/ui-native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthBrandHeader } from '../../components/AuthBrandHeader';
import bgImage from '../../../assets/images/singup.webp';

// Same full-bleed-background + pill-input treatment as ForgotPasswordScreen
// (and Login/Signup before it) — native stack header hidden in favor of the
// "Back to sign in" link, same reasoning as ForgotPasswordScreen.
export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const { confirmPasswordReset, requestPasswordReset } = useAuthViewModel();

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit() {
    if (newPassword !== confirmNewPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    await confirmPasswordReset.mutateAsync({ email, code, newPassword });
    navigation.navigate('Login');
  }

  async function handleResend() {
    await requestPasswordReset.mutateAsync(email);
    setResendCooldown(60);
    const tick = () => setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    const interval = setInterval(tick, 1000);
    setTimeout(() => clearInterval(interval), 60_000);
  }

  const errorMessage = (confirmPasswordReset.error as any)?.response?.data?.message;

  return (
    <View style={styles.root}>
      <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.wash} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthBrandHeader />

          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>Enter the code we emailed you and choose a new password.</Text>

          <View style={styles.form}>
            <TextInput
              label="Email Address"
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
              label="Reset Code"
              icon="key-outline"
              variant="pill"
              placeholder="6-digit code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <TextInput
              label="New Password"
              icon="lock-closed-outline"
              variant="pill"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureToggle
              autoComplete="new-password"
            />
            <TextInput
              label="Confirm New Password"
              icon="lock-closed-outline"
              variant="pill"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureToggle
              autoComplete="new-password"
            />

            {passwordMismatch && <Text style={styles.error}>Passwords don&apos;t match.</Text>}
            {confirmPasswordReset.isError && (
              <Text style={styles.error}>{errorMessage || 'Incorrect or expired code.'}</Text>
            )}

            <Button
              label={confirmPasswordReset.isPending ? 'Resetting…' : 'Reset password'}
              onPress={handleSubmit}
              disabled={confirmPasswordReset.isPending || code.length !== 6}
              size="lg"
            />
            <Button
              label={resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              variant="secondary"
              onPress={handleResend}
              disabled={requestPasswordReset.isPending || resendCooldown > 0}
              size="lg"
            />
          </View>

          <Text style={styles.footer}>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Back to sign in
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
  error: { fontSize: 13, color: theme.colors.danger },
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
  link: { color: theme.colors.primary, fontWeight: '600' },
});
