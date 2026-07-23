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
exports.VerificationController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const verification_repository_1 = require("./verification.repository");
// Verification Staff's primary daily-use screen. Must NOT be reachable by
// 'agent' — no @Roles('agent') here, satisfying [Dev Instr §2.2].
let VerificationController = class VerificationController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    queue() {
        return this.verification.listQueue();
    }
    approve(req, id, note) {
        return this.verification.recordAction(req.user.id, id, 'approve', note);
    }
    reject(req, id, note) {
        return this.verification.recordAction(req.user.id, id, 'reject', note);
    }
    requestInfo(req, id, note) {
        return this.verification.recordAction(req.user.id, id, 'request_info', note);
    }
    // Read-back for verification_audit_log. Method-level @Roles() overrides the
    // class-level one (ScopeGuard uses getAllAndOverride) — deliberately
    // super_admin-only, not verification_staff, since broad cross-reviewer
    // audit visibility is an oversight capability, not staff's daily-use queue.
    auditLog(listingId, reviewerId, dateFrom, dateTo, page, pageSize) {
        return this.verification.listAuditLog({
            listingId,
            reviewerId,
            dateFrom,
            dateTo,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
        });
    }
};
exports.VerificationController = VerificationController;
__decorate([
    (0, common_1.Get)('queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "queue", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('note')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('note')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/request-info'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('note')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "requestInfo", null);
__decorate([
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Get)('audit-log'),
    __param(0, (0, common_1.Query)('listingId')),
    __param(1, (0, common_1.Query)('reviewerId')),
    __param(2, (0, common_1.Query)('dateFrom')),
    __param(3, (0, common_1.Query)('dateTo')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "auditLog", null);
exports.VerificationController = VerificationController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('verification_staff', 'super_admin'),
    (0, common_1.Controller)('verification'),
    __metadata("design:paramtypes", [verification_repository_1.VerificationRepository])
], VerificationController);
