import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

const ALERT_FREQUENCIES = ['instant', 'daily', 'weekly', 'off'] as const;

// filters mirrors GET /listings' own filter shape (see
// listings.repository.ts::ListingSearchFilters) — stored as jsonb rather
// than duplicated columns, per [Dev Instr] Zillow-style saved search + alerts.
export class CreateSavedSearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsObject()
  filters!: Record<string, unknown>;

  @IsOptional()
  @IsIn(ALERT_FREQUENCIES)
  alertFrequency?: (typeof ALERT_FREQUENCIES)[number];
}
