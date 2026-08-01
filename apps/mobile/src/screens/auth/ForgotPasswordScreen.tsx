import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, TextInput, theme } from '@jayedaad/ui-native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthBrandHeader } from '../../components/AuthBrandHeader';
import bgImage from '../../../assets/images/singup.webp';

// Custom OTP-based reset (services/api/src/auth/password-reset) — NOT
// Supabase's built-in reset-link email. This screen just requests the code;
// entering it + the new password happens on ResetPasswordScreen. Same
// full-bleed-background + pill-input treatment as Login/Signup — the native
// stack header is hidden (AuthNavigator's headerShown: false) in favor of
// the "Back to sign in" link, matching how Login/Signup have no back header
// either.
export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { requestPasswordReset } = useAuthViewModel();
  const [email, setEmail] = useState('');

  async function handleSubmit() {
    await requestPasswordReset.mutateAsync(email);
    navigation.navigate('ResetPassword', { email });
  }

  return (
    <View style={styles.root}>
      <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.wash} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthBrandHeader />

          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a reset code.</Text>

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
            <Button
              label={requestPasswordReset.isPending ? 'Sending…' : 'Send reset code'}
              onPress={handleSubmit}
              disabled={requestPasswordReset.isPending || !email}
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
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
  link: { color: theme.colors.primary, fontWeight: '600' },
});
