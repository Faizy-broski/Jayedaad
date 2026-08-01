import { useState } from 'react';
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgencyStaffMember, CreateAgencyStaffInput, useAgencyStaffViewModel, useAgentProfileViewModel } from '@jayedaad/core';
import { Button, Dialog, TextInput, theme, useToast } from '@jayedaad/ui-native';

const EMPTY_FORM: CreateAgencyStaffInput = { email: '', password: '', displayName: '' };

const VERIFICATION_COLORS: Record<AgencyStaffMember['verificationStatus'], { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  verified: { bg: '#DCFCE7', text: '#166534' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

// Mobile counterpart to apps/web/app/(agent)/agency-staff/page.tsx — reuses
// the exact same useAgencyStaffViewModel/useAgentProfileViewModel from
// packages/core untouched, only the View layer is new here. Reachable only
// for an agency's own admin (or super_admin); the server enforces the real
// boundary regardless (agencies.controller.ts::assertCanManageStaff).
export function AgencyStaffScreen() {
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();
  const agencyId = profile?.agency?.id;
  const { staff, isLoading, addStaff, setStaffAdmin, removeStaff } = useAgencyStaffViewModel(agencyId ?? '');
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateAgencyStaffInput>(EMPTY_FORM);

  if (isProfileLoading) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!profile?.isAgencyAdmin || !agencyId) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Agency staff management is only available to an agency&apos;s admin.</Text>
      </View>
    );
  }

  function handleAdd() {
    addStaff.mutate(form, {
      onSuccess: () => {
        showToast('Agent added.');
        setDialogOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () => showToast('Something went wrong — please try again.', 'error'),
    });
  }

  function handleToggleAdmin(agentId: string, next: boolean) {
    setStaffAdmin.mutate(
      { agentId, isAgencyAdmin: next },
      {
        onSuccess: () => showToast(next ? 'Promoted to agency admin.' : 'Admin access removed.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  function handleRemove(agentId: string, name: string) {
    Alert.alert('Remove Agent', `Remove "${name}" from this agency?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          removeStaff.mutate(agentId, {
            onSuccess: () => showToast('Agent removed from agency.'),
            onError: () => showToast('Something went wrong — please try again.', 'error'),
          }),
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Agency Staff</Text>
        <Button label="Add Agent" size="md" onPress={() => setDialogOpen(true)} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Fetching staff…</Text>
        </View>
      ) : staff.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>No agents in this agency yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {staff.map((agent) => {
            const verificationColor = VERIFICATION_COLORS[agent.verificationStatus];
            return (
              <View key={agent.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {agent.displayName ?? 'Unnamed agent'}
                  </Text>
                  {agent.isAgencyAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowSubtitle}>
                  {agent.phone ?? '—'} · {agent.city ?? '—'}
                </Text>
                <View style={[styles.verificationBadge, { backgroundColor: verificationColor.bg }]}>
                  <Text style={[styles.verificationText, { color: verificationColor.text }]}>{agent.verificationStatus}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.rowActions}>
                  <Pressable
                    style={styles.actionButton}
                    disabled={setStaffAdmin.isPending}
                    onPress={() => handleToggleAdmin(agent.id, !agent.isAgencyAdmin)}
                  >
                    <Ionicons name={agent.isAgencyAdmin ? 'shield-outline' : 'shield-checkmark-outline'} size={16} color={theme.colors.primary} />
                    <Text style={styles.actionTextPrimary}>{agent.isAgencyAdmin ? 'Revoke Admin' : 'Make Admin'}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    disabled={removeStaff.isPending}
                    onPress={() => handleRemove(agent.id, agent.displayName ?? 'this agent')}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                    <Text style={styles.actionTextDestructive}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Agent">
        <View style={styles.dialogContent}>
          <TextInput
            label="Name"
            value={form.displayName}
            onChangeText={(v) => setForm((prev) => ({ ...prev, displayName: v }))}
          />
          <TextInput
            label="Email"
            value={form.email}
            onChangeText={(v) => setForm((prev) => ({ ...prev, email: v }))}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            label="Temporary Password"
            value={form.password}
            onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))}
            secureToggle
          />
          <Button label={addStaff.isPending ? 'Adding…' : 'Add'} onPress={handleAdd} disabled={addStaff.isPending} />
        </View>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg, padding: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 14, color: theme.colors.mutedLight, fontWeight: '500', textAlign: 'center' },
  list: { paddingHorizontal: 24, paddingVertical: 4, gap: 16 },
  card: {
    backgroundColor: theme.colors.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flexShrink: 1 },
  rowSubtitle: { fontSize: 13, color: theme.colors.muted, fontWeight: '500', marginBottom: 8 },
  adminBadge: { backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadgeText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  verificationBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  verificationText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardDivider: { height: 1, backgroundColor: theme.colors.surfaceAlt, marginVertical: 16 },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 6 },
  actionTextPrimary: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  actionTextDestructive: { fontSize: 13, fontWeight: '600', color: theme.colors.danger },
  dialogContent: { gap: 12 },
});
