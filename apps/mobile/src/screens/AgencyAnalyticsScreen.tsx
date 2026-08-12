import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAgencyAnalyticsViewModel, useAgentProfileViewModel } from '@jayedaad/core';
import { Card, CardContent, theme } from '@jayedaad/ui-native';

// Per-associate breakdown for agency admins — mobile's dashboard
// (AgentDashboardScreen.tsx) already shows an aggregate "Agency Performance"
// card using this same useAgencyAnalyticsViewModel/getStaffAnalytics data,
// but only the totals row, same as web's own dashboard. Web's super-admin
// agencies page additionally has a per-agent table on its "staff" tab;
// this is the agency-admin-facing equivalent, reusing the exact same
// AgencyStaffAnalyticsEntry data — no new backend endpoint.
export function AgencyAnalyticsScreen() {
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();
  const agencyId = profile?.agency?.id;
  const { analytics, isLoading } = useAgencyAnalyticsViewModel(agencyId);

  if (isProfileLoading || isLoading) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!profile?.isAgencyAdmin || !agencyId) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <Text style={styles.muted}>Agency analytics is only available to an agency&apos;s admin.</Text>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <Text style={styles.muted}>No data yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.totalsGrid}>
          <TotalTile label="Listings" value={analytics.totals.forSaleCount + analytics.totals.forRentCount} />
          <TotalTile label="Leads" value={analytics.totals.leads} />
          <TotalTile label="Closings" value={analytics.totals.closingsCount} />
          <TotalTile label="Views" value={analytics.totals.views} />
        </View>

        <Text style={styles.sectionTitle}>By associate</Text>
        <Card>
          <CardContent style={styles.listContent}>
            {analytics.associates.length === 0 ? (
              <Text style={styles.muted}>No associates yet.</Text>
            ) : (
              analytics.associates.map((a, i) => (
                <View key={a.agentId} style={[styles.associateRow, i > 0 && styles.associateRowBorder]}>
                  <Text style={styles.associateName} numberOfLines={1}>
                    {a.displayName ?? 'Unnamed'}
                    {a.isAgencyAdmin ? ' (Admin)' : ''}
                  </Text>
                  <Text style={styles.associateStat}>
                    {a.stats.forSaleCount + a.stats.forRentCount} listings · {a.analytics.leads} leads ·{' '}
                    {a.closingsCount} closed · {a.analytics.views} views
                  </Text>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.totalTile}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg, padding: 32 },
  muted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  totalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  totalTile: {
    width: '47%',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  totalLabel: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.sm },
  listContent: { paddingVertical: theme.spacing.sm },
  associateRow: { paddingVertical: theme.spacing.sm },
  associateRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  associateName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  associateStat: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
});
