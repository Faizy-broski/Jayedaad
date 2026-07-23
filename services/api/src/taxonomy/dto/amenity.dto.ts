import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

// amenity_category stays a fixed Postgres enum (unlike property-type
// categories) — this pass's scope change was specifically about
// property-type categories, not amenity categories.
const AMENITY_CATEGORIES = [
  'main_features',
  'rooms',
  'business_communication',
  'community_features',
  'healthcare_recreation',
  'nearby_locations',
  'other_facilities',
] as const;

export class CreateAmenityDto {
  @IsString()
  slug!: string;

  @IsString()
  label!: string;

  @IsIn(AMENITY_CATEGORIES)
  category!: (typeof AMENITY_CATEGORIES)[number];

  // Set when this amenity carries a number on a listing (e.g. "spaces",
  // "kms" — confirmed real: "Parking Spaces: 2", "Distance From Airport
  // (kms)"). Omit for a plain boolean-tag amenity.
  @IsOptional()
  @IsString()
  valueUnit?: string;

  // Which property-type categories (Homes/Plots/Commercial) this amenity is
  // relevant for — many-to-many, since e.g. Electricity Backup can apply to
  // more than one. Confirmed a real gap: without this, every amenity was
  // offered for every property type regardless of relevance.
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  propertyTypeCategoryIds?: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateAmenityDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsIn(AMENITY_CATEGORIES)
  category?: (typeof AMENITY_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  valueUnit?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  propertyTypeCategoryIds?: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
