import { useRef, useState } from 'react';
import { Linking, ScrollView, Text, View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AgentCreditType, useAgentCreditsViewModel, useFormattedPrice, useSubscriptionViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CreditQuotaCard, CreditCardAccent, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

const CREDIT_TYPE_LABEL: Record<string, string> = { hot: 'Hot', super_hot: 'Super Hot', refresh: 'Refresh', story: 'Story' };

// Drives the new "My Quota & Credits" card grid — same 4 purchasable types
// as SHOP_ITEM_META below, plus listing_quota (not purchasable, so it's the
// only entry without a matching credit_packs row / onBuyMore target).
const QUOTA_CARD_META: { type: AgentCreditType; label: string; accent: CreditCardAccent; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'listing_quota', label: 'Listing Quota', accent: 'green', icon: 'home-outline' },
  { type: 'hot', label: 'Hot', accent: 'orange', icon: 'flame-outline' },
  { type: 'super_hot', label: 'Super Hot', accent: 'red', icon: 'flame' },
  { type: 'refresh', label: 'Refresh', accent: 'blue', icon: 'refresh-outline' },
  { type: 'story', label: 'Story', accent: 'purple', icon: 'film-outline' },
];

// Zameen-style shop presentation per credit type — icon + tint + one-line
// marketing blurb, purely cosmetic (no new icon assets, Ionicons already
// used throughout this app). Keyed by AgentCreditType; falls back to a
// neutral look for any credit type not in this list (shouldn't happen —
// credit_packs is seeded with only these four types).
const SHOP_ITEM_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string; subtitle: string }> = {
  hot: { icon: 'flame-outline', tint: '#EA580C', subtitle: 'Feature your listing at the top of search' },
  super_hot: { icon: 'flame', tint: '#DC2626', subtitle: 'Maximum visibility — top placement, longer' },
  refresh: { icon: 'refresh-outline', tint: '#2563EB', subtitle: 'Bump your listing back to the top instantly' },
  story: { icon: 'film-outline', tint: '#A21CAF', subtitle: '24-hour featured placement' },
};
const DEFAULT_SHOP_ITEM_META = { icon: 'pricetag-outline' as const, tint: theme.colors.primary, subtitle: '' };

