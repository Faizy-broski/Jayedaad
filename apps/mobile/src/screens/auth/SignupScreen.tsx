import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  COUNTRIES,
  getMaxPhoneDigits,
  PAKISTAN_CITIES,
  slugify,
  useAgencyRegistrationViewModel,
  useAuthViewModel,
} from '@jayedaad/core';
import { Button, CountryCodeField, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useAppleSignIn } from '../../hooks/useAppleSignIn';
import { GoogleIcon, AppleIcon } from '../../components/SocialIcons';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { setRememberMe } from '../../lib/rememberMeStorage';
import { AuthBrandHeader } from '../../components/AuthBrandHeader';
import bgImage from '../../../assets/images/singup.webp';

type AccountType = 'individual' | 'agency';

// Same full-bleed-background + pill-input treatment as the redesigned
// LoginScreen. Field set matches web's signup: confirm-password + mismatch
// check, and an Individual/Agency account-type toggle — picking "Agency"
// reveals agencyName/agencyCity and calls registerAgency after signUp
// succeeds, same as apps/web/app/(auth)/signup/page.tsx. Consent stays
// implied by pressing "Register Now" (no checkbox), same as before.
export function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signUp, signIn, sendOtp } = useAuthViewModel();
  const { register: registerAgency } = useAgencyRegistrationViewModel();
  const { signInWithGoogle, isPending: isGooglePending } = useGoogleSignIn();
  const { signInWithApple, isPending: isApplePending } = useAppleSignIn();

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [agencyCity, setAgencyCity] = useState('');
  const [salesAssociateCount, setSalesAssociateCount] = useState('');
  // Everything after the initial signUp() used to run with no error
  // handling at all — a failure partway through (registerAgency or sendOtp)
  // left an unhandled promise rejection: the auth.users row was already
  // permanently created by signUp(), but the screen never surfaced why the
  // rest of the flow died, and sendOtp's own error was never even rendered.
  // Retrying then hit signUp() again for an email that now already exists —
  // Supabase rejects that with a 422 "already registered" — producing a
  // second, misleading "Could not create your account" error for an account
  // that, in fact, already exists. This single submitError + the recovery
  // path below replace that dead end.
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    // Mandatory at agency onboarding per the Document Verification spec.
    if (accountType === 'agency' && !(Number(salesAssociateCount) > 0)) {
      setSubmitError('Enter the number of sales associates in your company.');
      return;
    }
    setSubmitError('');
    // rememberMeStorage's flag is module-level and only exposed as a toggle
    // on LoginScreen — a signed-up account should persist normally, in case
    // a prior unchecked login in this same app session left it false.
    setRememberMe(true);
    const formattedPhone = phone ? `+${dialCode.replace(/\D/g, '')}${phone}` : undefined;

    setIsSubmitting(true);
    try {
      // Captures whichever branch below actually authenticates, so the
      // agency-registration decision after it can be based on this
      // specific account's real state (JWT app_metadata), not on guessing
      // from an error message — see the note further down on why that
      // matters.
      let resumedUser: any;
      try {
        const result = await signUp.mutateAsync({
          email,
          password,
          name,
          phone: formattedPhone,
          termsAcceptedAt: new Date().toISOString(),
        });
        resumedUser = result.user;
      } catch (err: any) {
        // Resume instead of dead-ending: if this email is "already
        // registered" it's most likely this exact scenario — a previous
        // attempt's signUp succeeded but a later step failed before ever
        // reaching VerifyEmail. Signing in with the same credentials the
        // user just typed picks the same account back up; if the password
        // doesn't match (a genuinely different account), signIn fails too
        // and the real error below still surfaces.
        const alreadyRegistered = err?.status === 422 || /already registered/i.test(err?.message ?? '');
        if (!alreadyRegistered) throw err;
        const result = await signIn.mutateAsync({ email, password });
        resumedUser = result.user;
      }

      // Agency registration needs an authenticated session first (it's a
      // self-scoped POST /agencies/register) — signUp()/signIn() above
      // already returns an active session (Confirm email is off), so this
      // can run right after.
      // Skip re-registering only when THIS account's own JWT already shows
      // it as an agent with an agency (a prior attempt's registerAgency
      // call already succeeded before a later step failed). Deliberately
      // NOT based on matching "already" in the error message — the server
      // returns that exact wording for a genuinely different agency owning
      // the requested name too, and swallowing that case would silently
      // skip agency creation while telling the user signup succeeded.
      const alreadyHasAgency = resumedUser?.app_metadata?.role === 'agent' && !!resumedUser?.app_metadata?.agent_id;
      if (accountType === 'agency' && !alreadyHasAgency) {
        await registerAgency.mutateAsync({
          agencyName,
          agencySlug: slugify(agencyName),
          agencyCity: agencyCity || undefined,
          displayName: name,
          agentPhone: formattedPhone,
          salesAssociateCount: Number(salesAssociateCount),
        });
      }

      // A failed OTP send isn't fatal to the flow — VerifyEmailScreen has
      // its own "Resend" action, so let the user continue there rather than
      // stranding them on this screen with an already-created,
      // already-signed-in account. otpSendFailed is carried through as a
      // nav param (mirrors web's ?otpSendFailed=1 query param) so
      // VerifyEmailScreen can show a clear banner instead of the user
      // silently never receiving a code with no explanation.
      let otpSendFailed = false;
      try {
        await sendOtp.mutateAsync();
      } catch {
        otpSendFailed = true;
      }

      // AuthNavigator now stays mounted (inside the auth sheet) across the
      // whole signed-up-but-unverified state instead of being remounted by a
      // root-level gate swap, so it won't land on VerifyEmail on its own —
      // navigate there explicitly. VerifyEmailScreen itself then redirects a
      // fresh agency owner on to BecomeAnAgent once verified.
      navigation.navigate('VerifyEmail', otpSendFailed ? { otpSendFailed: true } : undefined);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Something went wrong — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Only offered for Individual signups — Agency always goes through the
  // password path so agencyName/agencyCity can be collected and
  // registerAgency() called with an authenticated session, same reasoning
  // as web's signup page hiding "Continue with Google"/"Continue with
  // Apple" once Agency is selected. Both providers' sessions are already
  // email_verified=true (pre-verified server-side, see handle_new_user()
  // in supabase/migrations/0013_profiles_email_verified.sql), so there's no
  // OTP step to chain through here — AuthGateProvider auto-closes the sheet
  // once its isEmailVerified check picks up the new session.
  async function handleGoogleSignUp() {
    await signInWithGoogle();
  }

  async function handleAppleSignUp() {
    await signInWithApple();
  }

  const isPending = isSubmitting || signUp.isPending || signIn.isPending || sendOtp.isPending || registerAgency.isPending;

  return (
    <View style={styles.root}>
      <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.wash} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthBrandHeader />

          <Text style={styles.title}>Let's Get Started.</Text>
          <Text style={styles.subtitle}>Sign up to start buying, selling, or renting on Jayedaad.</Text>

          <View style={styles.accountTypeRow}>
            <Pressable
              onPress={() => setAccountType('individual')}
              style={[styles.accountTypeButton, accountType === 'individual' && styles.accountTypeButtonActive]}
            >
              <Text style={[styles.accountTypeText, accountType === 'individual' && styles.accountTypeTextActive]}>
                Individual
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAccountType('agency')}
              style={[styles.accountTypeButton, accountType === 'agency' && styles.accountTypeButtonActive]}
            >
              <Text style={[styles.accountTypeText, accountType === 'agency' && styles.accountTypeTextActive]}>
                Agency
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextInput
              label={accountType === 'agency' ? 'Your Name' : 'Name'}
              icon="person-outline"
              variant="pill"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
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

            <View>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.phoneRow}>
                <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={setDialCode} variant="pill" />
                <TextInput
                  variant="pill"
                  style={styles.phoneInput}
                  placeholder="3XX XXXXXXX"
                  value={phone}
                  maxLength={getMaxPhoneDigits(dialCode)}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
                  keyboardType="number-pad"
                  autoComplete="tel-national"
                />
              </View>
            </View>

            {accountType === 'agency' && (
              <View style={styles.agencyPanel}>
                <TextInput
                  label="Agency Name"
                  icon="business-outline"
                  variant="pill"
                  placeholder="Your agency's name"
                  value={agencyName}
                  onChangeText={setAgencyName}
                />
                <View>
                  <Text style={styles.label}>Agency City</Text>
                  <PickerField
                    variant="pill"
                    value={agencyCity}
                    options={PAKISTAN_CITIES}
                    placeholder="Select City"
                    title="Select City"
                    onChange={setAgencyCity}
                  />
                </View>
                <TextInput
                  label="Number of Sales Associates"
                  icon="people-outline"
                  variant="pill"
                  placeholder="e.g. 5"
                  value={salesAssociateCount}
                  onChangeText={(v) => setSalesAssociateCount(v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                />
                <Text style={styles.agencyHelper}>
                  Your agency will be reviewed before it goes live — upload verification documents right after signing
                  up.
                </Text>
              </View>
            )}

            <TextInput
              label="Password"
              icon="lock-closed-outline"
              variant="pill"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureToggle
              autoComplete="new-password"
            />
            <TextInput
              label="Confirm Password"
              icon="lock-closed-outline"
              variant="pill"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureToggle
              autoComplete="new-password"
            />

            {passwordMismatch && <Text style={styles.error}>Passwords don&apos;t match.</Text>}
            {!!submitError && <Text style={styles.error}>{submitError}</Text>}

            <Button
              label={isPending ? 'Registering…' : 'Register Now'}
              onPress={handleSignUp}
              disabled={isPending}
              size="lg"
            />
          </View>

          {accountType === 'individual' && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <Button
                  label="Google"
                  icon={<GoogleIcon />}
                  variant="secondary"
                  size="lg"
                  style={styles.socialButton}
                  onPress={handleGoogleSignUp}
                  disabled={isGooglePending}
                />
                <Button
                  label="Apple"
                  icon={<AppleIcon />}
                  variant="secondary"
                  size="lg"
                  style={styles.socialButton}
                  onPress={handleAppleSignUp}
                  disabled={isApplePending}
                />
              </View>
            </>
          )}

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
  accountTypeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  accountTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.secondaryBg,
  },
  accountTypeButtonActive: { backgroundColor: theme.colors.primary },
  accountTypeText: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  accountTypeTextActive: { color: '#ffffff' },
  form: { gap: theme.spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
  phoneRow: { flexDirection: 'row', gap: theme.spacing.sm },
  phoneInput: { flex: 1 },
  agencyPanel: {
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: theme.spacing.md,
  },
  agencyHelper: { fontSize: 12, color: theme.colors.muted },
  error: { fontSize: 13, color: theme.colors.danger },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginVertical: theme.spacing.lg },
  socialButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  socialButton: { flex: 1 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: 12, color: theme.colors.muted },
  footer: { textAlign: 'center', marginTop: theme.spacing.xl, color: theme.colors.muted },
  link: { color: theme.colors.primary, fontWeight: '600' },
  terms: { fontSize: 11, color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
});
