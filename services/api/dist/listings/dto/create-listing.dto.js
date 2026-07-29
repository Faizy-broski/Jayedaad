"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateListingDto = exports.CreateListingMediaDto = exports.CreateListingAmenityDto = exports.CreateListingContactNumberDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished'];
const CONTACT_NUMBER_TYPES = ['mobile', 'landline'];
const LISTING_MEDIA_TYPES = ['image', 'video'];
// Confirmed real on the live Profolio "Post Listing" form (screenshot): a
// repeatable "+"-add Mobile field plus a separate Landline field, each with
// its own country code — a listing carries its own contact numbers, not
// just the owner/agent's account phone.
class CreateListingContactNumberDto {
    type;
    countryCode;
    number;
}
exports.CreateListingContactNumberDto = CreateListingContactNumberDto;
__decorate([
    (0, class_validator_1.IsIn)(CONTACT_NUMBER_TYPES),
    __metadata("design:type", Object)
], CreateListingContactNumberDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingContactNumberDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingContactNumberDto.prototype, "number", void 0);
// value is only meaningful for 'number'-valueType amenities on the catalog
// (e.g. "Parking Spaces: 2", "Distance From Airport: 5 kms") — confirmed
// real on a scraped Zameen detail page. textValue is for 'text' amenities
// (free text, e.g. "View: Mountain View") and 'select' amenities (the
// chosen option, e.g. "Flooring: Tiles").
class CreateListingAmenityDto {
    slug;
    value;
    textValue;
}
exports.CreateListingAmenityDto = CreateListingAmenityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingAmenityDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateListingAmenityDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingAmenityDto.prototype, "textValue", void 0);
// url comes from a prior POST /listings/media/upload call (see
// listing-media.controller.ts) — this DTO just attaches an already-uploaded
// file to the listing being created, it never accepts raw file data itself.
class CreateListingMediaDto {
    url;
    type;
    isCover;
    sortOrder;
}
exports.CreateListingMediaDto = CreateListingMediaDto;
__decorate([
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateListingMediaDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsIn)(LISTING_MEDIA_TYPES),
    __metadata("design:type", Object)
], CreateListingMediaDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingMediaDto.prototype, "isCover", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateListingMediaDto.prototype, "sortOrder", void 0);
// First real DTO class in this codebase — establishes the pattern for
// future write endpoints. status is deliberately NOT a field here: every
// submission starts pending_verification, forced server-side in the
// repository/controller, never accepted from the client [Spec §7].
// boostTier is likewise absent — it's a paid promotion (Zameen's Basic/
// Premium/Hot/Super Hot), never self-assignable at submission time.
class CreateListingDto {
    propertyTypeId;
    purpose;
    title;
    description;
    price;
    city;
    area;
    society;
    subArea;
    bedrooms;
    bathrooms;
    kitchens;
    floors;
    areaValue;
    areaUnit;
    yearBuilt;
    floorLevel;
    furnishingStatus;
    installmentAvailable;
    readyForPossession;
    // Structured installment details — only meaningful when installmentAvailable
    // is true, but validated independently since the client can send them in
    // any combination (each fee/payment field is independently toggleable on
    // the form, see apps/web/app/(owner)/submit/page.tsx).
    advanceAmount;
    numberOfInstallments;
    monthlyInstallment;
    balloonPaymentAvailable;
    balloonPaymentAmount;
    ballotingFeeApplicable;
    ballotingFeeAmount;
    possessionFeeApplicable;
    possessionFeeAmount;
    developmentFeeApplicable;
    developmentFeeAmount;
    contactNumbers;
    // Only amenities linked to this listing's property-type category (via
    // amenity_property_type_categories) are accepted — validated server-side
    // in listings.repository.ts::create(), a hard gate against submitting
    // e.g. Drawing Room on a Plot.
    amenities;
    // Uploaded ahead of time via POST /listings/media/upload (the submit
    // form uploads photos as they're picked, before the listing exists) —
    // attached to the new listing's row at create time.
    media;
}
exports.CreateListingDto = CreateListingDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "propertyTypeId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['sale', 'rent']),
    __metadata("design:type", String)
], CreateListingDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "area", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "society", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "subArea", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "bedrooms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "bathrooms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "kitchens", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "floors", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "areaValue", void 0);
__decorate([
    (0, class_validator_1.IsIn)(AREA_UNITS),
    __metadata("design:type", Object)
], CreateListingDto.prototype, "areaUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "yearBuilt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "floorLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(FURNISHING_STATUSES),
    __metadata("design:type", Object)
], CreateListingDto.prototype, "furnishingStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "installmentAvailable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "readyForPossession", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "advanceAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "numberOfInstallments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "monthlyInstallment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "balloonPaymentAvailable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "balloonPaymentAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "ballotingFeeApplicable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "ballotingFeeAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "possessionFeeApplicable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "possessionFeeAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "developmentFeeApplicable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "developmentFeeAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateListingContactNumberDto),
    __metadata("design:type", Array)
], CreateListingDto.prototype, "contactNumbers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateListingAmenityDto),
    __metadata("design:type", Array)
], CreateListingDto.prototype, "amenities", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateListingMediaDto),
    __metadata("design:type", Array)
], CreateListingDto.prototype, "media", void 0);
