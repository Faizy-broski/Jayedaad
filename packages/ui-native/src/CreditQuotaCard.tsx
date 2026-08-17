import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from './Card';
import { theme } from './theme';

export type CreditCardAccent = 'green' | 'orange' | 'red' | 'blue' | 'purple';

const ACCENT_COLORS: Record<CreditCardAccent, { bg: string; text: string }> = {
  green: { bg: '#0D634B1A', text: theme.colors.primary },
  orange: { bg: '#EA580C1A', text: '#EA580C' },
  red: { bg: '#DC26261A', text: '#DC2626' },
  blue: { bg: '#2563EB1A', text: '#2563EB' },
  purple: { bg: '#A21CAF1A', text: '#A21CAF' },
};

export interface CreditQuotaCardProps {
  label: string;
  accent: CreditCardAccent;
  icon: keyof typeof Ionicons.glyphMap;
  available: number;
  used: number;
  // Omitted for Listing Quota — it isn't a purchasable credit type
  // (PurchasableCreditType excludes 'listing_quota'), so there's nothing to
  // buy more of and no banner/link should render.
  onBuyMore?: () => void;
  style?: ViewStyle;
}

// Card-per-credit-type "quota & credits" primitive shared with
// packages/ui-web's counterpart — both PlanScreen.tsx (mobile) and
// (agent)/plan/page.tsx (web) render one of these per credit type (Listing
// Quota, Hot, Super Hot, Refresh, Story) instead of the small uniform tiles
// previously buried inside the Current Plan card. Takes only primitives
// (no AgentCredit/SubscriptionUsage import) so this package stays free of a
// @jayedaad/core dependency, same boundary Card/Badge/Button already hold.
export function CreditQuotaCard({ label, accent, icon, available, used, onBuyMore, style }: CreditQuotaCardProps) {
  const colors = ACCENT_COLORS[accent];
  const isEmpty = available <= 0;

  return (
    <Card style={style}>
      <CardContent style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{label.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{available}</Text>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: isEmpty ? theme.colors.mutedLight : '#16A34A' }]} />
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>

          <View style={[styles.iconCircle]}>
            <Ionicons name={icon} size={20} color={colors.text} />
          </View>

          <View style={styles.stat}>
            <Text style={styles.statValue}>{used}</Text>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: theme.colors.mutedLight }]} />
              <Text style={styles.statLabel}>Used</Text>
            </View>
          </View>
        </View>

        {isEmpty && onBuyMore && (
          <Pressable style={styles.banner} onPress={onBuyMore}>
            <Ionicons name="information-circle-outline" size={16} color="#92400E" />
            <Text style={styles.bannerText}>No credits available.</Text>
            <Text style={styles.bannerLink}>Buy more →</Text>
          </Pressable>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.sm },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  badge: { borderRadius: 999, paddingHorizontal: theme.spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: 4, minWidth: 60 },
  statValue: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statLabel: { fontSize: 11, color: theme.colors.muted },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  bannerText: { fontSize: 12, color: '#92400E', flexShrink: 1 },
  bannerLink: { fontSize: 12, fontWeight: '800', color: '#92400E' },
});
