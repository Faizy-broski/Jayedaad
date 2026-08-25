import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Lead,
  useFormattedPrice,
  useLeadInboxViewModel,
  useListingAnalyticsViewModel,
  useListingDetailViewModel,
} from '@jayedaad/core';
import { Badge, Button, Card, CardContent, theme } from '@jayedaad/ui-native';
import { LineChart } from '../components/LineChart';
import { MarkDealSheet } from '../components/MarkDealSheet';
import { RootStackParamList } from '../navigation/RootNavigator';

// KPI tile config — order matches the web performance page's own KPI grid
// (apps/web/app/(agent)/property-management/[id]/performance/page.tsx).
const KPI_TILES: { key: 'views' | 'clicks' | 'leads' | 'calls' | 'whatsapp' | 'sms' | 'emails'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'views', label: 'Views', icon: 'eye-outline' },
  { key: 'clicks', label: 'Clicks', icon: 'hand-left-outline' },
  { key: 'leads', label: 'Leads', icon: 'people-outline' },
  { key: 'calls', label: 'Calls', icon: 'call-outline' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { key: 'sms', label: 'SMS', icon: 'chatbubble-outline' },
  { key: 'emails', label: 'Emails', icon: 'mail-outline' },
];

// Same status-badge language ListingDetailScreen/MyPropertiesScreen already
// use — kept local since 'sold'/'rented' are terminal states this screen
// especially cares about (a Mark Sold/Rented button that just fired).
function statusBadge(status: string): { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' } {
  switch (status) {
    case 'verified':
      return { label: 'Verified', variant: 'success' };
    case 'sold':
      return { label: 'Sold', variant: 'success' };
    case 'rented':
      return { label: 'Rented', variant: 'success' };
    case 'pending_verification':
      return { label: 'Pending', variant: 'warning' };
    case 'rejected':
      return { label: 'Rejected', variant: 'destructive' };
    case 'expired':
      return { label: 'Expired', variant: 'destructive' };
    default:
      return { label: status, variant: 'default' };
  }
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
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

// Per-listing performance breakdown — the mobile counterpart to
// apps/web/app/(agent)/property-management/[id]/performance/page.tsx.
// Header + KPI tiles + trend chart + Mark Sold/Rented + a trimmed,
// listing-scoped lead list (full lead management stays on AgentCRMScreen).
export function ListingPerformanceScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListingPerformance'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { listingId } = route.params;

  const { listing, isLoading, error } = useListingDetailViewModel(listingId);
  const { analytics, isAnalyticsLoading, dailyAnalytics, isDailyAnalyticsLoading } = useListingAnalyticsViewModel(listingId);
  const { leads, isLoading: isLeadsLoading } = useLeadInboxViewModel({ listingId, pageSize: 5 });
  const { format: formatPrice } = useFormattedPrice();

  const [dealSheetOpen, setDealSheetOpen] = useState(false);

  if (error) {
    return (
      <View style={styles.centerRoot}>
        <Ionicons name="alert-circle-outline" size={32} color={theme.colors.muted} />
        <Text style={styles.muted}>This listing is no longer available.</Text>
        <Button label="Go back" variant="secondary" size="sm" onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.md }} />
      </View>
    );
  }

  if (isLoading || !listing) {
    return (
      <View style={styles.centerRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];
  const badge = statusBadge(listing.status);
  // Same eligibility rule as MyPropertiesScreen's row action — never both,
  // driven by the listing's own purpose.
  const canMarkDeal = listing.status === 'verified' && (listing.purpose === 'sale' || listing.purpose === 'rent');

  // LineChart only supports one series per instance — two charts (Views,
  // Leads) rather than trying to force a two-line render into a component
  // built for a single series.
  const viewsPoints = dailyAnalytics.map((d) => ({ label: shortDate(d.date), value: d.views }));
  const leadsPoints = dailyAnalytics.map((d) => ({ label: shortDate(d.date), value: d.leads }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER */}
      <Card>
        <CardContent style={styles.headerContent}>
          <View style={styles.headerRow}>
            {cover ? (
              <Image source={{ uri: cover.url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Ionicons name="image-outline" size={22} color={theme.colors.mutedLight} />
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
                <Text style={styles.location} numberOfLines={1}>{[listing.area, listing.city].filter(Boolean).join(', ')}</Text>
              </View>
              <Text style={styles.price}>{formatPrice(Number(listing.price))}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <Badge>{listing.purpose === 'sale' ? 'For Sale' : 'For Rent'}</Badge>
          </View>

          {canMarkDeal && (
            <Button
              label={listing.purpose === 'sale' ? 'Mark Sold' : 'Mark Rented'}
              onPress={() => setDealSheetOpen(true)}
              style={styles.markDealButton}
            />
          )}
        </CardContent>
      </Card>

      {/* KPI TILES */}
      <View style={styles.sectionSpacing}>
        <Text style={styles.sectionTitle}>Performance</Text>
        {isAnalyticsLoading ? (
          <Text style={styles.centeredMuted}>Loading…</Text>
        ) : (
          <View style={styles.kpiGrid}>
            {KPI_TILES.map((tile) => (
              <Card key={tile.key} style={styles.kpiCard}>
                <CardContent style={styles.kpiContent}>
                  <Ionicons name={tile.icon} size={18} color={theme.colors.primary} />
                  <Text style={styles.kpiValue}>{analytics?.[tile.key] ?? 0}</Text>
                  <Text style={styles.kpiLabel}>{tile.label}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* TREND CHART */}
      <Card style={styles.sectionSpacing}>
        <CardContent>
          <Text style={styles.sectionTitle}>Views trend</Text>
          {isDailyAnalyticsLoading ? (
            <Text style={styles.centeredMuted}>Loading…</Text>
          ) : dailyAnalytics.length === 0 ? (
            <Text style={styles.centeredMuted}>No activity yet</Text>
          ) : (
            <View style={styles.chartWrap}>
              <LineChart data={viewsPoints} />
            </View>
          )}
        </CardContent>
      </Card>

      <Card style={styles.sectionSpacing}>
        <CardContent>
          <Text style={styles.sectionTitle}>Leads trend</Text>
          {isDailyAnalyticsLoading ? (
            <Text style={styles.centeredMuted}>Loading…</Text>
          ) : dailyAnalytics.length === 0 ? (
            <Text style={styles.centeredMuted}>No activity yet</Text>
          ) : (
            <View style={styles.chartWrap}>
              <LineChart data={leadsPoints} />
            </View>
          )}
        </CardContent>
      </Card>

      {/* LEADS — trimmed, listing-scoped; full lead management stays on AgentCRM */}
      <View style={styles.sectionSpacing}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Who inquired</Text>
          <Pressable onPress={() => navigation.navigate('AgentCRM', { listingId, listingTitle: listing.title })}>
            <Text style={styles.linkPrimary}>View all leads</Text>
          </Pressable>
        </View>

        {isLeadsLoading ? (
          <Text style={styles.centeredMuted}>Loading…</Text>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent style={styles.emptyLeadsContent}>
              <Ionicons name="mail-open-outline" size={28} color={theme.colors.muted} />
              <Text style={styles.emptyLeadsText}>No leads yet for this listing.</Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.leadList}>
            {leads.map((lead: Lead) => (
              <Pressable key={lead.id} onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id })}>
                <Card>
                  <CardContent style={styles.leadCardContent}>
                    <View style={styles.leadHeaderRow}>
                      <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
                      <Text style={styles.leadTime}>{relativeTime(lead.createdAt)}</Text>
                    </View>
                    {lead.message ? (
                      <Text style={styles.leadMessage} numberOfLines={2}>{lead.message}</Text>
                    ) : null}
                    <View style={styles.leadActionsRow}>
                      <Text style={styles.leadStatus}>{lead.status}</Text>
                      <View style={styles.leadActions}>
                        {lead.phone ? (
                          <>
                            <Pressable onPress={() => Linking.openURL(`tel:${lead.phone}`)} hitSlop={8} style={styles.leadActionIcon}>
                              <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                            </Pressable>
                            <Pressable
                              onPress={() => Linking.openURL(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)}
                              hitSlop={8}
                              style={styles.leadActionIcon}
                            >
                              <Ionicons name="logo-whatsapp" size={16} color={theme.colors.primary} />
                            </Pressable>
                          </>
                        ) : null}
                        {lead.email ? (
                          <Pressable onPress={() => Linking.openURL(`mailto:${lead.email}`)} hitSlop={8}>
                            <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {canMarkDeal && (
        <MarkDealSheet
          open={dealSheetOpen}
          onClose={() => setDealSheetOpen(false)}
          listingId={listingId}
          purpose={listing.purpose}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  centerRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg, gap: theme.spacing.sm },
  muted: { fontSize: 14, color: theme.colors.mutedLight },
  centeredMuted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center', paddingVertical: theme.spacing.md },

  headerContent: { gap: theme.spacing.sm },
  headerRow: { flexDirection: 'row', gap: theme.spacing.md },
  thumb: { width: 72, height: 72, borderRadius: theme.radius.md },
  thumbEmpty: { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  location: { fontSize: 12, color: theme.colors.muted, flexShrink: 1 },
  price: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: theme.spacing.sm },
  markDealButton: { marginTop: theme.spacing.xs },

  sectionSpacing: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  linkPrimary: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  kpiCard: { width: '31%' },
  kpiContent: { alignItems: 'center', gap: 4, paddingVertical: theme.spacing.md },
  kpiValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  kpiLabel: { fontSize: 11, color: theme.colors.muted },

  chartWrap: { marginTop: theme.spacing.xs },

  emptyLeadsContent: { alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.lg },
  emptyLeadsText: { fontSize: 13, color: theme.colors.muted },

  leadList: { gap: theme.spacing.sm },
  leadCardContent: { gap: 4 },
  leadHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leadName: { fontSize: 14, fontWeight: '700', color: theme.colors.text, flexShrink: 1 },
  leadTime: { fontSize: 11, color: theme.colors.mutedLight },
  leadMessage: { fontSize: 12.5, color: theme.colors.muted },
  leadActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  leadStatus: { fontSize: 11, fontWeight: '700', color: theme.colors.muted, textTransform: 'capitalize' },
  leadActions: { flexDirection: 'row', alignItems: 'center' },
  leadActionIcon: { marginRight: 10 },
});
