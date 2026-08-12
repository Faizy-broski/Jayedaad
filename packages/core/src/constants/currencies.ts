import { AreaUnit } from '../models';

// The site's sitewide display-currency picker (Header's PreferencesMenu on
// web, ProfileSettingsScreen on mobile) — preferredCurrency itself has
// always been stored/read correctly (user_preferences table,
// formatPrice() already renders whatever code is here), but until now the
// only picker UI anywhere hardcoded a single "PKR" option. These 6 are the
// full supported list; services/api's UpdatePreferencesDto validates
// against the same codes.
export interface CurrencyOption {
  code: string;
  label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'PKR', label: 'Pakistan (PKR)' },
  { code: 'CAD', label: 'Canadian dollar (CAD)' },
  { code: 'SAR', label: 'Saudi Arabia (SAR)' },
  { code: 'AED', label: 'United Arab Emirates (AED)' },
  { code: 'GBP', label: 'United Kingdom (GBP)' },
  { code: 'USD', label: 'United States of America (USD)' },
];

// Same 6 values AreaUnit has always supported — this just gives them real
// labels instead of the raw enum string previously shown verbatim
// (mobile's Alert.alert picker, and the one other place area unit had a UI
// at all — agent-settings/page.tsx's <Select>, which rendered the raw
// value as its own option text).
export interface AreaUnitOption {
  value: AreaUnit;
  label: string;
}

export const AREA_UNIT_OPTIONS: AreaUnitOption[] = [
  { value: 'sqft', label: 'Square Feet' },
  { value: 'sqyd', label: 'Square Yards' },
  { value: 'sqm', label: 'Square Meters' },
  { value: 'marla', label: 'Marla' },
  { value: 'kanal', label: 'Kanal' },
  { value: 'acre', label: 'Acre' },
];
