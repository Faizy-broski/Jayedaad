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
exports.CreateLeadDto = void 0;
const class_validator_1 = require("class-validator");
const LEAD_SOURCES = ['chatbot', 'contact_form', 'call_request'];
const INQUIRER_TYPES = ['buyer_tenant', 'agent', 'other'];
// Public intake DTO — a buyer submitting a contact-form inquiry has no
// account. listing_id is a hard FK per [Dev Instr §3.1] "Property Enquired
// About": every lead links to a real listing, never a free-text note.
// message/inquirerType/wantsSimilarAlerts verified against a real Zameen.com
// "Contact Agent" form via live scrape, not guessed.
class CreateLeadDto {
    listingId;
    name;
    phone;
    email;
    message;
    source;
    inquirerType;
    wantsSimilarAlerts;
}
exports.CreateLeadDto = CreateLeadDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "listingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsIn)(LEAD_SOURCES),
    __metadata("design:type", Object)
], CreateLeadDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(INQUIRER_TYPES),
    __metadata("design:type", Object)
], CreateLeadDto.prototype, "inquirerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateLeadDto.prototype, "wantsSimilarAlerts", void 0);
