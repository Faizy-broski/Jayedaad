import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

// A standalone (à la carte) credit purchase — 'listing_quota' deliberately
// excluded from the allowed credit_type values: a top-up buys more of a
// spendable action (Hot/Super Hot/Refresh/Story), not more listing slots,
// which is what upgrading a subscription_tier is for.
const PURCHASABLE_CREDIT_TYPES = ['hot', 'super_hot', 'refresh', 'story'] as const;

export class CreateCreditPackDto {
  @IsString()
  name!: string;

  @IsIn(PURCHASABLE_CREDIT_TYPES)
  creditType!: (typeof PURCHASABLE_CREDIT_TYPES)[number];

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  // Set once a matching one-time Stripe Price exists — required before this
  // pack can be checked out (same convention as SubscriptionTier.stripePriceId).
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCreditPackDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(PURCHASABLE_CREDIT_TYPES)
  creditType?: (typeof PURCHASABLE_CREDIT_TYPES)[number];

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
