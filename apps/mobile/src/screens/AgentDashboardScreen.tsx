import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, useAgentDashboardViewModel, usePreferencesViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';

const PURPOSE_FILTERS: { id: 'sale' | 'rent' | undefined; label: string }[] = [
  { id: undefined, label: 'All' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
];

// Same viewmodel as apps/web's (agent)/dashboard/page.tsx — mobile agents
// see the same stats/analytics/recent-listings data as web. Quota and
// Credits stays out of scope here too — web's own version of this card is
// commented out (no quota/credits UI actually ships there either).
export function AgentDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const [purposeFilter, setPurposeFilter] = useState<'sale' | 'rent' | undefined>(undefined);

  const { stats, analytics, recentListings, isRecentListingsLoading } = useAgentDashboardViewModel({
    purpose: purposeFilter,
  });
  const { preferences } = usePreferencesViewModel();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <CardContent>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <Pressable onPress={() => navigation.navigate('BuyerSearch')}>
              <Text style={styles.link}>View all Listings</Text>
            </Pressable>
          </View>
          <View style={styles.statGrid}>
            <StatTile icon="home-outline" label="For Sale" value={stats?.forSaleCount ?? 0} />
            <StatTile icon="home-outline" label="For Rent" value={stats?.forRentCount ?? 0} />
            <StatTile
              icon="flame-outline"
              label="Super Hot"
              value={stats?.byBoostTier.find((b) => b.tier === 'super_hot')?.count ?? 0}
            />
            <StatTile icon="sparkles-outline" label="Hot" value={stats?.byBoostTier.find((b) => b.tier === 'hot')?.count ?? 0} />
          </View>
        </CardContent>
      </Card>

      <Card style={styles.sectionSpacing}>
        <CardContent>
          <View style={styles.purposeHeaderRow}>
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
            <Text style={styles.muted}>Last 30 Days</Text>
          </View>
          <View style={[styles.statGridWrap, styles.sectionSpacing]}>
            <StatFigure label="Clicks" value={analytics?.clicks ?? 0} />
            <StatFigure label="Leads" value={analytics?.leads ?? 0} />
            <StatFigure label="Calls" value={analytics?.calls ?? 0} />
            <StatFigure label="WhatsApp" value={analytics?.whatsapp ?? 0} />
            <StatFigure label="SMS" value={analytics?.sms ?? 0} />
            <StatFigure label="Emails" value={analytics?.emails ?? 0} />
          </View>

          <View style={styles.insightsTeaser}>
            <View style={styles.insightsIconWrap}>
              <Ionicons name="stats-chart-outline" size={20} color={theme.colors.primary} />
              <View style={styles.insightsBadge}>
                <Text style={styles.insightsBadgeText}>{analytics?.views ?? 0}</Text>
              </View>
            </View>
            <Text style={styles.insightsHeading}>View In-Depth Insights</Text>
            <Text style={styles.insightsSubtext}>
              See the number of views, clicks and leads that your listing has received.
            </Text>
          </View>
        </CardContent>
      </Card>

      <View style={styles.sectionSpacing}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitleLg}>Recent Listings</Text>
          <Pressable onPress={() => navigation.navigate('BuyerSearch')}>
            <Text style={styles.linkMuted}>View All Listings</Text>
          </Pressable>
        </View>
        <Card>
          <CardContent style={styles.recentListingsContent}>
            {isRecentListingsLoading ? (
              <Text style={styles.centeredMuted}>Loading…</Text>
            ) : recentListings.length === 0 ? (
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
            ) : (
              recentListings.map((listing) => (
                <View key={listing.id} style={styles.listingRow}>
                  <Text style={styles.listingTitle}>{listing.title}</Text>
                  <Text style={styles.muted}>
                    {listing.area}, {listing.city} — {formatPrice(Number(listing.price), preferences?.preferredCurrency)}
                  </Text>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

function StatTile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.statTileRow}>
      <View style={styles.statTileIconWrap}>
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View>
        <Text style={styles.muted}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatFigure({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statFigure}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.statValueLg}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  sectionSpacing: { marginTop: theme.spacing.md },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  sectionTitleLg: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  link: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  linkMuted: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },
  statGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },
  statTileRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, width: '42%' },
  statTileIconWrap: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  statFigure: { width: '28%' },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  statValueLg: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  muted: { fontSize: 12, color: theme.colors.muted },
  purposeHeaderRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  purposeRow: { flexDirection: 'row', gap: theme.spacing.sm },
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
  insightsTeaser: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.xl,
  },
  insightsIconWrap: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  insightsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.bg },
  insightsHeading: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  insightsSubtext: {
    marginTop: theme.spacing.xs,
    maxWidth: 260,
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  recentListingsContent: { paddingVertical: theme.spacing.xl },
  centeredMuted: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
  emptyState: { alignItems: 'center' },
  emptyHeading: { marginTop: theme.spacing.sm, fontSize: 13, fontWeight: '700', color: theme.colors.text },
  emptySubtext: { marginTop: theme.spacing.xs, fontSize: 12, color: theme.colors.muted },
  emptyButton: { marginTop: theme.spacing.md },
  listingRow: { paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderColor: theme.colors.border, gap: 2 },
  listingTitle: { fontWeight: '600', color: theme.colors.text },
});
