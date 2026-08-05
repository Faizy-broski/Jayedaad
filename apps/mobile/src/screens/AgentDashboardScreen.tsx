import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  LeadStatus,
  useAgencyAnalyticsViewModel,
  useAgentDashboardViewModel,
  useAgentProfileViewModel,
  useLeadInboxViewModel,
  usePreferencesViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, theme } from '@jayedaad/ui-native';
import { BarChart } from '../components/BarChart';
import { DonutChart } from '../components/DonutChart';
import { LineChart } from '../components/LineChart';
import { PropertyCard } from '../components/PropertyCard';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';

const PURPOSE_FILTERS: { id: 'sale' | 'rent' | undefined; label: string }[] = [
  { id: undefined, label: 'All' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
];

const LEAD_STATUS_STYLE: Record<LeadStatus, { bg: string; text: string; label: string }> = {
  new: { bg: '#E3F2ED', text: theme.colors.primary, label: 'New' },
  contacted: { bg: '#FFF4E0', text: '#B8790B', label: 'Contacted' },
  negotiating: { bg: '#FFEFE0', text: '#C2600B', label: 'Negotiating' },
  closed: { bg: '#E3F2ED', text: theme.colors.primary, label: 'Closed' },
  lost: { bg: theme.colors.surfaceAlt, text: theme.colors.muted, label: 'Lost' },
};

function shortWeekday(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

// Same viewmodel as apps/web's (agent)/dashboard/page.tsx — mobile agents
// see the exact same stat tiles web shows (Total Listings/For Sale/For
// Rent/Leads/Views) and the same two real charts web has (Listing
// engagement — Clicks/Leads/Calls/WhatsApp/SMS/Emails from the same
// `analytics` object; Listings Mix — For Sale vs For Rent from `stats`),
// plus a real per-day "Listing performance" line chart (dailyAnalytics, new
// this pass — web has no daily breakdown UI, this is a genuine mobile-only
// addition on top of web's real numbers, not a replacement for any of
// them). Recent Leads reuses the same useLeadInboxViewModel AgentCRMScreen's
// Inquiry Inbox already relies on. Quota and Credits stays out of scope
// here too — web's own version of this card is commented out (no
// quota/credits UI actually ships there either). Earnings/Payouts/
// Appointments/Reviews/per-listing distance are intentionally absent — no
// backing field exists anywhere for any of them.
export function AgentDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const [purposeFilter, setPurposeFilter] = useState<'sale' | 'rent' | undefined>(undefined);

  const { stats, analytics, dailyAnalytics, recentListings, isRecentListingsLoading } = useAgentDashboardViewModel({
    purpose: purposeFilter,
  });
  const { preferences } = usePreferencesViewModel();
  const { leads: recentLeads } = useLeadInboxViewModel({});
  // Agency Admin's "full visibility to their overall performance, analytics,
  // and their sales associates" (Document Verification Phase 3) — no-op
  // query for a non-admin (agencyId undefined disables it).
  const { profile } = useAgentProfileViewModel();
  const { analytics: agencyAnalytics } = useAgencyAnalyticsViewModel(
    profile?.isAgencyAdmin ? profile.agency?.id : undefined,
  );

  const activeListings = (stats?.forSaleCount ?? 0) + (stats?.forRentCount ?? 0);
  const viewsData = dailyAnalytics.map((d) => ({ label: shortWeekday(d.date), value: d.views }));
  const engagementData = [
    { label: 'Clicks', value: analytics?.clicks ?? 0 },
    { label: 'Leads', value: analytics?.leads ?? 0 },
    { label: 'Calls', value: analytics?.calls ?? 0 },
    { label: 'WhatsApp', value: analytics?.whatsapp ?? 0 },
    { label: 'SMS', value: analytics?.sms ?? 0 },
    { label: 'Emails', value: analytics?.emails ?? 0 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADLINE STATS — same 5 tiles as apps/web's dashboard */}
      <View style={styles.headlineGrid}>
        <View style={[styles.headlineCard, styles.headlineCardWide, styles.headlineCardPrimary]}>
          <Text style={styles.headlineLabelLight}>Total Listings</Text>
          <Text style={styles.headlineValueLight}>{activeListings}</Text>
          <Text style={styles.headlineSubLight}>For sale & rent</Text>
        </View>
        <View style={styles.headlineCard}>
          <Text style={styles.headlineLabel}>For Sale</Text>
          <Text style={styles.headlineValue}>{stats?.forSaleCount ?? 0}</Text>
          <Text style={styles.headlineSub}>Active</Text>
        </View>
        <View style={styles.headlineCard}>
          <Text style={styles.headlineLabel}>For Rent</Text>
          <Text style={styles.headlineValue}>{stats?.forRentCount ?? 0}</Text>
          <Text style={styles.headlineSub}>Active</Text>
        </View>
        <View style={styles.headlineCard}>
          <Text style={styles.headlineLabel}>Leads</Text>
          <Text style={styles.headlineValue}>{analytics?.leads ?? 0}</Text>
          <Text style={styles.headlineSub}>Last 30 days</Text>
        </View>
        <View style={styles.headlineCard}>
          <Text style={styles.headlineLabel}>Views</Text>
          <Text style={styles.headlineValue}>{analytics?.views ?? 0}</Text>
          <Text style={styles.headlineSub}>Last 30 days</Text>
        </View>
      </View>

      {/* AGENCY PERFORMANCE — Admin-only rollup across every sales associate */}
      {profile?.isAgencyAdmin && agencyAnalytics && (
        <Card style={styles.sectionSpacing}>
          <CardContent>
            <Text style={styles.sectionTitleLg}>Agency Performance</Text>
            <Text style={styles.muted}>Every sales associate in your agency</Text>
            <View style={styles.headlineGrid}>
              <View style={styles.headlineCard}>
                <Text style={styles.headlineLabel}>Listings</Text>
                <Text style={styles.headlineValue}>{agencyAnalytics.totals.forSaleCount + agencyAnalytics.totals.forRentCount}</Text>
              </View>
              <View style={styles.headlineCard}>
                <Text style={styles.headlineLabel}>Leads</Text>
                <Text style={styles.headlineValue}>{agencyAnalytics.totals.leads}</Text>
              </View>
              <View style={styles.headlineCard}>
                <Text style={styles.headlineLabel}>Closings</Text>
                <Text style={styles.headlineValue}>{agencyAnalytics.totals.closingsCount}</Text>
              </View>
              <View style={styles.headlineCard}>
                <Text style={styles.headlineLabel}>Views</Text>
                <Text style={styles.headlineValue}>{agencyAnalytics.totals.views}</Text>
              </View>
            </View>
            <View style={styles.associateList}>
              {agencyAnalytics.associates.map((a) => (
                <View key={a.agentId} style={styles.associateRow}>
                  <Text style={styles.associateName} numberOfLines={1}>
                    {a.displayName ?? 'Unnamed'}
                    {a.isAgencyAdmin ? ' (Admin)' : ''}
                  </Text>
                  <Text style={styles.associateStat}>
                    {a.stats.forSaleCount + a.stats.forRentCount} listings · {a.analytics.leads} leads · {a.closingsCount} closed
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      {/* LISTING ENGAGEMENT — same real 6-metric snapshot as web's bar chart */}
      <Card style={styles.sectionSpacing}>
        <CardContent>
          <Text style={styles.sectionTitleLg}>Listing engagement</Text>
          <Text style={styles.muted}>How buyers are reaching out to you</Text>
          <View style={styles.chartWrap}>
            <BarChart data={engagementData} />
          </View>
        </CardContent>
      </Card>

      {/* LISTINGS MIX — same real For Sale vs For Rent split as web's donut */}
      <Card style={styles.sectionSpacing}>
        <CardContent>
          <Text style={styles.sectionTitleLg}>Listings Mix</Text>
          <Text style={styles.muted}>Sale vs. rent split</Text>
          <View style={styles.chartWrap}>
            <DonutChart
              segments={[
                { label: 'For Sale', value: stats?.forSaleCount ?? 0, color: theme.colors.primary },
                { label: 'For Rent', value: stats?.forRentCount ?? 0, color: theme.gradients.gold.colors[0] },
              ]}
              centerValue={String(activeListings)}
              centerLabel="total"
            />
          </View>
        </CardContent>
      </Card>

      {/* LISTING PERFORMANCE — real per-day views, additive beyond web's own dashboard */}
      <Card style={styles.sectionSpacing}>
        <CardContent>
          <Text style={styles.sectionTitleLg}>Listing performance</Text>
          <Text style={styles.muted}>Views this week</Text>
          <View style={styles.chartWrap}>
            <LineChart data={viewsData} />
          </View>
        </CardContent>
      </Card>

      {/* RECENT LEADS */}
      {recentLeads.length > 0 && (
        <View style={styles.sectionSpacing}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitleLg}>Recent leads</Text>
            <Pressable onPress={() => navigation.navigate('AgentCRM')}>
              <Text style={styles.linkMuted}>View Inbox</Text>
            </Pressable>
          </View>
          <Card>
            <CardContent style={styles.recentLeadsContent}>
              {recentLeads.slice(0, 4).map((lead, i) => {
                const statusStyle = LEAD_STATUS_STYLE[lead.status];
                return (
                  <View key={lead.id} style={[styles.leadRow, i > 0 && styles.leadRowBorder]}>
                    <View style={styles.leadAvatar}>
                      <Text style={styles.leadAvatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.leadInfo}>
                      <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
                      <Text style={styles.muted} numberOfLines={1}>{lead.message}</Text>
                    </View>
                    <View style={[styles.leadStatusPill, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.leadStatusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                  </View>
                );
              })}
            </CardContent>
          </Card>
        </View>
      )}

      {/* MY LISTINGS */}
      <View style={styles.sectionSpacing}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitleLg}>My Listings</Text>
          <Pressable onPress={() => navigation.navigate('BuyerSearch')}>
            <Text style={styles.linkMuted}>View All Listings</Text>
          </Pressable>
        </View>

        <View style={styles.purposeRow}>
          {PURPOSE_FILTERS.map((f) => (
            <Text
              key={f.label}
              onPress={() => setPurposeFilter(f.id)}
              style={[styles.purposeChip, purposeFilter === f.id && styles.purposeChipActive]}
            >
              {f.label}
            </Text>
          ))}
        </View>

        {isRecentListingsLoading ? (
          <Text style={styles.centeredMuted}>Loading…</Text>
        ) : recentListings.length === 0 ? (
          <Card>
            <CardContent style={styles.recentListingsContent}>
              <View style={styles.emptyState}>
                <Ionicons name="image-outline" size={40} color={theme.colors.mutedLight} />
                <Text style={styles.emptyHeading}>No Active Listings</Text>
                <Text style={styles.emptySubtext}>Your active listings will appear here</Text>
                <Button
                  label="Post Listing"
                  onPress={() => navigation.navigate('PostListing')}
                  style={styles.emptyButton}
                />
              </View>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.listingsList}>
            {recentListings.map((listing) => (
              <PropertyCard
                key={listing.id}
                listing={listing}
                currency={preferences?.preferredCurrency}
                onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  sectionSpacing: { marginTop: theme.spacing.md },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  sectionTitleLg: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  linkMuted: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  muted: { fontSize: 12, color: theme.colors.muted },

  headlineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  headlineCard: {
    width: '47%',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  headlineCardWide: { width: '100%' },
  headlineCardPrimary: { backgroundColor: theme.colors.primary },
  headlineLabel: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },
  headlineLabelLight: { fontSize: 12, color: '#ffffffcc', fontWeight: '600' },
  headlineValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  headlineValueLight: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headlineSub: { fontSize: 11, color: theme.colors.mutedLight },
  headlineSubLight: { fontSize: 11, color: '#ffffffaa' },

  chartWrap: { marginTop: theme.spacing.md },

  associateList: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  associateRow: {
    paddingVertical: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  associateName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  associateStat: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  recentLeadsContent: { paddingVertical: theme.spacing.sm },
  leadRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
  leadRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  leadAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: { fontSize: 14, fontWeight: '700', color: theme.colors.mutedLight },
  leadInfo: { flex: 1, gap: 2 },
  leadName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  leadStatusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  leadStatusText: { fontSize: 11, fontWeight: '700' },

  purposeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  purposeChip: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: theme.colors.secondaryBg,
    overflow: 'hidden',
  },
  purposeChipActive: { backgroundColor: theme.colors.primary, color: theme.colors.bg },

  recentListingsContent: { paddingVertical: theme.spacing.xl },
  centeredMuted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
  emptyState: { alignItems: 'center' },
  emptyHeading: { marginTop: theme.spacing.sm, fontSize: 13, fontWeight: '700', color: theme.colors.text },
  emptySubtext: { marginTop: theme.spacing.xs, fontSize: 12, color: theme.colors.muted },
  emptyButton: { marginTop: theme.spacing.md },
  listingsList: { gap: theme.spacing.md },
});
