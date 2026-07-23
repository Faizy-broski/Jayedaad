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
exports.UpdateSubscriptionTierDto = exports.CreateSubscriptionTierDto = void 0;
const class_validator_1 = require("class-validator");
// subscription_tiers.name is plain text, not a fixed enum — Super Admin
// creates plans with whatever name they choose (real Zameen tier names
// — Starter/Business/Titanium/Titanium Plus — never matched the earlier
// placeholder Lite/Go/Pro/Ultimate, confirming a fixed enum was wrong here).
class CreateSubscriptionTierDto {
    name;
    listingQuota;
    price;
    // Depth/entitlement flags per tier (e.g. { analyticsDepth: 'full',
    // viewCountDetail: 'full_timeseries' }) — see EntitlementsService, which
    // already reads this shape from subscription_tiers.analytics_depth.
    analyticsDepth;
}
exports.CreateSubscriptionTierDto = CreateSubscriptionTierDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionTierDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateSubscriptionTierDto.prototype, "listingQuota", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionTierDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSubscriptionTierDto.prototype, "analyticsDepth", void 0);
class UpdateSubscriptionTierDto {
    name;
    listingQuota;
    price;
    analyticsDepth;
}
exports.UpdateSubscriptionTierDto = UpdateSubscriptionTierDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionTierDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateSubscriptionTierDto.prototype, "listingQuota", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSubscriptionTierDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSubscriptionTierDto.prototype, "analyticsDepth", void 0);
