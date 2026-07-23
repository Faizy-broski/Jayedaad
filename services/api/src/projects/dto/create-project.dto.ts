import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const PROJECT_STATUSES = ['planned', 'under_construction', 'ready'] as const;
const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'] as const;

// Verified against a real Zameen "New Projects" page: price and area are
// both shown as ranges per unit type, with bedrooms/bathrooms listed too —
// not the single-value shape this DTO originally had.
export class CreateProjectUnitTypeDto {
  @IsString()
  label!: string;

  // Links this unit type into the same Super-Admin-managed taxonomy already
  // built for regular listings (property_types) — resolved to
  // property_type_id server-side, the same way create-listing.dto.ts
  // resolves its property type. Backs "Browse Projects by Category".
  @IsString()
  propertyTypeSlug!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaValueMin?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaValueMax?: number;

  @IsIn(AREA_UNITS)
  areaUnit!: (typeof AREA_UNITS)[number];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  priceMax?: number;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  bathrooms?: number;
}

// Structured installment plan — confirmed a real, prominent feature of
// Zameen new-development pages, not present on regular resale listings.
export class CreateProjectPaymentPlanDto {
  @IsString()
  label!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bookingPercent?: number;

  @IsOptional()
  @IsInt()
  installmentCount?: number;

  @IsOptional()
  @IsString()
  installmentFrequency?: string;

  @IsOptional()
  @IsInt()
  balloonPaymentCount?: number;

  @IsOptional()
  @IsString()
  planDocumentUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  // developers is now a first-class entity (confirmed real on the Zameen
  // New Projects page's "Select Developers" dropdown + "Featured
  // Developers" section) — this references developers.id, not a free-text name.
  @IsUUID()
  developerId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  city!: string;

  @IsString()
  area!: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: (typeof PROJECT_STATUSES)[number];

  @IsOptional()
  @IsString()
  possessionDate?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectUnitTypeDto)
  unitTypes?: CreateProjectUnitTypeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectPaymentPlanDto)
  paymentPlans?: CreateProjectPaymentPlanDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenitySlugs?: string[];
}
