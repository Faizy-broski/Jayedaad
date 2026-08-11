import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useMyAgencyViewModel } from '@jayedaad/core';
import { Button, TextInput, theme, useToast } from '@jayedaad/ui-native';

// Mobile counterpart to apps/web/app/(agent)/agent-settings/page.tsx's
// AgencyDetailsPanel — was missing entirely on mobile (AgencyStaffScreen
// only covers staff, not the agency's own profile fields), even though
// useMyAgencyViewModel already existed in packages/core with no mobile
// caller. Same read/write hook, same disabled-unless-admin gating, only the
// View layer is new here.
export function AgencySettingsScreen() {
  const { agency, isLoading, isAgencyAdmin, update } = useMyAgencyViewModel();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', description: '', phone: '', email: '', city: '', address: '', businessHours: '' });

  useEffect(() => {
    if (!agency) return;
    setForm({
      name: agency.name ?? '',
      description: agency.description ?? '',
      phone: agency.phone ?? '',
      email: agency.email ?? '',
      city: agency.city ?? '',
      address: agency.address ?? '',
      businessHours: agency.businessHours ?? '',
    });
  }, [agency]);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    update.mutate(form, {
      onSuccess: () => showToast('Agency details saved.'),
      onError: () => showToast('Something went wrong — please try again.', 'error'),
    });
  }

  if (isLoading || !agency) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {!isAgencyAdmin && <Text style={styles.muted}>Only your agency&apos;s admin can edit these details.</Text>}

        <View style={styles.form}>
          <TextInput label="Agency Name" value={form.name} editable={isAgencyAdmin} onChangeText={(v) => updateField('name', v)} />
          <TextInput
            label="Email"
            value={form.email}
            editable={isAgencyAdmin}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(v) => updateField('email', v)}
          />
          <TextInput
            label="Phone"
            value={form.phone}
            editable={isAgencyAdmin}
            keyboardType="phone-pad"
            onChangeText={(v) => updateField('phone', v)}
          />
          <TextInput label="City" value={form.city} editable={isAgencyAdmin} onChangeText={(v) => updateField('city', v)} />
          <TextInput label="Address" value={form.address} editable={isAgencyAdmin} onChangeText={(v) => updateField('address', v)} />
          <TextInput
            label="Business Hours"
            value={form.businessHours}
            editable={isAgencyAdmin}
            placeholder="e.g. Monday to Sunday, 9AM-6PM"
            onChangeText={(v) => updateField('businessHours', v)}
          />
          <TextInput
            label="Description"
            value={form.description}
            editable={isAgencyAdmin}
            multiline
            numberOfLines={4}
            onChangeText={(v) => updateField('description', v)}
          />
        </View>

        {isAgencyAdmin && (
          <Button label={update.isPending ? 'Saving…' : 'Save Changes'} onPress={handleSave} disabled={update.isPending} size="lg" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1, gap: theme.spacing.lg },
  muted: { fontSize: 13, color: theme.colors.muted },
  form: { gap: theme.spacing.md },
});
