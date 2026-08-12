import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PAKISTAN_CITIES, useAgentApplicationViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, PickerField, TextInput, theme, useToast } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Mobile counterpart to apps/web/app/(buyer)/become-an-agent/page.tsx's
// pre-application form — a signed-in buyer applies here to become an
// independent (agency-less) agent. Was missing entirely on mobile: signup
// only ever produces a 'buyer' or an agency-admin 'agent' (BecomeAnAgentScreen,
// reached from VerifyEmailScreen), with no self-service path for an
// individual to apply afterward, even though useAgentApplicationViewModel/
// agentsRepository.applyAsAgent already existed in packages/core with no
// caller. On success (role flips 'buyer' -> 'agent' via the same
// refreshSession() web's version relies on), replaces this screen with the
// (now-fixed) BecomeAnAgentScreen to complete document upload — registered
// as a second RootStack route pointing at the same component it already
// has in AuthStackParamList, since this flow isn't part of the auth-gate
// sheet.
export function ApplyAsAgentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { role } = useAuthViewModel();
  const { apply } = useAgentApplicationViewModel();
  const { showToast } = useToast();
  const [form, setForm] = useState({ displayName: '', phone: '', city: '' });

  function handleApply() {
    apply.mutate(form, {
      onSuccess: () => {
        showToast('Application submitted — under review.');
        navigation.replace('BecomeAnAgent');
      },
      onError: () => showToast('Something went wrong — please try again.', 'error'),
    });
  }

  if (role && role !== 'buyer') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>This application is only available for buyer accounts.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Become an Agent</Text>
        <Text style={styles.subtitle}>
          Apply to list properties as an agent. Your application is reviewed before you can start listing.
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={form.displayName}
            onChangeText={(v) => setForm((prev) => ({ ...prev, displayName: v }))}
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
            keyboardType="phone-pad"
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City</Text>
            <PickerField
              value={form.city}
              options={PAKISTAN_CITIES}
              placeholder="Select City"
              title="Select City"
              onChange={(v) => setForm((prev) => ({ ...prev, city: v }))}
            />
          </View>
        </View>

        <Button
          label={apply.isPending ? 'Submitting…' : 'Submit Application'}
          onPress={handleApply}
          disabled={apply.isPending}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
});
