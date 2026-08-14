import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lead, LeadStatus, useAgentProfileViewModel, useLeadInboxViewModel } from '@jayedaad/core';
import { Button, refreshControlProps, TextInput, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

type StatusFilter = 'all' | LeadStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
];

const SOURCE_LABEL: Record<string, string> = {
  chatbot: 'Chatbot',
  contact_form: 'Contact form',
  call_request: 'Call request',
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Same viewmodel as apps/web's (agent)/crm page.tsx — mobile agents get the
// same optimistic-update CRM behavior as the web dashboard [Dev Instr §1].
// Previously a stripped-down stub (name + status only, one hardcoded "Mark
// Contacted" button, no contact info, no notes, no detail view) — now a
// real inbox: full status filters, search, tap-through to LeadDetailScreen
// for contact info/notes/call/WhatsApp, real error state, pull-to-refresh.
export function AgentCRMScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAgentProfileViewModel();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agencyScope, setAgencyScope] = useState(false);
  const [search, setSearch] = useState('');
  const { leads, isLoading, isError, refetch, isRefetching } = useLeadInboxViewModel({
    status: statusFilter === 'all' ? undefined : statusFilter,
    scope: agencyScope ? 'agency' : 'own',
    pageSize: 50,
  });

  const visibleLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q),
    );
  }, [leads, search]);

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        icon="search-outline"
        value={search}
        onChangeText={setSearch}
        placeholder="Search name, phone, email…"
        style={styles.search}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRowScroll}
        contentContainerStyle={styles.filterRow}
        data={profile?.isAgencyAdmin ? [...STATUS_FILTERS, { value: 'agency' as const, label: 'Agency' }] : STATUS_FILTERS}
        keyExtractor={(f) => f.value}
        renderItem={({ item: f }) => {
          const active = f.value === 'agency' ? agencyScope : statusFilter === f.value;
          return (
            <Pressable
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => (f.value === 'agency' ? setAgencyScope((v) => !v) : setStatusFilter(f.value as StatusFilter))}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        }}
      />

      {isLoading && <Text style={styles.loading}>Loading…</Text>}

      {!isLoading && isError && (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.muted} />
          <Text style={styles.errorText}>Couldn&apos;t load your inbox.</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={() => refetch()} />
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={visibleLeads}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{search ? 'No leads match your search.' : 'No leads yet.'}</Text>
          }
          renderItem={({ item }: { item: Lead }) => (
            <Pressable style={styles.row} onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}>
              <View style={styles.rowMain}>
                <View style={styles.rowHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>
                </View>
                {item.message ? (
                  <Text style={styles.message} numberOfLines={1}>
                    {item.message}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{item.phone}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.meta}>{relativeTime(item.createdAt)}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.meta}>{SOURCE_LABEL[item.source] ?? item.source}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  search: { marginBottom: theme.spacing.sm },
  filterRowScroll: { flexGrow: 0, marginBottom: theme.spacing.md },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm },
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
  loading: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  errorState: { alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  errorText: { color: theme.colors.muted, fontSize: 13 },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
  },
  rowMain: { flex: 1, gap: 3 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  name: { fontWeight: '600', fontSize: 14, color: theme.colors.text },
  statusBadge: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { color: theme.colors.muted, fontSize: 11, textTransform: 'capitalize', fontWeight: '600' },
  message: { color: theme.colors.text, fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: theme.colors.muted, fontSize: 11 },
  metaDot: { color: theme.colors.muted, fontSize: 11 },
});
