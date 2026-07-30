import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateListingAmenityDto, CreateListingContactNumberDto, CreateListingMediaDto } from './create-listing.dto';

const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'] as const;
const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished'] as const;

// Same fields/validators as CreateListingDto, all optional — an agent
// editing their own listing sends only what changed. status is still never
// client-settable here; listings.repository.ts::update() decides it (resets
// to pending_verification if the listing had already been verified/rejected,
// same real-moderation-platform rule as everywhere else in this codebase).
export class UpdateListingDto {
  @IsOptional()
  @IsUUID()
  propertyTypeId?: string;

  @IsOptional()
  @IsIn(['sale', 'rent'])
  purpose?: 'sale' | 'rent';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  area?: string;

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

  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaValue?: number;

  @IsOptional()
  @IsIn(AREA_UNITS)
  areaUnit?: (typeof AREA_UNITS)[number];

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListingAmenityDto)
  amenities?: CreateListingAmenityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListingMediaDto)
  media?: CreateListingMediaDto[];
}
