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
exports.UploadListingDocumentDto = void 0;
const class_validator_1 = require("class-validator");
const LISTING_DOCUMENT_TYPES = ['id_card_front', 'id_card_back', 'ownership_proof', 'utility_bill'];
// Real property-verification requirement: ID card front/back, ownership
// proof document, last utility bill.
class UploadListingDocumentDto {
    documentType;
}
exports.UploadListingDocumentDto = UploadListingDocumentDto;
__decorate([
    (0, class_validator_1.IsIn)(LISTING_DOCUMENT_TYPES),
    __metadata("design:type", Object)
], UploadListingDocumentDto.prototype, "documentType", void 0);
