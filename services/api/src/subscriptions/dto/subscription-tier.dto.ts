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
}
