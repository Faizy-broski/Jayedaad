import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, TextInput, theme } from '@jayedaad/ui-native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>Enter the code we emailed you and choose a new password.</Text>

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
            placeholder="Reset code"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
          />
          <TextInput
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureToggle
            autoComplete="new-password"
          />
          <TextInput
            placeholder="Confirm new password"
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
          />
          <Button
            label={resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            variant="secondary"
            onPress={handleResend}
            disabled={requestPasswordReset.isPending || resendCooldown > 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.md },
  error: { fontSize: 13, color: theme.colors.danger },
});
