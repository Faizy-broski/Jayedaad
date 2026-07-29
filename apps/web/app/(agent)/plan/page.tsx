'use client';

import toast from 'react-hot-toast';
import { formatPrice, usePreferencesViewModel, useSubscriptionViewModel } from '@jayedaad/core';
import { Button, Card, CardContent } from '@jayedaad/ui-web';
import { Check, CreditCard } from 'lucide-react';

// Replaces the "Prop Shop" nav item — this app has no payment/billing
// integration anywhere, so "Upgrade" here is a real, immediate tier change
// (services/api's subscriptions.repository.ts::assign upsert), not a
// checkout flow. Flagged in the UI below, not silently presented as billing.
export default function PlanPage() {
  const { current, isCurrentLoading, tiers, isTiersLoading, usage, selectTier } = useSubscriptionViewModel();
  const { preferences } = usePreferencesViewModel();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No payment processing is wired up in this app — selecting a plan below changes it immediately, it isn&apos;t
          a real purchase.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Current Plan
          </div>
          {isCurrentLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
          ) : current ? (
            <div className="mt-2">
              <p className="text-xl font-semibold">{current.tier.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(current.tier.price, preferences?.preferredCurrency)} · {current.tier.listingQuota} listings ·
                status: {current.status}
                {current.currentPeriodEnd && ` · renews ${new Date(current.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No plan selected yet — choose one below.</p>
          )}

          {usage && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Listings used</span>
                <span>
                  {usage.used} / {usage.quota}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${usage.quota > 0 ? Math.min(100, (usage.used / usage.quota) * 100) : 0}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Available Plans</h2>
        {isTiersLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tiers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No plans have been configured yet — a Super Admin needs to create subscription tiers before agents can
              select one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => {
              const isCurrent = current?.tierId === tier.id;
              return (
                <Card key={tier.id} className={isCurrent ? 'border-primary' : undefined}>
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{tier.name}</p>
                      {isCurrent && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-2xl font-bold">
                      {formatPrice(tier.price, preferences?.preferredCurrency)}
                      <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{tier.listingQuota} listing quota</p>
                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      disabled={isCurrent || selectTier.isPending}
                      onClick={() =>
                        selectTier.mutate(
                          { tierId: tier.id },
                          {
                            onSuccess: () => toast.success(`Switched to ${tier.name}.`),
                            onError: () => toast.error('Something went wrong — please try again.'),
                          },
                        )
                      }
                    >
                      {isCurrent ? 'Current Plan' : selectTier.isPending ? 'Switching…' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {selectTier.isError && <p className="mt-2 text-sm text-destructive">Something went wrong — please try again.</p>}
      </div>
    </div>
  );
}
