import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Opportunity,
  OpportunityStage,
  useAgentProfileViewModel,
  useFormattedPrice,
  useOpportunityFunnelViewModel,
  useOpportunityPipelineViewModel,
} from '@jayedaad/core';
import { Button, KpiTile, refreshControlProps, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

// True cross-column drag-and-drop doesn't work on a single-column phone
// viewport (an agent would need to drag off-screen to reach the next
// stage) — a stage-tab bar + tapping into a detail screen with an explicit
// "Move Stage" action (OpportunityDetailScreen.tsx) is the realistic
// mobile equivalent of apps/web's Kanban board, same pattern most mobile
// CRM apps use instead of trying to replicate desktop drag-and-drop.
const STAGE_TABS: { value: OpportunityStage; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'qualification', label: 'Qualification', icon: 'search-outline' },
  { value: 'needs_analysis', label: 'Needs Analysis', icon: 'analytics-outline' },
  { value: 'proposal', label: 'Proposal', icon: 'document-text-outline' },
  { value: 'negotiation', label: 'Negotiation', icon: 'chatbubbles-outline' },
  { value: 'won', label: 'Won', icon: 'checkmark-circle-outline' },
  { value: 'lost', label: 'Lost', icon: 'close-circle-outline' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function PipelineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAgentProfileViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const [stage, setStage] = useState<OpportunityStage>('qualification');
  const [agencyScope, setAgencyScope] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const { opportunities, isLoading, isError, refetch } = useOpportunityPipelineViewModel({
    stage,
    scope: agencyScope ? 'agency' : 'own',
    pageSize: 50,
  });
  // Summary tiles only, not the full funnel chart — that lives on web's
  // dedicated analytics page; a phone gets the numbers that matter for a
  // quick glance (Phase 4 of the CRM maturity build-out).
  const { funnel } = useOpportunityFunnelViewModel({ scope: agencyScope ? 'agency' : 'own' });

  async function onPullRefresh() {
    setPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }

  const totalValue = useMemo(() => opportunities.reduce((sum, o) => sum + o.value, 0), [opportunities]);

  return (
    <SafeAreaView style={styles.container}>
      {funnel && (
        <View style={styles.summaryRow}>
          <KpiTile icon="wallet-outline" label="Open Value" value={formatPrice(funnel.openPipelineValue)} sub={`${funnel.openPipelineCount} open`} style={styles.summaryTile} />
          <KpiTile icon="trending-up-outline" label="Forecast" value={formatPrice(funnel.forecastedRevenue)} style={styles.summaryTile} />
          <KpiTile
            icon="stats-chart-outline"
            label="Win/Loss"
            value={funnel.winLossRatio != null ? funnel.winLossRatio.toFixed(2) : '—'}
            sub={`${funnel.won}W · ${funnel.lost}L`}
            style={styles.summaryTile}
          />
        </View>
      )}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRowScroll}
        contentContainerStyle={styles.filterRow}
        data={profile?.isAgencyAdmin ? [...STAGE_TABS, { value: 'agency' as const, label: 'Agency', icon: 'business-outline' as const }] : STAGE_TABS}
        keyExtractor={(t) => t.value}
        renderItem={({ item }) => {
          const active = item.value === 'agency' ? agencyScope : stage === item.value;
          return (
            <Pressable
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => (item.value === 'agency' ? setAgencyScope((v) => !v) : setStage(item.value as OpportunityStage))}
            >
              <Ionicons name={item.icon} size={14} color={active ? theme.colors.bg : theme.colors.muted} />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        }}
      />

      {opportunities.length > 0 && (
        <Text style={styles.totalText}>
          {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'} · {formatPrice(totalValue)}
        </Text>
      )}

      {isLoading && (
        <View style={styles.loadingState}>
          <Text style={styles.loading}>Loading your pipeline…</Text>
        </View>
      )}

      {!isLoading && isError && (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.danger} />
          <Text style={styles.errorText}>Couldn&apos;t load your pipeline.</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={() => refetch()} />
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={opportunities}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onPullRefresh} {...refreshControlProps()} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={30} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No opportunities here</Text>
              <Text style={styles.emptyText}>Convert a lead to an opportunity from its detail screen to see it in your pipeline.</Text>
            </View>
          }
          renderItem={({ item }: { item: Opportunity }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('OpportunityDetail', { opportunityId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.probabilityBadge}>
                  <Text style={styles.probabilityBadgeText}>{item.probability}%</Text>
                </View>
              </View>
              <Text style={styles.cardValue}>{formatPrice(item.value)}</Text>
              <View style={styles.cardMetaRow}>
                <Ionicons name="calendar-outline" size={12} color={theme.colors.muted} />
                <Text style={styles.cardMeta}>Expected close {formatDate(item.expectedCloseDate)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  summaryRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  summaryTile: { flex: 1 },
  filterRowScroll: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  filterRow: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, gap: theme.spacing.xs },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  filterChipTextActive: { color: theme.colors.bg },
  totalText: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, fontSize: 12, color: theme.colors.muted },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl },
  loading: { color: theme.colors.muted },
  errorState: { alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xxl },
  errorText: { color: theme.colors.muted },
  listContent: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  emptyState: { alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.xs },
  emptyText: { fontSize: 12, color: theme.colors.muted, textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  cardName: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  probabilityBadge: { backgroundColor: theme.colors.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  probabilityBadgeText: { fontSize: 11, fontWeight: '600', color: theme.colors.muted },
  cardValue: { marginTop: 4, fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cardMeta: { fontSize: 11, color: theme.colors.muted },
});
