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
exports.CreateProjectDto = exports.CreateProjectPaymentPlanDto = exports.CreateProjectUnitTypeDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const PROJECT_STATUSES = ['planned', 'under_construction', 'ready'];
const AREA_UNITS = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
// Verified against a real Zameen "New Projects" page: price and area are
// both shown as ranges per unit type, with bedrooms/bathrooms listed too —
// not the single-value shape this DTO originally had.
class CreateProjectUnitTypeDto {
    label;
    // Links this unit type into the same Super-Admin-managed taxonomy already
    // built for regular listings (property_types) — resolved to
    // property_type_id server-side, the same way create-listing.dto.ts
    // resolves its property type. Backs "Browse Projects by Category".
    propertyTypeSlug;
    areaValueMin;
    areaValueMax;
    areaUnit;
    priceMin;
    priceMax;
    bedrooms;
    bathrooms;
}
exports.CreateProjectUnitTypeDto = CreateProjectUnitTypeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectUnitTypeDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectUnitTypeDto.prototype, "propertyTypeSlug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateProjectUnitTypeDto.prototype, "areaValueMin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateProjectUnitTypeDto.prototype, "areaValueMax", void 0);
__decorate([
    (0, class_validator_1.IsIn)(AREA_UNITS),
    __metadata("design:type", Object)
], CreateProjectUnitTypeDto.prototype, "areaUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateProjectUnitTypeDto.prototype, "priceMin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateProjectUnitTypeDto.prototype, "priceMax", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateProjectUnitTypeDto.prototype, "bedrooms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateProjectUnitTypeDto.prototype, "bathrooms", void 0);
// Structured installment plan — confirmed a real, prominent feature of
// Zameen new-development pages, not present on regular resale listings.
class CreateProjectPaymentPlanDto {
    label;
    bookingPercent;
    installmentCount;
    installmentFrequency;
    balloonPaymentCount;
    planDocumentUrl;
    description;
}
exports.CreateProjectPaymentPlanDto = CreateProjectPaymentPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectPaymentPlanDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateProjectPaymentPlanDto.prototype, "bookingPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateProjectPaymentPlanDto.prototype, "installmentCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectPaymentPlanDto.prototype, "installmentFrequency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateProjectPaymentPlanDto.prototype, "balloonPaymentCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectPaymentPlanDto.prototype, "planDocumentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectPaymentPlanDto.prototype, "description", void 0);
class CreateProjectDto {
    name;
    slug;
    // developers is now a first-class entity (confirmed real on the Zameen
    // New Projects page's "Select Developers" dropdown + "Featured
    // Developers" section) — this references developers.id, not a free-text name.
    developerId;
    description;
    city;
    area;
    status;
    possessionDate;
    coverImageUrl;
    unitTypes;
    paymentPlans;
    amenitySlugs;
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "developerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "area", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(PROJECT_STATUSES),
    __metadata("design:type", Object)
], CreateProjectDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "possessionDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "coverImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateProjectUnitTypeDto),
    __metadata("design:type", Array)
], CreateProjectDto.prototype, "unitTypes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateProjectPaymentPlanDto),
    __metadata("design:type", Array)
], CreateProjectDto.prototype, "paymentPlans", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateProjectDto.prototype, "amenitySlugs", void 0);
