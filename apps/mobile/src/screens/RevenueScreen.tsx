import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Deal,
  useAgentProfileViewModel,
  useAuthViewModel,
  useDealsViewModel,
  useFormattedPrice,
  useRevenueViewModel,
} from '@jayedaad/core';
import { Card, CardContent, theme } from '@jayedaad/ui-native';
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

function initials(name: string | null): string {
  if (!name) return '?';
  return name.trim().slice(0, 2).toUpperCase();
}

// Backs the Profile-menu "Revenue" entry — commission revenue off the deals
// table (Mark Sold/Mark Rented), same data useRevenueViewModel/
// useDealsViewModel already serve on web's (agent)/revenue page. Redesigned
// around a brand-gradient hero (theme.gradients.primary — same token
// PlanScreen's CTA uses) instead of a plain white header, so the headline
// revenue figure and period switcher read as the primary focus.
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
  const activePeriodLabel = PERIOD_TABS.find((t) => t.id === period)!.label;

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>Total Revenue · {activePeriodLabel}</Text>
            {profile?.isAgencyAdmin && (
              <Pressable style={styles.scopeChip} onPress={() => setAgencyScope((v) => !v)}>
                <Ionicons name={agencyScope ? 'business' : 'business-outline'} size={13} color="#ffffff" />
                <Text style={styles.scopeChipText}>{agencyScope ? 'Agency' : 'My revenue'}</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {isRevenueLoading ? '···' : formatPrice(revenue?.totalRevenue ?? 0)}
          </Text>

          <View style={styles.periodRow}>
            {PERIOD_TABS.map((tab) => {
              const active = tab.id === period;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setPeriod(tab.id)}
                  style={[styles.periodPill, active && styles.periodPillActive]}
                >
                  <Text style={[styles.periodPillText, active && styles.periodPillTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.kpiGrid}>
          <KpiTile icon="briefcase-outline" iconBg="#E3F2ED" iconColor={theme.colors.primary} label="Deals Closed" value={String(revenue?.dealCount ?? 0)} />
          <KpiTile icon="trending-up-outline" iconBg="#FFF4E0" iconColor="#B8790B" label="Avg. Deal Value" value={formatPrice(avgDealValue)} />
        </View>

        <Card style={styles.cardSpacious}>
          <CardContent style={styles.cardContentSpacious}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: '#E3F2ED' }]}>
                <Ionicons name="stats-chart-outline" size={14} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Revenue trend</Text>
            </View>
            {isRevenueLoading ? (
              <Text style={styles.centeredMuted}>Loading…</Text>
            ) : chartData.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="bar-chart-outline" size={22} color={theme.colors.mutedLight} />
                <Text style={styles.centeredMuted}>No deals closed yet</Text>
              </View>
            ) : (
              <View style={styles.chartWrap}>
                <BarChart data={chartData} />
              </View>
            )}
          </CardContent>
        </Card>

        {profile?.isAgencyAdmin && agencyScope && (
          <View style={styles.sectionSpacing}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF4E0' }]}>
                <Ionicons name="people-outline" size={14} color="#B8790B" />
              </View>
              <Text style={styles.sectionTitle}>By associate</Text>
            </View>
            <Card>
              <CardContent style={styles.listContent}>
                {sortedByAgent.length === 0 ? (
                  <Text style={styles.centeredMuted}>No associate revenue yet.</Text>
                ) : (
                  sortedByAgent.map((a, i) => (
                    <View key={a.agentId} style={[styles.associateRow, i > 0 && styles.associateRowBorder]}>
                      <View style={styles.associateAvatar}>
                        <Text style={styles.associateAvatarText}>{initials(a.displayName)}</Text>
                      </View>
                      <View style={styles.associateInfo}>
                        <Text style={styles.associateName} numberOfLines={1}>
                          {a.displayName ?? 'Unnamed'}
                        </Text>
                        <Text style={styles.associateStat}>{a.dealCount} deals</Text>
                      </View>
                      <Text style={styles.associateRevenue}>{formatPrice(a.revenue)}</Text>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>
          </View>
        )}

        <View style={styles.sectionSpacing}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Ionicons name="receipt-outline" size={14} color={theme.colors.text} />
            </View>
            <Text style={styles.sectionTitle}>Deals</Text>
          </View>
          {isDealsLoading ? (
            <Text style={styles.centeredMuted}>Loading…</Text>
          ) : deals.length === 0 ? (
            <Card>
              <CardContent style={styles.listContent}>
                <View style={styles.emptyBlock}>
                  <Ionicons name="document-text-outline" size={22} color={theme.colors.mutedLight} />
                  <Text style={styles.centeredMuted}>No deals closed yet</Text>
                </View>
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

function KpiTile({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.kpiTile}>
      <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
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
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  sectionIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  centeredMuted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
  emptyBlock: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: theme.spacing.md },

  hero: {
    borderRadius: 24,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  heroValue: { fontSize: 34, fontWeight: '800', color: '#ffffff' },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scopeChipText: { fontSize: 11.5, fontWeight: '700', color: '#ffffff' },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: 3,
    marginTop: theme.spacing.xs,
  },
  periodPill: { flex: 1, borderRadius: 999, paddingVertical: 7, alignItems: 'center' },
  periodPillActive: { backgroundColor: '#ffffff' },
  periodPillText: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  periodPillTextActive: { color: theme.colors.primary },

  kpiGrid: { flexDirection: 'row', gap: theme.spacing.sm },
  kpiTile: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  kpiIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: theme.colors.muted, fontWeight: '600' },
  kpiValue: { fontSize: 17, fontWeight: '800', color: theme.colors.text },

  cardSpacious: { borderRadius: 20 },
  cardContentSpacious: { padding: theme.spacing.xl },
  chartWrap: { marginTop: theme.spacing.sm },

  listContent: { paddingVertical: theme.spacing.sm },
  associateRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
  associateRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  associateAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  associateAvatarText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  associateInfo: { flex: 1, minWidth: 0 },
  associateName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  associateStat: { fontSize: 11.5, color: theme.colors.muted, marginTop: 1 },
  associateRevenue: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

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
