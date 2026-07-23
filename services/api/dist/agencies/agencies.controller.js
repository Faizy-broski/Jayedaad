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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgenciesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const agencies_repository_1 = require("./agencies.repository");
const create_agency_dto_1 = require("./dto/create-agency.dto");
const update_agency_dto_1 = require("./dto/update-agency.dto");
const set_verification_status_dto_1 = require("./dto/set-verification-status.dto");
const upload_document_dto_1 = require("./dto/upload-document.dto");
let AgenciesController = class AgenciesController {
    agencies;
    constructor(agencies) {
        this.agencies = agencies;
    }
    list(city) {
        return this.agencies.list({ city });
    }
    findBySlug(slug) {
        return this.agencies.findBySlug(slug);
    }
    // Property inventory by type/purpose — confirmed real on a scraped Zameen
    // agency page, computed at query time (see agencies.repository.ts::getStats).
    async getStats(slug) {
        const agency = await this.agencies.findBySlug(slug);
        return this.agencies.getStats(agency.id);
    }
    // Registration/onboarding is a Super Admin action for now — matches
    // [Spec §7] "Agents are onboarded through a verification process".
    create(body) {
        return this.agencies.create(body);
    }
    // The write-mechanism explicitly deferred at create-time — every agency
    // starts 'pending' and previously had no way to ever move out of it.
    setVerificationStatus(id, body) {
        return this.agencies.setVerificationStatus(id, body.status);
    }
    update(id, body) {
        return this.agencies.update(id, body);
    }
    remove(id) {
        return this.agencies.remove(id);
    }
    // Real onboarding requirement — company registration, owner's ID card, tax
    // certificate. Matches the existing agency-mutation discipline (super_admin-only).
    uploadDocument(id, body, file) {
        return this.agencies.addDocument(id, body.documentType, file);
    }
    listDocuments(id) {
        return this.agencies.listDocuments(id);
    }
};
exports.AgenciesController = AgenciesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "list", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "findBySlug", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slug/stats'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgenciesController.prototype, "getStats", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_agency_dto_1.CreateAgencyDto]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_verification_status_dto_1.SetAgencyVerificationStatusDto]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "setVerificationStatus", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_agency_dto_1.UpdateAgencyDto]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)(':id/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_document_dto_1.UploadOnboardingDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Get)(':id/documents'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "listDocuments", null);
exports.AgenciesController = AgenciesController = __decorate([
    (0, common_1.Controller)('agencies'),
    __metadata("design:paramtypes", [agencies_repository_1.AgenciesRepository])
], AgenciesController);
