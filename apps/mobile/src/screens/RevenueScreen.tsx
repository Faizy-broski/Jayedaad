import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Deal,
  useAgentProfileViewModel,
  useAuthViewModel,
  useDealsViewModel,
  useFormattedPrice,
  useRevenueViewModel,
} from '@jayedaad/core';
import { Card, CardContent, Tabs, theme } from '@jayedaad/ui-native';
import { BarChart } from '../components/BarChart';
import { RootStackParamList } from '../navigation/RootNavigator';

const PERIOD_TABS = [
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
] as const;

type Period = (typeof PERIOD_TABS)[number]['id'];

const DEAL_TYPE_STYLE: Record<Deal['dealType'], { bg: string; text: string; label: string }> = {
  sale: { bg: '#E3F2ED', text: theme.colors.primary, label: 'Sale' },
  rent: { bg: '#FFF4E0', text: '#B8790B', label: 'Rent' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Backs the Profile-menu "Revenue" entry — commission revenue off the deals
// table (Mark Sold/Mark Rented), same data useRevenueViewModel/
// useDealsViewModel already serve on web's (agent)/revenue page. Mirrors
// AgencyAnalyticsScreen's isAgencyAdmin gating for the agency-wide toggle
// and per-agent breakdown.
export function RevenueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { agentId } = useAuthViewModel();
  const { profile } = useAgentProfileViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const [period, setPeriod] = useState<Period>('month');
  const [agencyScope, setAgencyScope] = useState(false);

  const scope = agencyScope ? 'agency' : 'own';
  const { revenue, isRevenueLoading } = useRevenueViewModel(agentId, { period, scope });
  const { deals, isLoading: isDealsLoading } = useDealsViewModel({ scope, page: 1, pageSize: 20 });

  const avgDealValue = revenue && revenue.dealCount > 0 ? revenue.totalRevenue / revenue.dealCount : 0;
  const chartData = (revenue?.byPeriod ?? []).map((p) => ({ label: p.period, value: p.revenue }));
  const sortedByAgent = [...(revenue?.byAgent ?? [])].sort((a, b) => b.revenue - a.revenue);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Tabs
          tabs={PERIOD_TABS.map((t) => ({ id: t.id, label: t.label }))}
          activeId={period}
          onChange={(id) => setPeriod(id as Period)}
        />

        {profile?.isAgencyAdmin && (
          <Pressable style={styles.scopeToggle} onPress={() => setAgencyScope((v) => !v)}>
            <Ionicons
              name={agencyScope ? 'business' : 'business-outline'}
              size={16}
              color={agencyScope ? theme.colors.primary : theme.colors.muted}
            />
            <Text style={[styles.scopeToggleText, agencyScope && styles.scopeToggleTextActive]}>
              {agencyScope ? 'Showing agency-wide revenue' : 'Show agency-wide revenue'}
            </Text>
          </Pressable>
        )}

        <View style={styles.kpiGrid}>
          <KpiTile label="Total Revenue" value={formatPrice(revenue?.totalRevenue ?? 0)} />
          <KpiTile label="Deals Closed" value={String(revenue?.dealCount ?? 0)} />
          <KpiTile label="Avg. Deal Value" value={formatPrice(avgDealValue)} />
        </View>

        <Card style={styles.cardSpacious}>
          <CardContent style={styles.cardContentSpacious}>
            <Text style={styles.sectionTitle}>Revenue trend</Text>
            {isRevenueLoading ? (
              <Text style={styles.centeredMuted}>Loading…</Text>
            ) : chartData.length === 0 ? (
              <Text style={styles.centeredMuted}>No deals closed yet</Text>
            ) : (
              <View style={styles.chartWrap}>
                <BarChart data={chartData} />
              </View>
            )}
          </CardContent>
        </Card>

        {profile?.isAgencyAdmin && agencyScope && (
          <View style={styles.sectionSpacing}>
            <Text style={styles.sectionTitle}>By associate</Text>
            <Card>
              <CardContent style={styles.listContent}>
                {sortedByAgent.length === 0 ? (
                  <Text style={styles.centeredMuted}>No associate revenue yet.</Text>
                ) : (
                  sortedByAgent.map((a, i) => (
                    <View key={a.agentId} style={[styles.associateRow, i > 0 && styles.associateRowBorder]}>
                      <Text style={styles.associateName} numberOfLines={1}>
                        {a.displayName ?? 'Unnamed'}
                      </Text>
                      <Text style={styles.associateStat}>
                        {formatPrice(a.revenue)} · {a.dealCount} deals
                      </Text>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>
          </View>
        )}

        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>Deals</Text>
          {isDealsLoading ? (
            <Text style={styles.centeredMuted}>Loading…</Text>
          ) : deals.length === 0 ? (
            <Card>
              <CardContent style={styles.listContent}>
                <Text style={styles.centeredMuted}>No deals closed yet</Text>
              </CardContent>
            </Card>
          ) : (
            <View style={styles.dealsList}>
              {deals.map((deal) => {
                const typeStyle = DEAL_TYPE_STYLE[deal.dealType];
                return (
                  <Pressable
                    key={deal.id}
                    style={styles.dealCard}
                    onPress={() => navigation.navigate('ListingPerformance', { listingId: deal.listingId })}
                  >
                    <View style={styles.dealHeaderRow}>
                      <Text style={styles.dealTitle} numberOfLines={1}>
                        {deal.listingTitle ?? 'Listing'}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>{typeStyle.label}</Text>
                      </View>
                    </View>
                    <View style={styles.dealMetaRow}>
                      <Text style={styles.dealMeta}>{formatPrice(deal.amount)}</Text>
                      {deal.commissionRate != null && <Text style={styles.dealMeta}>{deal.commissionRate}% comm.</Text>}
                      <Text style={styles.dealRevenue}>{formatPrice(deal.commissionAmount)}</Text>
                    </View>
                    <View style={styles.dealFooterRow}>
                      <Text style={styles.dealDate}>{formatDate(deal.closedAt)}</Text>
                      {agencyScope && deal.agentName && <Text style={styles.dealAgent}>{deal.agentName}</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiTile}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  sectionSpacing: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.sm },
  centeredMuted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center', paddingVertical: theme.spacing.md },

  scopeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: theme.spacing.xs },
  scopeToggleText: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  scopeToggleTextActive: { color: theme.colors.primary },

  kpiGrid: { flexDirection: 'row', gap: theme.spacing.sm },
  kpiTile: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  kpiLabel: { fontSize: 11, color: theme.colors.muted, fontWeight: '600' },
  kpiValue: { fontSize: 17, fontWeight: '800', color: theme.colors.text },

  cardSpacious: { borderRadius: 20 },
  cardContentSpacious: { padding: theme.spacing.xl },
  chartWrap: { marginTop: theme.spacing.sm },

  listContent: { paddingVertical: theme.spacing.sm },
  associateRow: { paddingVertical: theme.spacing.sm },
  associateRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  associateName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  associateStat: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  dealsList: { gap: theme.spacing.sm },
  dealCard: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  dealHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  dealTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  typeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10.5, fontWeight: '700' },
  dealMetaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dealMeta: { fontSize: 12, color: theme.colors.muted },
  dealRevenue: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, marginLeft: 'auto' },
  dealFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dealDate: { fontSize: 11, color: theme.colors.mutedLight },
  dealAgent: { fontSize: 11, color: theme.colors.mutedLight },
});
