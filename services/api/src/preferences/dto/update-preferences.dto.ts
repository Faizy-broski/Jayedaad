import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'] as const;

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
  @IsString()
  preferredCurrency?: string;

  @IsOptional()
  @IsIn(AREA_UNITS)
  preferredAreaUnit?: (typeof AREA_UNITS)[number];
}
