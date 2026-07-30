import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, TextInput, theme } from '@jayedaad/ui-native';

export function VerifyEmailScreen() {
  const { verifyOtp, sendOtp } = useAuthViewModel();
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify() {
    await verifyOtp.mutateAsync(code);
    // AuthGateProvider watches auth state and auto-closes the sheet (firing
    // whatever action triggered it) once isEmailVerified flips true.
  }

  async function handleResend() {
    await sendOtp.mutateAsync();
    setResendCooldown(60);
  }

  const errorMessage = (verifyOtp.error as any)?.response?.data?.message;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code we just sent to your email.</Text>

        <View style={styles.form}>
          <TextInput
            label="Verification code"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
          />

          {verifyOtp.isError && <Text style={styles.error}>{errorMessage || 'Incorrect or expired code.'}</Text>}

          <Button
            label={verifyOtp.isPending ? 'Verifying…' : 'Verify'}
            onPress={handleVerify}
            disabled={verifyOtp.isPending || code.length !== 6}
          />
          <Button
            label={resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            variant="secondary"
            onPress={handleResend}
            disabled={sendOtp.isPending || resendCooldown > 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.md },
  error: { fontSize: 13, color: theme.colors.danger },
});
