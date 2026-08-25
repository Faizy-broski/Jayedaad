import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

// subscription_tiers.name is plain text, not a fixed enum — Super Admin
// creates plans with whatever name they choose (real Zameen tier names
// — Starter/Business/Titanium/Titanium Plus — never matched the earlier
// placeholder Lite/Go/Pro/Ultimate, confirming a fixed enum was wrong here).
export class CreateSubscriptionTierDto {
  @IsString()
  name!: string;

  @IsInt()
  @IsPositive()
  listingQuota!: number;

  // Separate counter from listingQuota — see EntitlementsService's
  // projectQuota comment. 0 is a valid, common value (most tiers don't
  // include project creation), so @IsPositive() would wrongly reject it —
  // @Min(0) instead.
  @IsInt()
  @Min(0)
  projectQuota!: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  // Featured-listing allotment — granted to agent_credits on tier
  // (re-)selection and each successful renewal (see
  // SubscriptionsRepository.grantPeriodCredits/grantRenewalCredits), spent
  // via POST /listings/:id/boost.
  @IsOptional()
  @IsInt()
  hotCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  superHotCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  refreshCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  storyCreditsPerPeriod?: number;

  // Set once a matching Product/Price exists in the Stripe dashboard —
  // required before this tier can be checked out if price > 0 (see
  // SubscriptionsController.checkout()'s existing guard).
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  // Annual counterparts — both optional, and independent of the monthly
  // pair above. Leaving annualPrice unset keeps this tier monthly-only (no
  // Annual toggle option shown for it on the Plan page). annualPrice must
  // match the real amount configured on stripeAnnualPriceId's Stripe Price
  // object, same manual-entry convention as price/stripePriceId — the
  // discount shown to agents is always derived from these two real numbers
  // (packages/core's getAnnualDiscountPercent), never stored separately.
  @IsOptional()
  @IsNumber()
  annualPrice?: number | null;

  @IsOptional()
  @IsString()
  stripeAnnualPriceId?: string;
}

export class UpdateSubscriptionTierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  listingQuota?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  projectQuota?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  hotCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  superHotCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  refreshCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  storyCreditsPerPeriod?: number;

  @IsOptional()
  @IsString()
  stripePriceId?: string;

  // Same annual pair as CreateSubscriptionTierDto above.
  @IsOptional()
  @IsNumber()
  annualPrice?: number | null;

  @IsOptional()
  @IsString()
  stripeAnnualPriceId?: string;
}
