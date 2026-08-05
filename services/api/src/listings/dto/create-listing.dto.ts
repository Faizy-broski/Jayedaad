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
  IsUrl,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { LISTING_MEDIA_CATEGORY_SLUG_PATTERN } from '../listing-media-categories';

const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'] as const;
const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished'] as const;
const CONTACT_NUMBER_TYPES = ['mobile', 'landline'] as const;
const LISTING_MEDIA_TYPES = ['image', 'video'] as const;

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

// value is only meaningful for 'number'-valueType amenities on the catalog
// (e.g. "Parking Spaces: 2", "Distance From Airport: 5 kms") — confirmed
// real on a scraped Zameen detail page. textValue is for 'text' amenities
// (free text, e.g. "View: Mountain View") and 'select' amenities (the
// chosen option, e.g. "Flooring: Tiles").
export class CreateListingAmenityDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  textValue?: string;
}

// url comes from a prior POST /listings/media/upload call (see
// listing-media.controller.ts) — this DTO just attaches an already-uploaded
// file to the listing being created, it never accepts raw file data itself.
export class CreateListingMediaDto {
  @IsUrl()
  url!: string;

  @IsIn(LISTING_MEDIA_TYPES)
  type!: (typeof LISTING_MEDIA_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  // Airbnb-style room category (Document Verification Phase 4) — omitted
  // for videos and optional-category photos.
  @IsOptional()
  @Matches(LISTING_MEDIA_CATEGORY_SLUG_PATTERN)
  category?: string;
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

  // Structured installment details — only meaningful when installmentAvailable
  // is true, but validated independently since the client can send them in
  // any combination (each fee/payment field is independently toggleable on
  // the form, see apps/web/app/(owner)/submit/page.tsx).
  @IsOptional()
  @IsNumber()
  @IsPositive()
  advanceAmount?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  numberOfInstallments?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  monthlyInstallment?: number;

  @IsOptional()
  @IsBoolean()
  balloonPaymentAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  balloonPaymentAmount?: number;

  @IsOptional()
  @IsBoolean()
  ballotingFeeApplicable?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  ballotingFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  possessionFeeApplicable?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  possessionFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  developmentFeeApplicable?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  developmentFeeAmount?: number;

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

  // Uploaded ahead of time via POST /listings/media/upload (the submit
  // form uploads photos as they're picked, before the listing exists) —
  // attached to the new listing's row at create time.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListingMediaDto)
  media?: CreateListingMediaDto[];
}
