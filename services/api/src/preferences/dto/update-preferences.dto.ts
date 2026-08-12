import { IsBoolean, IsIn, IsOptional } from 'class-validator';

const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'] as const;

// Same 6 codes as packages/core's CURRENCY_OPTIONS (services/api doesn't
// import from packages/core, same reasoning AREA_UNITS above is its own
// local copy rather than a cross-package import).
const CURRENCY_CODES = ['PKR', 'CAD', 'SAR', 'AED', 'GBP', 'USD'] as const;

// Confirmed real on the Profolio "Preferences" page: three notification
// toggles plus two display preferences.
export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  newsletters?: boolean;

  @IsOptional()
  @IsBoolean()
  automatedReports?: boolean;

  @IsOptional()
  @IsIn(CURRENCY_CODES)
  preferredCurrency?: (typeof CURRENCY_CODES)[number];

  @IsOptional()
  @IsIn(AREA_UNITS)
  preferredAreaUnit?: (typeof AREA_UNITS)[number];
}
