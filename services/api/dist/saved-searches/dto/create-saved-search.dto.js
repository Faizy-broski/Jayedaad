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
exports.CreateSavedSearchDto = void 0;
const class_validator_1 = require("class-validator");
const ALERT_FREQUENCIES = ['instant', 'daily', 'weekly', 'off'];
// filters mirrors GET /listings' own filter shape (see
// listings.repository.ts::ListingSearchFilters) — stored as jsonb rather
// than duplicated columns, per [Dev Instr] Zillow-style saved search + alerts.
class CreateSavedSearchDto {
    name;
    filters;
    alertFrequency;
}
exports.CreateSavedSearchDto = CreateSavedSearchDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSavedSearchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSavedSearchDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(ALERT_FREQUENCIES),
    __metadata("design:type", Object)
], CreateSavedSearchDto.prototype, "alertFrequency", void 0);
