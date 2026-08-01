import { Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, usePreferencesViewModel, useSubscriptionViewModel } from '@jayedaad/core';
import { Card, CardContent, theme, useToast } from '@jayedaad/ui-native';

// Direct port of apps/web's (agent)/plan/page.tsx onto RN — same
// useSubscriptionViewModel (packages/core), same real backend
// (services/api/src/subscriptions), same honest disclosure that there's no
// payment integration: selecting a plan below is an immediate tier change,
// not a purchase.
export function PlanScreen() {
  const { current, isCurrentLoading, tiers, isTiersLoading, usage, selectTier } = useSubscriptionViewModel();
  const { preferences } = usePreferencesViewModel();
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.disclosure}>
          No payment processing is wired up in this app — selecting a plan below changes it immediately, it isn&apos;t a
          real purchase.
        </Text>

        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.currentHeader}>
              <Ionicons name="card-outline" size={16} color={theme.colors.muted} />
              <Text style={styles.currentHeaderText}>Current Plan</Text>
            </View>
            {isCurrentLoading ? (
              <Text style={styles.muted}>Loading…</Text>
            ) : current ? (
              <View>
                <Text style={styles.currentName}>{current.tier.name}</Text>
                <Text style={styles.currentDetail}>
                  {formatPrice(current.tier.price, preferences?.preferredCurrency)} · {current.tier.listingQuota} listings ·
                  status: {current.status}
                  {current.currentPeriodEnd && ` · renews ${new Date(current.currentPeriodEnd).toLocaleDateString()}`}
                </Text>
              </View>
            ) : (
              <Text style={styles.muted}>No plan selected yet — choose one below.</Text>
            )}

            {usage && (
              <View style={styles.usageWrap}>
                <View style={styles.usageLabelRow}>
                  <Text style={styles.usageLabel}>Listings used</Text>
                  <Text style={styles.usageLabel}>
                    {usage.used} / {usage.quota}
                  </Text>
                </View>
                <View style={styles.usageBarTrack}>
                  <View
                    style={[
                      styles.usageBarFill,
                      { width: `${usage.quota > 0 ? Math.min(100, (usage.used / usage.quota) * 100) : 0}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        <Text style={styles.sectionTitle}>Available Plans</Text>
        {isTiersLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : tiers.length === 0 ? (
          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              <Text style={styles.muted}>
                No plans have been configured yet — a Super Admin needs to create subscription tiers before agents can
                select one.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.tierGrid}>
            {tiers.map((tier) => {
              const isCurrent = current?.tierId === tier.id;
              return (
                <Card key={tier.id} style={[styles.card, styles.tierCard, isCurrent && styles.tierCardCurrent]}>
                  <CardContent style={styles.cardContent}>
                    <View style={styles.tierHeader}>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      {isCurrent && <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />}
                    </View>
                    <Text style={styles.tierPrice}>
                      {formatPrice(tier.price, preferences?.preferredCurrency)}
                      <Text style={styles.tierPriceSuffix}> /mo</Text>
                    </Text>
                    <Text style={styles.tierQuota}>{tier.listingQuota} listing quota</Text>
                    <Pressable
                      disabled={isCurrent || selectTier.isPending}
                      onPress={() =>
                        selectTier.mutate(
                          { tierId: tier.id },
                          {
                            onSuccess: () => showToast(`Switched to ${tier.name}.`),
                            onError: () => showToast('Something went wrong — please try again.', 'error'),
                          },
                        )
                      }
                      style={[styles.selectButton, isCurrent && styles.selectButtonCurrent]}
                    >
                      <Text style={[styles.selectButtonText, isCurrent && styles.selectButtonTextCurrent]}>
                        {isCurrent ? 'Current Plan' : selectTier.isPending ? 'Switching…' : 'Select Plan'}
                      </Text>
                    </Pressable>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
        {selectTier.isError && <Text style={styles.error}>Something went wrong — please try again.</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  disclosure: { fontSize: 13, color: theme.colors.muted },
  card: { marginBottom: 0 },
  cardContent: { gap: theme.spacing.sm },
  currentHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  currentHeaderText: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  currentName: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  currentDetail: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  muted: { fontSize: 13, color: theme.colors.muted },
  usageWrap: { marginTop: theme.spacing.xs },
  usageLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { fontSize: 11, color: theme.colors.muted },
  usageBarTrack: {
    marginTop: theme.spacing.xs,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondaryBg,
    overflow: 'hidden',
  },
  usageBarFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.sm },
  tierGrid: { gap: theme.spacing.md },
  tierCard: { borderWidth: 1, borderColor: theme.colors.border },
  tierCardCurrent: { borderColor: theme.colors.primary },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  tierPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  tierPriceSuffix: { fontSize: 13, fontWeight: '400', color: theme.colors.muted },
  tierQuota: { fontSize: 13, color: theme.colors.muted },
  selectButton: {
    marginTop: theme.spacing.sm,
    borderRadius: 999,
    minHeight: 48,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  selectButtonCurrent: { backgroundColor: theme.colors.secondaryBg },
  selectButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.bg },
  selectButtonTextCurrent: { color: theme.colors.muted },
  error: { fontSize: 13, color: theme.colors.danger },
});
