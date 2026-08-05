import { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { LeadStatus, useAgentProfileViewModel, useLeadInboxViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';

type StatusFilter = 'all' | LeadStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'closed', label: 'Closings' },
];

// Same viewmodel as apps/web's (agent)/crm page.tsx — mobile agents get the
// same optimistic-update CRM behavior as the web J.Dashboard [Dev Instr §1].
// Closings filter + Agency scope toggle added for Document Verification
// Phase 3 — Sales Associates get a "Closings" view of their own won deals,
// Agency Admins can widen the list to every associate's leads.
export function AgentCRMScreen() {
  const { profile } = useAgentProfileViewModel();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agencyScope, setAgencyScope] = useState(false);
  const { leads, isLoading, updateStatus } = useLeadInboxViewModel({
    status: statusFilter === 'all' ? undefined : statusFilter,
    scope: agencyScope ? 'agency' : 'own',
  });
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text style={[styles.filterChipText, statusFilter === f.value && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
        {profile?.isAgencyAdmin && (
          <Pressable
            style={[styles.filterChip, agencyScope && styles.filterChipActive]}
            onPress={() => setAgencyScope((v) => !v)}
          >
            <Text style={[styles.filterChipText, agencyScope && styles.filterChipTextActive]}>Agency</Text>
          </Pressable>
        )}
      </View>
      {isLoading && <Text>Loading…</Text>}
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No leads yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Button
              label="Mark Contacted"
              variant="secondary"
              onPress={() =>
                updateStatus.mutate(
                  { leadId: item.id, status: 'contacted' },
                  {
                    onSuccess: () => showToast('Lead marked as contacted.'),
                    onError: () => showToast('Something went wrong — please try again.', 'error'),
                  },
                )
              }
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  filterChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  filterChipTextActive: { color: theme.colors.bg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
  },
  name: { fontWeight: '600' },
  status: { color: theme.colors.muted, fontSize: 12, textTransform: 'capitalize' },
  empty: { color: theme.colors.muted },
});
