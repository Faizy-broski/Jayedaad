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
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const agents_repository_1 = require("./agents.repository");
const create_review_dto_1 = require("./dto/create-review.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const grant_credits_dto_1 = require("./dto/grant-credits.dto");
const upload_document_dto_1 = require("./dto/upload-document.dto");
const set_verification_status_dto_1 = require("./dto/set-verification-status.dto");
const avatar_media_service_1 = require("./avatar-media.service");
let AgentsController = class AgentsController {
    agents;
    avatarMedia;
    constructor(agents, avatarMedia) {
        this.agents = agents;
        this.avatarMedia = avatarMedia;
    }
    findProfile(id) {
        return this.agents.findProfile(id);
    }
    listReviews(id) {
        return this.agents.listReviews(id);
    }
    // Property inventory by type/purpose — mirrors GET /agencies/:slug/stats,
    // confirmed against a real Zameen agency page's exact stat shape.
    // Public — the same summary counts are shown on a public agency/agent page.
    getStats(id) {
        return this.agents.getStats(id);
    }
    // Analytics and credit balances are private business data (confirmed only
    // visible on the agent's OWN logged-in Profolio dashboard, never on a
    // public profile) — ScopeGuard only checks role membership, so ownership
    // is enforced explicitly here: an agent may only see their own.
    getAnalytics(req, id, purpose, since) {
        this.assertOwnAgentOrAdmin(req, id);
        return this.agents.getAnalytics(id, { purpose, since: since ? new Date(since) : undefined });
    }
    getCredits(req, id) {
        this.assertOwnAgentOrAdmin(req, id);
        return this.agents.getCredits(id);
    }
    // Super Admin grant/adjust — deliberately super_admin-only (not agent, who
    // could otherwise grant themselves unlimited credits). The write-side
    // counterpart to GET :id/credits, explicitly deferred pending this module
    // in the Analytics pass.
    grantCredits(id, body) {
        return this.agents.grantCredits(id, body);
    }
    // The Profolio "User Settings" page's save action — same ownership
    // discipline as analytics/credits above.
    updateProfile(req, id, body) {
        this.assertOwnAgentOrAdmin(req, id);
        return this.agents.updateProfile(id, body);
    }
    // Profile picture — own dedicated "avatars" bucket (see
    // avatar-media.service.ts), separate from listing-media. Same ownership
    // discipline as updateProfile above.
    async uploadPhoto(req, id, file) {
        this.assertOwnAgentOrAdmin(req, id);
        const url = await this.avatarMedia.upload(id, file);
        return this.agents.updatePhoto(id, url);
    }
    assertOwnAgentOrAdmin(req, agentId) {
        if (req.user.role === 'super_admin')
            return;
        if (req.user.agentId !== agentId) {
            throw new common_1.ForbiddenException("Cannot access another agent's private data");
        }
    }
    // Any authenticated user can review an agent — no @Roles() restriction,
    // just @UseGuards(ScopeGuard) to require a real logged-in reviewer
    // (reviewer_id comes from the token, never the request body).
    createReview(req, id, body) {
        return this.agents.createReview(req.user.id, id, body);
    }
    // Real onboarding requirement — company registration, owner's ID card, tax
    // certificate (same set as agencies; an independent agent stands in as
    // their own "company"). Only the agent themselves or super_admin may upload.
    uploadDocument(req, id, body, file) {
        this.assertOwnAgentOrAdmin(req, id);
        return this.agents.addDocument(id, body.documentType, file);
    }
    // verification_staff can review an agent's documents ahead of an
    // onboarding decision, same as they review listing documents.
    listDocuments(req, id) {
        if (req.user.role !== 'verification_staff')
            this.assertOwnAgentOrAdmin(req, id);
        return this.agents.listDocuments(id);
    }
    // The write path that never existed until now — agent_profiles.verification_status
    // has had no endpoint to set it since the column was introduced. Symmetric
    // with PATCH /agencies/:id/verify (also super_admin-only).
    setVerificationStatus(id, body) {
        return this.agents.setVerificationStatus(id, body.status);
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "findProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "listReviews", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Get)(':id/analytics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('purpose')),
    __param(3, (0, common_1.Query)('since')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Get)(':id/credits'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "getCredits", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id/credits'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, grant_credits_dto_1.GrantCreditsDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "grantCredits", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_profile_dto_1.UpdateAgentProfileDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Post)(':id/photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, common_1.Post)(':id/reviews'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "createReview", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Post)(':id/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upload_document_dto_1.UploadOnboardingDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'verification_staff', 'super_admin'),
    (0, common_1.Get)(':id/documents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "listDocuments", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_verification_status_dto_1.SetAgentVerificationStatusDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "setVerificationStatus", null);
exports.AgentsController = AgentsController = __decorate([
    (0, common_1.Controller)('agents'),
    __metadata("design:paramtypes", [agents_repository_1.AgentsRepository,
        avatar_media_service_1.AvatarMediaService])
], AgentsController);
