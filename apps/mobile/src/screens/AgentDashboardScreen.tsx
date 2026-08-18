import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput as RNTextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  AgentCreditType,
  LeadStatus,
  useAgencyAnalyticsViewModel,
  useAgentDashboardViewModel,
  useAgentProfileViewModel,
  useLeadInboxViewModel,
  useSubscriptionViewModel,
  useTasksViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, theme, useToast } from '@jayedaad/ui-native';
import { BarChart } from '../components/BarChart';
import { DonutChart } from '../components/DonutChart';
import { LineChart } from '../components/LineChart';
import { ListingSummaryCard } from '../components/ListingSummaryCard';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';

const PURPOSE_FILTERS: { id: 'sale' | 'rent' | undefined; label: string }[] = [
  { id: undefined, label: 'All' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
];

const CREDIT_TABS: { id: AgentCreditType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'listing_quota', label: 'Quota', icon: 'home-outline' },
  { id: 'refresh', label: 'Refresh', icon: 'trending-up-outline' },
  { id: 'hot', label: 'Hot', icon: 'sparkles-outline' },
  { id: 'super_hot', label: 'Super Hot', icon: 'flame-outline' },
  { id: 'story', label: 'Story', icon: 'film-outline' },
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

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export function AgentDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const [purposeFilter, setPurposeFilter] = useState<'sale' | 'rent' | undefined>(undefined);
  const [activeCreditTab, setActiveCreditTab] = useState<AgentCreditType>('listing_quota');

  const {
    stats,
    analytics,
    dailyAnalytics,
    recentListings,
    isRecentListingsLoading,
    isRecentListingsError,
    credits,
    isCreditsLoading,
  } = useAgentDashboardViewModel({
      purpose: purposeFilter,
    });
  const { current: currentPlan } = useSubscriptionViewModel();
  const { leads: recentLeads } = useLeadInboxViewModel({});
  const {
    openTasks,
    isLoading: isTasksLoading,
    isError: isTasksError,
    create: createTask,
    complete: completeTask,
  } = useTasksViewModel();
  const { showToast } = useToast();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { profile } = useAgentProfileViewModel();
  const { analytics: agencyAnalytics } = useAgencyAnalyticsViewModel(
    profile?.isAgencyAdmin ? profile.agency?.id : undefined,
  );

  const activeListings = (stats?.forSaleCount ?? 0) + (stats?.forRentCount ?? 0);
  const activeCredit = credits.find((c) => c.creditType === activeCreditTab);
  const activeCreditPct = activeCredit && activeCredit.total > 0 ? Math.min(100, (activeCredit.available / activeCredit.total) * 100) : 0;
  const listingQuotaCredit = credits.find((c) => c.creditType === 'listing_quota');
  const viewsData = dailyAnalytics.map((d) => ({ label: shortWeekday(d.date), value: d.views }));
  const leadsData = dailyAnalytics.map((d) => ({
    label: shortWeekday(d.date),
    value: d.leads,
    highlighted: isToday(d.date),
  }));
  const engagementData = [
    { label: 'Clicks', value: analytics?.clicks ?? 0 },
    { label: 'Leads', value: analytics?.leads ?? 0 },
    { label: 'Calls', value: analytics?.calls ?? 0 },
    { label: 'WhatsApp', value: analytics?.whatsapp ?? 0 },
    { label: 'SMS', value: analytics?.sms ?? 0 },
    { label: 'Emails', value: analytics?.emails ?? 0 },
  ];

  function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    createTask.mutate(
      { title },
      {
        onSuccess: () => setNewTaskTitle(''),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADLINE STATS — 2x2 grid aesthetic */}
      <View style={styles.headlineGrid}>
        {/* Primary Card with Fluid Nested Concentric Overlays */}
        <View style={[styles.headlineCard, styles.headlineCardPrimary]}>
          <View style={styles.blobPrimary} />
          <View style={styles.blobSecondary} />
          <View style={styles.blobTertiary} />
          <View style={styles.cardForeground}>
            <Text style={styles.headlineLabelLight}>For Sale</Text>
            <Text style={styles.headlineValueLight}>{stats?.forSaleCount ?? 0}</Text>
            <Text style={styles.headlineSubLightAccent}>Active</Text>
          </View>
        </View>

        {/* Standard Metric Cards */}
        <View style={styles.headlineCard}>
          <View style={styles.cardForeground}>
            <Text style={styles.headlineLabel}>For Rent</Text>
            <Text style={styles.headlineValue}>{stats?.forRentCount ?? 0}</Text>
            <Text style={styles.headlineSubAccent}>Active</Text>
          </View>
        </View>
        <View style={styles.headlineCard}>
          <View style={styles.cardForeground}>
            <Text style={styles.headlineLabel}>Leads</Text>
            <Text style={styles.headlineValue}>{analytics?.leads ?? 0}</Text>
            <Text style={styles.headlineSubAccent}>Last 30 days</Text>
          </View>
        </View>
        <View style={styles.headlineCard}>
          <View style={styles.cardForeground}>
            <Text style={styles.headlineLabel}>Views</Text>
            <Text style={styles.headlineValue}>{analytics?.views ?? 0}</Text>
            <Text style={styles.headlineSubAccent}>Last 30 days</Text>
          </View>
        </View>
      </View>

      {/* QUOTA & CREDITS */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
        <CardContent style={styles.cardContentSpacious}>
          <Text style={styles.sectionTitleLg}>Quota & Credits</Text>
          <Text style={styles.muted}>Plan: {currentPlan?.tier.name ?? '—'}</Text>

          <View style={styles.creditTabRow}>
            {CREDIT_TABS.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveCreditTab(tab.id)}
                style={[styles.creditTabChip, activeCreditTab === tab.id && styles.creditTabChipActive]}
              >
                <Ionicons name={tab.icon} size={12} color={activeCreditTab === tab.id ? theme.colors.bg : theme.colors.muted} />
                <Text style={[styles.creditTabText, activeCreditTab === tab.id && styles.creditTabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>

          {isCreditsLoading ? (
            <Text style={styles.centeredMuted}>Loading…</Text>
          ) : (
            <View style={styles.creditGaugeWrap}>
              <View style={styles.usageLabelRow}>
                <Text style={styles.usageLabel}>{activeCredit?.available ?? 0} available</Text>
                <Text style={styles.usageLabel}>of {activeCredit?.total ?? 0}</Text>
              </View>
              <View style={styles.usageBarTrack}>
                <View style={[styles.usageBarFill, { width: `${activeCreditPct}%` }]} />
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* MY PLAN */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
        <CardContent style={styles.cardContentSpacious}>
          <View style={styles.planHeaderRow}>
            <Ionicons name="card-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.mutedUpper}>My Plan</Text>
          </View>
          <Text style={styles.planName}>{currentPlan?.tier.name ?? 'No active plan'}</Text>
          <Text style={styles.muted}>{currentPlan?.status ?? '—'}</Text>
          {currentPlan?.currentPeriodEnd && (
            <Text style={styles.muted}>
              Renews {new Date(currentPlan.currentPeriodEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
          {listingQuotaCredit && (
            <Text style={styles.planQuotaText}>
              {listingQuotaCredit.available} of {listingQuotaCredit.total} listing slots left
            </Text>
          )}
          <Pressable onPress={() => navigation.navigate('Plan')} style={styles.manageplanRow}>
            <Text style={styles.linkPrimary}>Manage plan</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
          </Pressable>
        </CardContent>
      </Card>

      {/* GROW FASTER */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious, styles.growCard]}>
        <CardContent style={styles.cardContentSpacious}>
          <Text style={styles.growEyebrow}>Grow faster</Text>
          <Text style={styles.growHeading}>
            Boost a listing to <Text style={styles.growHeadingAccent}>Hot</Text> or{' '}
            <Text style={styles.growHeadingAccent}>Super Hot</Text> to reach more buyers.
          </Text>
          <Pressable onPress={() => navigation.navigate('MyProperties')} style={styles.growButton}>
            <Text style={styles.growButtonText}>Boost a listing</Text>
          </Pressable>
        </CardContent>
      </Card>

      {/* AGENCY PERFORMANCE */}
      {profile?.isAgencyAdmin && agencyAnalytics && (
        <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
          <CardContent style={styles.cardContentSpacious}>
            <Text style={styles.sectionTitleLg}>Agency Performance</Text>
            <Text style={styles.muted}>Every sales associate in your agency</Text>
            <View style={styles.headlineGrid}>
              <View style={styles.headlineCard}>
                <View style={styles.cardForeground}>
                  <Text style={styles.headlineLabel}>Listings</Text>
                  <Text style={styles.headlineValue}>{agencyAnalytics.totals.forSaleCount + agencyAnalytics.totals.forRentCount}</Text>
                </View>
              </View>
              <View style={styles.headlineCard}>
                <View style={styles.cardForeground}>
                  <Text style={styles.headlineLabel}>Leads</Text>
                  <Text style={styles.headlineValue}>{agencyAnalytics.totals.leads}</Text>
                </View>
              </View>
              <View style={styles.headlineCard}>
                <View style={styles.cardForeground}>
                  <Text style={styles.headlineLabel}>Closings</Text>
                  <Text style={styles.headlineValue}>{agencyAnalytics.totals.closingsCount}</Text>
                </View>
              </View>
              <View style={styles.headlineCard}>
                <View style={styles.cardForeground}>
                  <Text style={styles.headlineLabel}>Views</Text>
                  <Text style={styles.headlineValue}>{agencyAnalytics.totals.views}</Text>
                </View>
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

      {/* LISTING ENGAGEMENT */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
        <CardContent style={styles.cardContentSpacious}>
          <Text style={styles.sectionTitleLg}>Listing engagement</Text>
          <Text style={styles.muted}>How buyers are reaching out to you</Text>
          <View style={styles.chartWrap}>
            <BarChart data={engagementData} />
          </View>
        </CardContent>
      </Card>

      {/* LISTINGS MIX */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
        <CardContent style={styles.cardContentSpacious}>
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

      {/* LISTING PERFORMANCE */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
        <CardContent style={styles.cardContentSpacious}>
          <Text style={styles.sectionTitleLg}>Listing performance</Text>
          <Text style={styles.muted}>Views this week</Text>
          <View style={styles.chartWrap}>
            <LineChart data={viewsData} />
          </View>
        </CardContent>
      </Card>

      {/* LEADS CAPTURED */}
      <Card style={[styles.sectionSpacing, styles.cardSpacious]}>
        <CardContent style={styles.cardContentSpacious}>
          <Text style={styles.sectionTitleLg}>Leads captured</Text>
          <Text style={styles.muted}>By day</Text>
          <View style={styles.chartWrap}>
            <BarChart data={leadsData} />
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
          <Card style={styles.cardSpacious}>
            <CardContent style={styles.recentLeadsContent}>
              {recentLeads.slice(0, 4).map((lead, i) => {
                const statusStyle = LEAD_STATUS_STYLE[lead.status];
                return (
                  <Pressable
                    key={lead.id}
                    style={[styles.leadRow, i > 0 && styles.leadRowBorder]}
                    onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id })}
                  >
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
                  </Pressable>
                );
              })}
            </CardContent>
          </Card>
        </View>
      )}

      {/* FOLLOW-UPS */}
      <View style={styles.sectionSpacing}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitleLg}>Follow-ups</Text>
        </View>
        <Card style={styles.cardSpacious}>
          <CardContent style={styles.followUpsContent}>
            <View style={styles.followUpComposer}>
              <RNTextInput
                style={styles.followUpInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Add a follow-up…"
                placeholderTextColor={theme.colors.mutedLight}
                onSubmitEditing={handleAddTask}
              />
              <Button label="Add" size="sm" disabled={!newTaskTitle.trim() || createTask.isPending} onPress={handleAddTask} />
            </View>

            {isTasksLoading ? (
              <Text style={styles.centeredMuted}>Loading…</Text>
            ) : isTasksError ? (
              <Text style={styles.errorText}>Couldn't load your tasks.</Text>
            ) : openTasks.length === 0 ? (
              <Text style={styles.muted}>Nothing on your list — nice.</Text>
            ) : (
              <View style={styles.followUpsList}>
                {openTasks.map((task) => (
                  <View key={task.id} style={styles.followUpRow}>
                    <Pressable onPress={() => completeTask.mutate(task.id)} disabled={completeTask.isPending} hitSlop={8}>
                      <Ionicons name="ellipse-outline" size={16} color={theme.colors.muted} />
                    </Pressable>
                    <Text style={styles.followUpTitle} numberOfLines={1}>{task.title}</Text>
                    {task.dueAt && (
                      <Text style={styles.followUpDue}>
                        {new Date(task.dueAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* MY LISTINGS */}
      <View style={styles.sectionSpacing}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.sectionTitleLg}>My Listings</Text>
            <Text style={styles.listingsCountText}>{activeListings} active</Text>
          </View>
          <Pressable style={styles.seeAllLink} onPress={() => navigation.navigate('BuyerSearch')} hitSlop={6}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
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
        ) : isRecentListingsError ? (
          <Text style={styles.errorText}>Couldn't load your listings.</Text>
        ) : recentListings.length === 0 ? (
          <Card style={styles.cardSpacious}>
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
              <ListingSummaryCard
                key={listing.id}
                listing={listing}
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
  listingsCountText: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  seeAllLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  muted: { fontSize: 12, color: theme.colors.muted },

  cardSpacious: { borderRadius: 20 },
  cardContentSpacious: { padding: theme.spacing.xl },

  // Updated 2x2 Grid aesthetic with Fluid Shapes
  headlineGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    gap: theme.spacing.sm 
  },
  headlineCard: {
    width: '48%', 
    backgroundColor: theme.colors.surfaceAlt || '#F3F4F6',
    borderRadius: 20, 
    position: 'relative',
    overflow: 'hidden',
    minHeight: 110,
  },
  headlineCardPrimary: { 
    backgroundColor: '#115E3E', 
  },
  
  // Fluid Background Blobs - Deeply Nested Far Right
  blobPrimary: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: -60,
    right: -100,
  },
  blobSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: -10,
    right: -50,
  },
  blobTertiary: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 30,
    right: -10,
  },
  
  cardForeground: {
    padding: theme.spacing.lg,
    zIndex: 1, 
  },

  // Custom Typography for KPI Cards
  headlineLabel: { fontSize: 14, color: theme.colors.muted, fontWeight: '500' },
  headlineLabelLight: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' },
  headlineValue: { fontSize: 32, fontWeight: '800', color: theme.colors.text, marginTop: 4, marginBottom: 2 },
  headlineValueLight: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginTop: 4, marginBottom: 2 },
  headlineSubAccent: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  headlineSubLightAccent: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  chartWrap: { marginTop: theme.spacing.md },

  creditTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: theme.spacing.sm },
  creditTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.secondaryBg,
  },
  creditTabChipActive: { backgroundColor: theme.colors.primary },
  creditTabText: { fontSize: 11, fontWeight: '600', color: theme.colors.muted },
  creditTabTextActive: { color: theme.colors.bg },
  creditGaugeWrap: { marginTop: theme.spacing.md },
  usageLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { fontSize: 11, color: theme.colors.muted },
  usageBarTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondaryBg,
    overflow: 'hidden',
  },
  usageBarFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },

  planHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mutedUpper: { fontSize: 11, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  planName: { marginTop: 6, fontSize: 18, fontWeight: '700', color: theme.colors.text },
  planQuotaText: { marginTop: theme.spacing.sm, fontSize: 12, color: theme.colors.muted },
  manageplanRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: theme.spacing.md },
  linkPrimary: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  growCard: { backgroundColor: theme.colors.text, overflow: 'hidden' },
  growEyebrow: { fontSize: 11, fontWeight: '700', color: '#ffffff99', textTransform: 'uppercase', letterSpacing: 0.4 },
  growHeading: { marginTop: theme.spacing.sm, fontSize: 15, fontWeight: '600', color: '#ffffff', lineHeight: 21 },
  growHeadingAccent: { color: theme.colors.primary },
  growButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#ffffff',
  },
  growButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },

  associateList: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  associateRow: {
    paddingVertical: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  associateName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  associateStat: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  recentLeadsContent: { paddingVertical: theme.spacing.sm },
  leadRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md },
  leadRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  leadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
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

  followUpsContent: { paddingVertical: theme.spacing.sm },
  followUpComposer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  followUpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.text,
  },
  followUpsList: { gap: theme.spacing.sm },
  followUpRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: 4 },
  followUpTitle: { flex: 1, fontSize: 13, color: theme.colors.text },
  followUpDue: { fontSize: 11, color: theme.colors.muted },
  recentListingsContent: { paddingVertical: theme.spacing.xl },
  centeredMuted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
  errorText: { fontSize: 13, color: theme.colors.danger, textAlign: 'center' },
  emptyState: { alignItems: 'center' },
  emptyHeading: { marginTop: theme.spacing.sm, fontSize: 13, fontWeight: '700', color: theme.colors.text },
  emptySubtext: { marginTop: theme.spacing.xs, fontSize: 12, color: theme.colors.muted },
  emptyButton: { marginTop: theme.spacing.md },
  listingsList: { gap: theme.spacing.md },
});