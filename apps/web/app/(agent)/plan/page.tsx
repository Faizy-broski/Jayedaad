'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AgentCreditType, useAgentCreditsViewModel, useFormattedPrice, useSubscriptionViewModel } from '@jayedaad/core';
import { Button, Card, CreditCardAccent, CreditQuotaCard } from '@jayedaad/ui-web';
import { Check, Clapperboard, CreditCard, Flame, Home, RefreshCw, Sparkles, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

// Drives the new "My Quota & Credits" card grid — same 4 purchasable types
// the "Buy more credits" section below lists, plus listing_quota (not
// purchasable, so it's the only entry without a matching credit_packs row).
const QUOTA_CARD_META: { type: AgentCreditType; label: string; accent: CreditCardAccent; icon: LucideIcon }[] = [
  { type: 'listing_quota', label: 'Listing Quota', accent: 'green', icon: Home },
  { type: 'hot', label: 'Hot', accent: 'orange', icon: Flame },
  { type: 'super_hot', label: 'Super Hot', accent: 'red', icon: Flame },
  { type: 'refresh', label: 'Refresh', accent: 'blue', icon: RefreshCw },
  { type: 'story', label: 'Story', accent: 'purple', icon: Clapperboard },
];

// Replaces the "Prop Shop" nav item. Free tiers (price 0) still change
// instantly with no payment (services/api's subscriptions.repository.ts's
// assign() upsert) — paid tiers now go through a real Stripe Checkout
// session (services/api's subscriptions.controller.ts's checkout route).
export default function PlanPage() {
  const {
    current,
    isCurrentLoading,
    tiers,
    isTiersLoading,
    isTiersError,
    usage,
    creditPacks,
    isCreditPacksLoading,
    selectTier,
    checkoutTier,
    cancelSubscription,
    openBillingPortal,
    checkoutCreditPack,
  } = useSubscriptionViewModel();
  const { format: formatPrice } = useFormattedPrice();
  // Previously this page only showed listing quota — an agent had to go to
  // Dashboard to see their actual Hot/Super Hot/Refresh/Story balances,
  // the same numbers the "Buy more credits" section right below this is
  // meant to help them top up.
  const { credits } = useAgentCreditsViewModel();

  // Standalone top-up — a real Stripe Checkout Session (mode: 'payment'),
  // same "server is the source of truth, this just navigates to the
  // returned URL" pattern as the tier checkout below. agent_credits itself
  // only changes once the webhook confirms payment.
  function handleBuyCreditPack(packId: string) {
    checkoutCreditPack.mutate({ packId }, {
      onSuccess: (result) => {
        if (result.url) window.location.href = result.url;
        else toast.error('Checkout is not available for this pack yet — contact support.');
      },
      onError: () => toast.error('Could not start checkout — please try again.'),
    });
  }

  const CREDIT_TYPE_LABEL: Record<string, string> = { hot: 'Hot', super_hot: 'Super Hot', refresh: 'Refresh', story: 'Story' };

  // Jumps to that credit type's pack card in "Buy more credits" — the pack
  // list is already on this same page, so scrolling there beats navigating
  // away and back.
  function handleBuyMore(type: AgentCreditType) {
    document.getElementById(`buy-credits-${type}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleCancel() {
    if (!confirm('Cancel your subscription? You’ll keep access until the end of the current billing period.')) return;
    cancelSubscription.mutate(undefined, {
      onSuccess: () => toast.success('Subscription will cancel at the end of the current period.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  function handleManageBilling() {
    openBillingPortal.mutate(undefined, {
      onSuccess: (result) => {
        window.location.href = result.url;
      },
      onError: () => toast.error('No billing account yet — subscribe to a paid plan first.'),
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free plans switch instantly. Paid plans go through a secure Stripe checkout.
          </p>
        </div>
      </Reveal>

      <Reveal>
        {isCurrentLoading ? (
          <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
        ) : (
          <div className="bg-heading-gradient overflow-hidden rounded-xl p-6 text-primary-foreground sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
                  <CreditCard className="h-3.5 w-3.5" />
                  Current Plan
                </p>
                {current ? (
                  <>
                    <p className="mt-2 text-2xl font-bold sm:text-3xl">{current.tier.name}</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">
                      {formatPrice(current.tier.price)} /mo · {current.tier.listingQuota}{' '}
                      listing quota
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-lg font-medium">No plan selected yet — choose one below.</p>
                )}
              </div>
              {current && (
                <div className="text-right text-xs text-primary-foreground/70">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-medium capitalize text-primary-foreground">
                    {current.status}
                  </span>
                  {current.currentPeriodEnd && (
                    <p className="mt-1.5">
                      {current.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}{' '}
                      {new Date(current.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {current.tier.price > 0 && (
                    <div className="mt-2 flex flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleManageBilling}
                        disabled={openBillingPortal.isPending}
                        className="text-primary-foreground underline underline-offset-2 hover:opacity-80"
                      >
                        Manage billing
                      </button>
                      {!current.cancelAtPeriodEnd && (
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={cancelSubscription.isPending}
                          className="text-primary-foreground/70 underline underline-offset-2 hover:opacity-80"
                        >
                          Cancel subscription
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </Reveal>

      {/* One card per credit type — replaces the old progress bar + uniform
          tile grid that buried these numbers inside the hero band with no
          per-type identity and no obvious next step when a balance hit
          zero. Sits on the page's light background (not inside the dark
          gradient hero) so the colored badges and amber empty-state banner
          read correctly. */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">My Quota &amp; Credits</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUOTA_CARD_META.map((meta, index) => {
            const isQuota = meta.type === 'listing_quota';
            const available = isQuota
              ? Math.max(0, (usage?.quota ?? 0) - (usage?.used ?? 0))
              : (credits.find((c) => c.creditType === meta.type)?.available ?? 0);
            const used = isQuota ? (usage?.used ?? 0) : (credits.find((c) => c.creditType === meta.type)?.used ?? 0);
            return (
              <motion.div
                key={meta.type}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <CreditQuotaCard
                  label={meta.label}
                  accent={meta.accent}
                  icon={meta.icon}
                  available={available}
                  used={used}
                  onBuyMore={isQuota ? undefined : () => handleBuyMore(meta.type)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <Reveal>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Available Plans</h2>
            <Link href="/help" className="text-sm font-medium text-primary hover:underline">
              Learn More
            </Link>
          </div>
        </Reveal>

        {isTiersLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        )}

        {isTiersError && (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-destructive/40 py-16 text-center">
            <Sparkles className="mb-3 h-10 w-10 text-destructive/50" />
            <h3 className="text-sm font-semibold text-foreground">Couldn&apos;t load plans</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">Please try again in a moment.</p>
          </div>
        )}

        {!isTiersLoading && !isTiersError && tiers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center"
          >
            <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No plans configured yet</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              A Super Admin needs to create subscription tiers before agents can select one.
            </p>
          </motion.div>
        )}

        {!isTiersLoading && tiers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier, index) => {
              const isCurrent = current?.tierId === tier.id;
              const features = [
                `${tier.listingQuota.toLocaleString()} listing quota`,
                // Previously absent from this comparison entirely — an
                // agent had no way to see how many projects a tier
                // includes despite it being a real, separately-priced,
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
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    className={`relative flex h-full flex-col gap-4 p-6 shadow-sm transition-shadow hover:shadow-lg ${
                      isCurrent ? 'border-2 border-primary' : ''
                    }`}
                  >
                    {isCurrent && (
                      <span className="bg-heading-gradient absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow">
                        Current Plan
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-foreground">{tier.name}</p>
                      {isCurrent && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-3xl font-bold text-foreground">
                      {formatPrice(tier.price)}
                      <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                    </p>

                    <ul className="flex-1 space-y-2">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      disabled={isCurrent || selectTier.isPending || checkoutTier.isPending}
                      onClick={() => {
                        if (Number(tier.price) > 0) {
                          checkoutTier.mutate({ tierId: tier.id }, {
                            onSuccess: (result) => {
                              if (result.url) window.location.href = result.url;
                              else toast.error('Checkout is not available for this plan yet — contact support.');
                            },
                            onError: () => toast.error('Could not start checkout — please try again.'),
                          });
                        } else {
                          selectTier.mutate(
                            { tierId: tier.id },
                            {
                              onSuccess: () => toast.success(`Switched to ${tier.name}.`),
                              onError: () => toast.error('Something went wrong — please try again.'),
                            },
                          );
                        }
                      }}
                    >
                      {isCurrent
                        ? 'Current Plan'
                        : selectTier.isPending || checkoutTier.isPending
                          ? 'Please wait…'
                          : Number(tier.price) > 0
                            ? 'Upgrade with Stripe'
                            : 'Select Plan'}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
        {selectTier.isError && <p className="mt-2 text-sm text-destructive">Something went wrong — please try again.</p>}
      </div>

      {!isCreditPacksLoading && creditPacks.length > 0 && (
        <Reveal>
          <div id="buy-credits">
            <h2 className="text-lg font-semibold text-foreground">Buy more credits</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run out mid-period? Top up Hot, Super Hot, or Refresh credits without waiting for renewal.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creditPacks.map((pack) => (
                <Card key={pack.id} id={`buy-credits-${pack.creditType}`} className="flex flex-col gap-3 p-5">
                  <p className="text-sm font-semibold text-foreground">{pack.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.quantity} × {CREDIT_TYPE_LABEL[pack.creditType] ?? pack.creditType} credit
                    {pack.quantity === 1 ? '' : 's'}
                  </p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(pack.price)}</p>
                  <Button
                    variant="outline"
                    disabled={checkoutCreditPack.isPending}
                    onClick={() => handleBuyCreditPack(pack.id)}
                  >
                    {checkoutCreditPack.isPending ? 'Please wait…' : 'Buy with Stripe'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
