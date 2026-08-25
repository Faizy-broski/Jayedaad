import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lead, LeadStatus, useAgentProfileViewModel, useLeadInboxViewModel } from '@jayedaad/core';
import { Button, refreshControlProps, TextInput, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

type StatusFilter = 'all' | LeadStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all', label: 'All', icon: 'apps-outline' },
  { value: 'new', label: 'New', icon: 'sparkles-outline' },
  { value: 'contacted', label: 'Contacted', icon: 'call-outline' },
  { value: 'negotiating', label: 'Negotiating', icon: 'chatbubbles-outline' },
  { value: 'closed', label: 'Closed', icon: 'checkmark-circle-outline' },
  { value: 'lost', label: 'Lost', icon: 'close-circle-outline' },
];

const SOURCE_LABEL: Record<string, string> = {
  chatbot: 'Chatbot',
  contact_form: 'Contact form',
  call_request: 'Call request',
};

const SOURCE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  chatbot: 'chatbubble-ellipses-outline',
  contact_form: 'document-text-outline',
  call_request: 'call-outline',
};

// Distinct accent per status so the inbox reads at a glance without opening
// each lead — mirrors the color language the web CRM already uses per-status.
const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string }> = {
  new: { bg: '#EFF6FF', text: '#2563EB' },
  contacted: { bg: '#FFFBEB', text: '#B45309' },
  negotiating: { bg: '#F5F3FF', text: '#7C3AED' },
  closed: { bg: '#ECFDF5', text: theme.colors.primary },
  lost: { bg: theme.colors.dangerBg, text: theme.colors.danger },
};

const AVATAR_PALETTE = ['#0D634B', '#2563EB', '#B45309', '#7C3AED', '#DB2777', '#0EA5E9'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

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
  const route = useRoute<RouteProp<RootStackParamList, 'AgentCRM'>>();
  const { profile } = useAgentProfileViewModel();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agencyScope, setAgencyScope] = useState(false);
  const [search, setSearch] = useState('');
  // Arrives pre-filtered when linked from a listing's Performance screen
  // ("View all leads for this listing") — local state (not the raw route
  // param) so the banner's clear action can drop the filter without a
  // navigation round-trip. Mirrors apps/web's (agent)/crm/page.tsx.
  const [listingIdFilter, setListingIdFilter] = useState(route.params?.listingId);
  // isRefetching from the viewmodel goes true both for a manual pull *and*
  // the 30s background refetchInterval (useLeadInboxViewModel) — wiring it
  // straight into RefreshControl made the native spinner pop up on its own
  // every 30s even with the list already populated underneath. Tracking the
  // pull gesture separately keeps the spinner tied to the user's own pull.
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { leads, isLoading, isError, refetch } = useLeadInboxViewModel({
    status: statusFilter === 'all' ? undefined : statusFilter,
    scope: agencyScope ? 'agency' : 'own',
    listingId: listingIdFilter,
    pageSize: 50,
  });

  async function onPullRefresh() {
    setPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }

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
      <View style={styles.searchWrap}>
        <TextInput
          icon="search-outline"
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone, email…"
          variant="pill"
        />
      </View>

      {listingIdFilter && (
        <View style={styles.listingBanner}>
          <Ionicons name="business-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.listingBannerText} numberOfLines={1}>
            Showing leads for <Text style={styles.listingBannerTitle}>{route.params?.listingTitle ?? 'this listing'}</Text>
          </Text>
          <Pressable style={styles.listingBannerClear} onPress={() => setListingIdFilter(undefined)}>
            <Ionicons name="close" size={14} color={theme.colors.muted} />
            <Text style={styles.listingBannerClearText}>Clear</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRowScroll}
        contentContainerStyle={styles.filterRow}
        data={profile?.isAgencyAdmin ? [...STATUS_FILTERS, { value: 'agency' as const, label: 'Agency', icon: 'business-outline' as const }] : STATUS_FILTERS}
        keyExtractor={(f) => f.value}
        renderItem={({ item: f }) => {
          const active = f.value === 'agency' ? agencyScope : statusFilter === f.value;
          return (
            <Pressable
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => (f.value === 'agency' ? setAgencyScope((v) => !v) : setStatusFilter(f.value as StatusFilter))}
            >
              <Ionicons name={f.icon} size={14} color={active ? theme.colors.bg : theme.colors.muted} />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        }}
      />

      {isLoading && (
        <View style={styles.loadingState}>
          <Text style={styles.loading}>Loading your inbox…</Text>
        </View>
      )}

      {!isLoading && isError && (
        <View style={styles.errorState}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={32} color={theme.colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Couldn&apos;t load your inbox</Text>
          <Text style={styles.errorText}>Check your connection and try again.</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={() => refetch()} />
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={visibleLeads}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onPullRefresh} {...refreshControlProps()} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="mail-open-outline" size={30} color={theme.colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>{search ? 'No matches' : 'No leads yet'}</Text>
              <Text style={styles.emptyText}>
                {search ? 'Try a different name, phone, or email.' : 'New inquiries from your listings will show up here.'}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Lead }) => {
            const statusColor = STATUS_COLORS[item.status] ?? STATUS_COLORS.new;
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
              >
                <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }]}>
                  <Text style={styles.avatarText}>{initials(item.name)}</Text>
                </View>

                <View style={styles.rowMain}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
                  </View>

                  {item.message ? (
                    <Text style={styles.message} numberOfLines={1}>
                      {item.message}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{item.status}</Text>
                    </View>
                    <View style={styles.sourceTag}>
                      <Ionicons name={SOURCE_ICON[item.source] ?? 'ellipse-outline'} size={11} color={theme.colors.muted} />
                      <Text style={styles.meta}>{SOURCE_LABEL[item.source] ?? item.source}</Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedLight} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  searchWrap: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, backgroundColor: theme.colors.surface },
  filterRowScroll: { flexGrow: 0, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  listingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  listingBannerText: { flex: 1, fontSize: 12.5, color: theme.colors.text },
  listingBannerTitle: { fontWeight: '700' },
  listingBannerClear: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: theme.spacing.sm },
  listingBannerClearText: { fontSize: 11.5, fontWeight: '600', color: theme.colors.muted },
  filterChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  filterChipTextActive: { color: theme.colors.bg },
  loadingState: { alignItems: 'center', marginTop: theme.spacing.xl },
  loading: { color: theme.colors.muted, fontSize: 13 },
  errorState: { alignItems: 'center', gap: 6, marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  errorTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  errorText: { color: theme.colors.muted, fontSize: 13, textAlign: 'center', marginBottom: theme.spacing.sm },
  listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, gap: theme.spacing.sm },
  emptyState: { alignItems: 'center', gap: 6, marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  emptyText: { color: theme.colors.muted, fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowPressed: { backgroundColor: theme.colors.surfaceAlt },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rowMain: { flex: 1, gap: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  name: { flexShrink: 1, fontWeight: '700', fontSize: 14.5, color: theme.colors.text },
  time: { color: theme.colors.mutedLight, fontSize: 11 },
  message: { color: theme.colors.muted, fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10.5, textTransform: 'capitalize', fontWeight: '700' },
  sourceTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { color: theme.colors.muted, fontSize: 11 },
});
