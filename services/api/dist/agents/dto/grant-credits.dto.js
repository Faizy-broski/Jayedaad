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
exports.GrantCreditsDto = void 0;
const class_validator_1 = require("class-validator");
const CREDIT_TYPES = ['listing_quota', 'refresh', 'hot', 'super_hot'];
// Super Admin grants/adjusts a credit pool — the write-side counterpart to
// the read-only GET /agents/:id/credits built in the Analytics pass, and
// the actual mechanism that would let boost_tier ever change (an agent
// spends a Hot/Super Hot credit — the spend action itself is still a
// separate, later piece; this just lets Super Admin set balances).
class GrantCreditsDto {
    creditType;
    total;
    used;
}
exports.GrantCreditsDto = GrantCreditsDto;
__decorate([
    (0, class_validator_1.IsIn)(CREDIT_TYPES),
    __metadata("design:type", Object)
], GrantCreditsDto.prototype, "creditType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GrantCreditsDto.prototype, "total", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GrantCreditsDto.prototype, "used", void 0);
