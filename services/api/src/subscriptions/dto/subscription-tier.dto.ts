import { IsInt, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';

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

  @IsOptional()
  @IsNumber()
  price?: number;

  // Depth/entitlement flags per tier (e.g. { analyticsDepth: 'full',
  // viewCountDetail: 'full_timeseries' }) — see EntitlementsService, which
  // already reads this shape from subscription_tiers.analytics_depth.
  @IsObject()
  analyticsDepth!: Record<string, unknown>;

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

  // Set once a matching Product/Price exists in the Stripe dashboard —
  // required before this tier can be checked out if price > 0 (see
  // SubscriptionsController.checkout()'s existing guard).
  @IsOptional()
  @IsString()
  stripePriceId?: string;
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
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsObject()
  analyticsDepth?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  hotCreditsPerPeriod?: number;

  @IsOptional()
  @IsInt()
  superHotCreditsPerPeriod?: number;

  @IsOptional()
  @IsString()
  stripePriceId?: string;
}
