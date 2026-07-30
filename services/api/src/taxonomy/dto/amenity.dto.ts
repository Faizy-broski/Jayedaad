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

const AMENITY_VALUE_TYPES = ['boolean', 'number', 'text', 'select'] as const;

export class CreateAmenityDto {
  @IsString()
  slug!: string;

  @IsString()
  label!: string;

  @IsIn(AMENITY_CATEGORIES)
  category!: (typeof AMENITY_CATEGORIES)[number];

  // Drives how this amenity is rendered on the submit form: 'boolean' (a
  // checkbox), 'number' (a number input, labeled with valueUnit — e.g.
  // "Distance From Airport (kms)"), 'text' (free text, e.g. "View"), or
  // 'select' (a dropdown of `options`, e.g. Flooring -> Tiles/Marble/...).
  // Defaults to 'boolean' in the DB if omitted.
  @IsOptional()
  @IsIn(AMENITY_VALUE_TYPES)
  valueType?: (typeof AMENITY_VALUE_TYPES)[number];

  // Only meaningful when valueType is 'number' (e.g. "spaces", "kms" —
  // confirmed real: "Parking Spaces: 2", "Distance From Airport (kms)").
  @IsOptional()
  @IsString()
  valueUnit?: string;

  // Only meaningful when valueType is 'select' (e.g. Flooring ->
  // ["Tiles","Marble","Wooden","Chip","Cement","Other"]).
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

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
  @IsIn(AMENITY_VALUE_TYPES)
  valueType?: (typeof AMENITY_VALUE_TYPES)[number];

  @IsOptional()
  @IsString()
  valueUnit?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  propertyTypeCategoryIds?: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
