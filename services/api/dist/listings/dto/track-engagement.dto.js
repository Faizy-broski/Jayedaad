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
exports.TrackEngagementDto = void 0;
const class_validator_1 = require("class-validator");
const ENGAGEMENT_TYPES = ['view', 'click', 'call', 'whatsapp', 'sms', 'email'];
const PLATFORMS = ['web', 'mobile', 'agent_portal', 'admin'];
// Confirmed real on the Profolio agent dashboard's Analytics card: Views,
// Clicks, Calls, WhatsApp, SMS, Emails are all distinct tracked events
// (Leads is separate, backed by the `leads` table). Public — any visitor
// triggers these, not just authenticated users.
class TrackEngagementDto {
    type;
    platform;
    viewerSessionId;
}
exports.TrackEngagementDto = TrackEngagementDto;
__decorate([
    (0, class_validator_1.IsIn)(ENGAGEMENT_TYPES),
    __metadata("design:type", Object)
], TrackEngagementDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsIn)(PLATFORMS),
    __metadata("design:type", Object)
], TrackEngagementDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEngagementDto.prototype, "viewerSessionId", void 0);
