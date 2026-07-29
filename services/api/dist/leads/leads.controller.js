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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const leads_repository_1 = require("./leads.repository");
const create_lead_dto_1 = require("./dto/create-lead.dto");
// Guards are applied per-method (not at the class level) because `create`
// must be reachable by an unauthenticated buyer submitting a contact-form
// inquiry — every other route stays agent/super_admin-only, and
// verification_staff never sees this module at all [Dev Instr §2.2].
let LeadsController = class LeadsController {
    leads;
    constructor(leads) {
        this.leads = leads;
    }
    // Public intake: chatbot leads, contact-agent form submissions, call
    // requests [Dev Instr §3.1]. No role required — the requester has no account.
    create(body) {
        return this.leads.create(body);
    }
    list(req, status, listingId, agentId) {
        return this.leads.list(req.user, { status, listingId, agentId });
    }
    addNote(req, id, body) {
        return this.leads.addNote(req.user, id, body);
    }
    updateStatus(req, id, status) {
        return this.leads.updateStatus(req.user, id, status);
    }
    // J.Team-only per [Dev Instr §3.2]: "Agents cannot reassign leads to other
    // agents without J.Team involvement."
    assign(req, id, agentId) {
        return this.leads.assign(req.user.id, id, agentId);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('listingId')),
    __param(3, (0, common_1.Query)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Post)(':id/notes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('body')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "addNote", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id/assign'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "assign", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.Controller)('crm/leads'),
    __metadata("design:paramtypes", [leads_repository_1.LeadsRepository])
], LeadsController);
