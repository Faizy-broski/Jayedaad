import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COUNTRIES, getMaxPhoneDigits, useAuthViewModel } from '@jayedaad/core';
import { Button, CountryCodeField, TextInput, theme } from '@jayedaad/ui-native';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { setRememberMe } from '../../lib/rememberMeStorage';

// Field order/styling mirrors the Zameen mobile reference (title -> Name ->
// Email -> Password -> Phone with +92 prefix -> Register Now -> Log In
// prompt -> implied-consent terms text). No separate confirm-password or
// marketing checkbox in this reference, unlike the web version — matching
// what was actually shown rather than carrying over web's exact field set.
// Consent is implied by pressing "Register Now" (no checkbox), same as the
// reference — termsAcceptedAt is still recorded at submit time.
export function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signUp, sendOtp } = useAuthViewModel();
  const { signInWithGoogle, isPending: isGooglePending } = useGoogleSignIn();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('92');

  async function handleSignUp() {
    // rememberMeStorage's flag is module-level and only exposed as a toggle
    // on LoginScreen — a signed-up account should persist normally, in case
    // a prior unchecked login in this same app session left it false.
    setRememberMe(true);
    await signUp.mutateAsync({
      email,
      password,
      name,
      phone: phone ? `+${dialCode.replace(/\D/g, '')}${phone}` : undefined,
      termsAcceptedAt: new Date().toISOString(),
    });
    await sendOtp.mutateAsync();
    // AuthNavigator now stays mounted (inside the auth sheet) across the
    // whole signed-up-but-unverified state instead of being remounted by a
    // root-level gate swap, so it won't land on VerifyEmail on its own —
    // navigate there explicitly.
    navigation.navigate('VerifyEmail');
  }

  const isPending = signUp.isPending || sendOtp.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Become a Free Member</Text>

        <View style={styles.form}>
          <TextInput placeholder="Your Name" value={name} onChangeText={setName} autoComplete="name" />
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
            autoComplete="new-password"
          />

          <View style={styles.phoneRow}>
            <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={setDialCode} />
            <TextInput
              style={styles.phoneInput}
              placeholder="3XX XXXXXXX"
              value={phone}
              maxLength={getMaxPhoneDigits(dialCode)}
              onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
              keyboardType="number-pad"
              autoComplete="tel-national"
            />
          </View>

          {signUp.isError && <Text style={styles.error}>Could not create your account. Try again.</Text>}

          <Button label={isPending ? 'Registering…' : 'Register Now'} onPress={handleSignUp} disabled={isPending} />
          <Button
            label="Continue with Google"
            variant="secondary"
            onPress={() => signInWithGoogle()}
            disabled={isGooglePending}
          />
        </View>

        <Text style={styles.footer}>
          Already a member?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Log In Instead
          </Text>
        </Text>

        <Text style={styles.terms}>
          By pressing "Register Now" I declare that I&apos;ve read and I agree to the Jayedaad{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Terms')}>
            Terms &amp; Conditions
          </Text>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.md },
  phoneRow: { flexDirection: 'row', gap: theme.spacing.sm },
  phonePrefix: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  phonePrefixText: { fontSize: 15, color: theme.colors.text },
  phoneInput: { flex: 1 },
  error: { fontSize: 13, color: theme.colors.danger },
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
  link: { color: theme.colors.primary, fontWeight: '600' },
  terms: { fontSize: 11, color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
});