// Brought up to parity with apps/web's (agent)/plan/page.tsx — same
// useSubscriptionViewModel (packages/core), same real Stripe checkout for
// paid tiers (previously mobile only had the free-tier instant-select path
// and a stale "not a real purchase" disclosure), same cancel/billing-portal
// actions. Checkout/credit-pack purchase now open via expo-web-browser's
// openAuthSessionAsync(url, returnUrl) instead of a plain Linking.openURL —
// the backend's successUrl/cancelUrl were hardcoded to the web app's own
// /dashboard/plan route (services/api's subscriptions.controller.ts), so a
// mobile user completing payment in the system browser was stranded there
// instead of returning to the app. Passing a jayedaad:// returnUrl (only
// mobile does; web omits it and keeps the old default) makes Stripe
// redirect to that scheme, which openAuthSessionAsync recognizes and
// auto-dismisses back into the app on.
export function PlanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollRef = useRef<ScrollView>(null);
  const buyMoreY = useRef(0);
  const {
    current,
    isCurrentLoading,
    tiers,
    isTiersLoading,
    usage,
    creditPacks,
    isCreditPacksLoading,
    selectTier,
    checkoutTier,
    cancelSubscription,
    openBillingPortal,
    checkoutCreditCart,
  } = useSubscriptionViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Zameen-style cart — packId -> quantity. Local only; nothing is
  // reserved/committed until Proceed to Payment actually opens Stripe.
  const [cart, setCart] = useState<Record<string, number>>({});
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = creditPacks.reduce((sum, pack) => sum + (cart[pack.id] ?? 0) * Number(pack.price), 0);

  function setCartQuantity(packId: string, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== packId));
      }
      return { ...prev, [packId]: quantity };
    });
  }
  // Previously this screen only showed listing quota — an agent had to go
  // to the Realtor Dashboard to see their actual Hot/Super Hot/Refresh/
  // Story balances, the same numbers "Buy more credits" below is meant to
  // help them top up.
  const { credits } = useAgentCreditsViewModel();

  // Opens the Stripe Checkout URL in an in-app browser sheet and waits for
  // it to redirect to returnUrl — resolves once Stripe returns control to
  // the app, whether the user completed or cancelled payment. Cache
  // invalidation here is best-effort (the webhook may not have processed
  // yet, same eventual-consistency web already lives with); it just means
  // the Plan screen picks up the new state as soon as it has, without
  // needing a manual pull-to-refresh.
  async function openCheckoutAndRefresh(url: string) {
    const returnUrl = ExpoLinking.createURL('plan');
    await WebBrowser.openAuthSessionAsync(url, returnUrl);
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['credit-packs'] });
  }

  function handleProceedToPayment() {
    const items = Object.entries(cart).map(([packId, quantity]) => ({ packId, quantity }));
    checkoutCreditCart.mutate(
      { items, returnUrl: ExpoLinking.createURL('plan') },
      {
        onSuccess: (result) => {
          if (result.url) {
            openCheckoutAndRefresh(result.url);
            setCart({});
          } else {
            showToast('Checkout is not available for these credits yet — contact support.', 'error');
          }
        },
        onError: () => showToast('Could not start checkout — please try again.', 'error'),
      },
    );
  }

  // Jumps to "Buy more credits" and, when there's a 1:1 pack for the
  // credit type that's empty, seeds the cart with one — tapping "Buy more"
  // on e.g. the Refresh card should land the agent one tap away from
  // checkout instead of just scrolling them to a list they still have to
  // scan themselves.
  function handleBuyMore(type: AgentCreditType) {
    scrollRef.current?.scrollTo({ y: buyMoreY.current, animated: true });
    const pack = creditPacks.find((p) => p.creditType === type);
    if (pack) setCartQuantity(pack.id, Math.max(1, cart[pack.id] ?? 0));
  }

  function handleCancel() {
    cancelSubscription.mutate(undefined, {
      onSuccess: () => showToast('Subscription will cancel at the end of the current period.'),
      onError: () => showToast('Something went wrong — please try again.', 'error'),
    });
  }

  function handleManageBilling() {
    openBillingPortal.mutate(undefined, {
      onSuccess: (result) => Linking.openURL(result.url),
      onError: () => showToast('No billing account yet — subscribe to a paid plan first.', 'error'),
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      {/* This screen's content (current plan + every tier card + credit
          packs) was a plain View with no scroll container at all — it
          overflowed the screen with no way to reach anything below the
          fold, including the lower tiers' own "Select Plan"/"Upgrade with
          Stripe" buttons. */}
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                  {formatPrice(current.tier.price)} · {current.tier.listingQuota} listings ·
                  status: {current.status}
                  {current.currentPeriodEnd &&
                    ` · ${current.cancelAtPeriodEnd ? 'cancels' : 'renews'} ${new Date(current.currentPeriodEnd).toLocaleDateString()}`}
                </Text>
                {current.tier.price > 0 && (
                  <View style={styles.billingRow}>
                    <Pressable onPress={handleManageBilling} disabled={openBillingPortal.isPending}>
                      <Text style={styles.billingLink}>Manage billing</Text>
                    </Pressable>
                    {!current.cancelAtPeriodEnd && (
                      <Pressable onPress={handleCancel} disabled={cancelSubscription.isPending}>
                        <Text style={styles.billingLinkMuted}>Cancel subscription</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.muted}>No plan selected yet — choose one below.</Text>
            )}
          </CardContent>
        </Card>

        {/* One card per credit type — replaces the old progress bar +
            uniform tile grid that buried these numbers inside the Current
            Plan card with no per-type identity and no obvious next step
            when a balance hit zero. */}
        <Text style={styles.sectionTitle}>My Quota &amp; Credits</Text>
        <View style={styles.quotaGrid}>
          {QUOTA_CARD_META.map((meta) => {
            const isQuota = meta.type === 'listing_quota';
            const available = isQuota ? Math.max(0, (usage?.quota ?? 0) - (usage?.used ?? 0)) : (credits.find((c) => c.creditType === meta.type)?.available ?? 0);
            const used = isQuota ? (usage?.used ?? 0) : (credits.find((c) => c.creditType === meta.type)?.used ?? 0);
            return (
              <CreditQuotaCard
                key={meta.type}
                label={meta.label}
                accent={meta.accent}
                icon={meta.icon}
                available={available}
                used={used}
                onBuyMore={isQuota ? undefined : () => handleBuyMore(meta.type)}
              />
            );
          })}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          <Pressable onPress={() => navigation.navigate('HelpDesk')} hitSlop={8}>
            <Text style={styles.learnMore}>Learn More</Text>
          </Pressable>
        </View>
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
              const isPaid = Number(tier.price) > 0;
              const features = [
                `${tier.listingQuota.toLocaleString()} listing quota`,
                // Previously absent — an agent had no way to see how many
                // projects a tier includes despite it being a real,
                // server-enforced entitlement (EntitlementsService.
                // canCreateProject).
                tier.projectQuota > 0 && `${tier.projectQuota.toLocaleString()} project quota`,
                tier.hotCreditsPerPeriod > 0 && `${tier.hotCreditsPerPeriod} Hot boost${tier.hotCreditsPerPeriod === 1 ? '' : 's'}/mo`,
                tier.superHotCreditsPerPeriod > 0 &&
                  `${tier.superHotCreditsPerPeriod} Super Hot boost${tier.superHotCreditsPerPeriod === 1 ? '' : 's'}/mo`,
                tier.refreshCreditsPerPeriod > 0 &&
                  `${tier.refreshCreditsPerPeriod} Refresh credit${tier.refreshCreditsPerPeriod === 1 ? '' : 's'}/mo`,
                tier.storyCreditsPerPeriod > 0 &&
                  `${tier.storyCreditsPerPeriod} Story credit${tier.storyCreditsPerPeriod === 1 ? '' : 's'}/mo`,
                tier.listingDurationDays != null ? `Listings live for ${tier.listingDurationDays} days` : 'Listings never expire',
              ].filter((f): f is string => !!f);

              return (
                <Card key={tier.id} style={[styles.card, styles.tierCard, isCurrent && styles.tierCardCurrent]}>
                  <CardContent style={styles.cardContent}>
                    <View style={styles.tierHeader}>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      {isCurrent && <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />}
                    </View>
                    <Text style={styles.tierPrice}>
                      {formatPrice(tier.price)}
                      <Text style={styles.tierPriceSuffix}> /mo</Text>
                    </Text>
                    <View style={styles.featureList}>
                      {features.map((feature) => (
                        <Text key={feature} style={styles.tierQuota}>
                          • {feature}
                        </Text>
                      ))}
                    </View>
                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      disabled={isCurrent || selectTier.isPending || checkoutTier.isPending}
                      onPress={() => {
                        if (isPaid) {
                          checkoutTier.mutate(
                            { tierId: tier.id, returnUrl: ExpoLinking.createURL('plan') },
                            {
                              onSuccess: (result) => {
                                if (result.url) openCheckoutAndRefresh(result.url);
                                else showToast('Checkout is not available for this plan yet — contact support.', 'error');
                              },
                              onError: () => showToast('Could not start checkout — please try again.', 'error'),
                            },
                          );
                        } else {
                          selectTier.mutate(
                            { tierId: tier.id },
                            {
                              onSuccess: () => showToast(`Switched to ${tier.name}.`),
                              onError: () => showToast('Something went wrong — please try again.', 'error'),
                            },
                          );
                        }
                      }}
                      style={styles.selectButton}
                      label={
                        isCurrent
                          ? 'Current Plan'
                          : selectTier.isPending || checkoutTier.isPending
                            ? 'Please wait…'
                            : isPaid
                              ? 'Upgrade with Stripe'
                              : 'Select Plan'
                      }
                    />
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
        {selectTier.isError && <Text style={styles.error}>Something went wrong — please try again.</Text>}

        {!isCreditPacksLoading && creditPacks.length > 0 && (
          <View onLayout={(e: LayoutChangeEvent) => { buyMoreY.current = e.nativeEvent.layout.y; }}>
            <Text style={styles.sectionTitle}>Buy more credits</Text>
            <View style={styles.shopList}>
              {creditPacks.map((pack) => {
                const meta = SHOP_ITEM_META[pack.creditType] ?? DEFAULT_SHOP_ITEM_META;
                const quantity = cart[pack.id] ?? 0;
                return (
                  <Card key={pack.id} style={styles.card}>
                    <CardContent style={styles.shopItemContent}>
                      <View style={styles.shopItemRow}>
                        <View style={[styles.shopIconChip, { backgroundColor: `${meta.tint}1A` }]}>
                          <Ionicons name={meta.icon} size={22} color={meta.tint} />
                        </View>
                        <View style={styles.shopItemInfo}>
                          <Text style={styles.tierName}>{pack.name}</Text>
                          <Text style={styles.muted}>{meta.subtitle}</Text>
                          <Text style={styles.shopItemQuantity}>
                            {pack.quantity} × {CREDIT_TYPE_LABEL[pack.creditType] ?? pack.creditType} credit
                            {pack.quantity === 1 ? '' : 's'}
                          </Text>
                        </View>
                        <Text style={styles.shopItemPrice}>{formatPrice(pack.price)}</Text>
                      </View>
                      <View style={styles.shopItemFooter}>
                        {quantity === 0 ? (
                          <Pressable style={styles.addToCartButton} onPress={() => setCartQuantity(pack.id, 1)}>
                            <Text style={styles.addToCartText}>Add to Cart</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.stepper}>
                            <Pressable
                              style={styles.stepperButton}
                              onPress={() => setCartQuantity(pack.id, quantity - 1)}
                            >
                              <Ionicons name="remove" size={16} color={theme.colors.primary} />
                            </Pressable>
                            <Text style={styles.stepperValue}>{quantity}</Text>
                            <Pressable
                              style={styles.stepperButton}
                              onPress={() => setCartQuantity(pack.id, quantity + 1)}
                            >
                              <Ionicons name="add" size={16} color={theme.colors.primary} />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Restyled as a solid brand-gradient pill — reads as the reference
          screenshot's "Buy Quota & Credits" bottom CTA, but only appears
          once there's actually something in the cart to check out, instead
          of a second always-visible button that does nothing until tapped
          twice. */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarCount}>
              {cartCount} item{cartCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.cartBarTotal}>{formatPrice(cartTotal)}</Text>
          </View>
          <Pressable disabled={checkoutCreditCart.isPending} onPress={handleProceedToPayment}>
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={theme.gradients.primary.start}
              end={theme.gradients.primary.end}
              style={styles.cartBarButton}
            >
              <Text style={styles.cartBarButtonText}>
                {checkoutCreditCart.isPending ? 'Please wait…' : 'Proceed to Payment'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  card: { marginBottom: 0 },
  cardContent: { gap: theme.spacing.sm },
  currentHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  currentHeaderText: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  currentName: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  currentDetail: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  muted: { fontSize: 13, color: theme.colors.muted },
  billingRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  billingLink: { fontSize: 12, fontWeight: '600', color: theme.colors.primary, textDecorationLine: 'underline' },
  billingLinkMuted: { fontSize: 12, fontWeight: '600', color: theme.colors.muted, textDecorationLine: 'underline' },
  quotaGrid: { gap: theme.spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  learnMore: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  tierGrid: { gap: theme.spacing.md },
  tierCard: { borderWidth: 1, borderColor: theme.colors.border },
  tierCardCurrent: { borderColor: theme.colors.primary },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  tierPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  tierPriceSuffix: { fontSize: 13, fontWeight: '400', color: theme.colors.muted },
  featureList: { gap: 2 },
  tierQuota: { fontSize: 13, color: theme.colors.muted },
  selectButton: { marginTop: theme.spacing.sm },
  error: { fontSize: 13, color: theme.colors.danger },

  // Zameen-style shop cards.
  shopList: { gap: theme.spacing.md },
  shopItemContent: { gap: theme.spacing.sm },
  shopItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  shopIconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopItemInfo: { flex: 1, gap: 2 },
  shopItemQuantity: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  shopItemPrice: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  shopItemFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  addToCartButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  addToCartText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  stepperValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text, minWidth: 18, textAlign: 'center' },

  // Sticky "Proceed to Payment" bar — only rendered while the cart is
  // non-empty; sits below the ScrollView as a flex sibling within the
  // (bottom-safe-area-aware) SafeAreaView, not absolutely positioned.
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cartBarCount: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  cartBarTotal: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginTop: 2 },
  cartBarButton: {
    borderRadius: 999,
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.bg },
});
