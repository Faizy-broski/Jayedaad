import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, TextInput, theme } from '@jayedaad/ui-native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

// Custom OTP-based reset (services/api/src/auth/password-reset) — NOT
// Supabase's built-in reset-link email. This screen just requests the code;
// entering it + the new password happens on ResetPasswordScreen.
export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { requestPasswordReset } = useAuthViewModel();
  const [email, setEmail] = useState('');

  async function handleSubmit() {
    await requestPasswordReset.mutateAsync(email);
    navigation.navigate('ResetPassword', { email });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a reset code.</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Button
            label={requestPasswordReset.isPending ? 'Sending…' : 'Send reset code'}
            onPress={handleSubmit}
            disabled={requestPasswordReset.isPending || !email}
          />
        </View>

        <Text style={styles.footer}>
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Back to sign in
          </Text>
        </Text>
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
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
  link: { color: theme.colors.primary, fontWeight: '600' },
});
