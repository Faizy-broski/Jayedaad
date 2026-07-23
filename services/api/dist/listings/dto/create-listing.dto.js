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
exports.CreateListingDto = exports.CreateListingAmenityDto = exports.CreateListingContactNumberDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished'];
const CONTACT_NUMBER_TYPES = ['mobile', 'landline'];
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
// value is only meaningful for amenities with a value_unit set on the
// catalog (e.g. "Parking Spaces: 2") — confirmed real on a scraped Zameen
// detail page, which shows some amenities with a number, not just presence.
class CreateListingAmenityDto {
    slug;
    value;
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
    contactNumbers;
    // Only amenities linked to this listing's property-type category (via
    // amenity_property_type_categories) are accepted — validated server-side
    // in listings.repository.ts::create(), a hard gate against submitting
    // e.g. Drawing Room on a Plot.
    amenities;
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
