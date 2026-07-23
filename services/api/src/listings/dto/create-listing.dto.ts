import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'] as const;
const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished'] as const;
const CONTACT_NUMBER_TYPES = ['mobile', 'landline'] as const;

// Confirmed real on the live Profolio "Post Listing" form (screenshot): a
// repeatable "+"-add Mobile field plus a separate Landline field, each with
// its own country code — a listing carries its own contact numbers, not
// just the owner/agent's account phone.
export class CreateListingContactNumberDto {
  @IsIn(CONTACT_NUMBER_TYPES)
  type!: (typeof CONTACT_NUMBER_TYPES)[number];

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsString()
  number!: string;
}

// value is only meaningful for amenities with a value_unit set on the
// catalog (e.g. "Parking Spaces: 2") — confirmed real on a scraped Zameen
// detail page, which shows some amenities with a number, not just presence.
export class CreateListingAmenityDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsNumber()
  value?: number;
}

// First real DTO class in this codebase — establishes the pattern for
// future write endpoints. status is deliberately NOT a field here: every
// submission starts pending_verification, forced server-side in the
// repository/controller, never accepted from the client [Spec §7].
// boostTier is likewise absent — it's a paid promotion (Zameen's Basic/
// Premium/Hot/Super Hot), never self-assignable at submission time.
export class CreateListingDto {
  @IsUUID()
  propertyTypeId!: string;

  @IsIn(['sale', 'rent'])
  purpose!: 'sale' | 'rent';

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  city!: string;

  @IsString()
  area!: string;

  @IsOptional()
  @IsString()
  society?: string;

  @IsOptional()
  @IsString()
  subArea?: string;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  kitchens?: number;

  @IsOptional()
  @IsInt()
  floors?: number;

  @IsNumber()
  @IsPositive()
  areaValue!: number;

  @IsIn(AREA_UNITS)
  areaUnit!: (typeof AREA_UNITS)[number];

  @IsOptional()
  @IsInt()
  yearBuilt?: number;

  @IsOptional()
  @IsString()
  floorLevel?: string;

  @IsOptional()
  @IsIn(FURNISHING_STATUSES)
  furnishingStatus?: (typeof FURNISHING_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  installmentAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  readyForPossession?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListingContactNumberDto)
  contactNumbers?: CreateListingContactNumberDto[];

  // Only amenities linked to this listing's property-type category (via
  // amenity_property_type_categories) are accepted — validated server-side
  // in listings.repository.ts::create(), a hard gate against submitting
  // e.g. Drawing Room on a Plot.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListingAmenityDto)
  amenities?: CreateListingAmenityDto[];
}
