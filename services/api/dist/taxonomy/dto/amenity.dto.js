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
exports.UpdateAmenityDto = exports.CreateAmenityDto = void 0;
const class_validator_1 = require("class-validator");
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
];
const AMENITY_VALUE_TYPES = ['boolean', 'number', 'text', 'select'];
class CreateAmenityDto {
    slug;
    label;
    category;
    // Drives how this amenity is rendered on the submit form: 'boolean' (a
    // checkbox), 'number' (a number input, labeled with valueUnit — e.g.
    // "Distance From Airport (kms)"), 'text' (free text, e.g. "View"), or
    // 'select' (a dropdown of `options`, e.g. Flooring -> Tiles/Marble/...).
    // Defaults to 'boolean' in the DB if omitted.
    valueType;
    // Only meaningful when valueType is 'number' (e.g. "spaces", "kms" —
    // confirmed real: "Parking Spaces: 2", "Distance From Airport (kms)").
    valueUnit;
    // Only meaningful when valueType is 'select' (e.g. Flooring ->
    // ["Tiles","Marble","Wooden","Chip","Cement","Other"]).
    options;
    // Which property-type categories (Homes/Plots/Commercial) this amenity is
    // relevant for — many-to-many, since e.g. Electricity Backup can apply to
    // more than one. Confirmed a real gap: without this, every amenity was
    // offered for every property type regardless of relevance.
    propertyTypeCategoryIds;
    sortOrder;
}
exports.CreateAmenityDto = CreateAmenityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAmenityDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAmenityDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsIn)(AMENITY_CATEGORIES),
    __metadata("design:type", Object)
], CreateAmenityDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(AMENITY_VALUE_TYPES),
    __metadata("design:type", Object)
], CreateAmenityDto.prototype, "valueType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAmenityDto.prototype, "valueUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAmenityDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], CreateAmenityDto.prototype, "propertyTypeCategoryIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAmenityDto.prototype, "sortOrder", void 0);
class UpdateAmenityDto {
    slug;
    label;
    category;
    valueType;
    valueUnit;
    options;
    propertyTypeCategoryIds;
    sortOrder;
}
exports.UpdateAmenityDto = UpdateAmenityDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAmenityDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAmenityDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(AMENITY_CATEGORIES),
    __metadata("design:type", Object)
], UpdateAmenityDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(AMENITY_VALUE_TYPES),
    __metadata("design:type", Object)
], UpdateAmenityDto.prototype, "valueType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAmenityDto.prototype, "valueUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateAmenityDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], UpdateAmenityDto.prototype, "propertyTypeCategoryIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAmenityDto.prototype, "sortOrder", void 0);
