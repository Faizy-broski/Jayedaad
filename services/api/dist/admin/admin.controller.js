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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const admin_repository_1 = require("./admin.repository");
const role_access_descriptions_1 = require("./role-access-descriptions");
// Super Admin-only platform rollup — everything else this session is scoped
// to a single agent/agency; nothing until now gives a whole-platform view.
let AdminController = class AdminController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    getStats() {
        return this.admin.getPlatformStats();
    }
    listAgents() {
        return this.admin.listAgentsOverview();
    }
    // "Which role gets what dashboard access" reference for the team
    // management screen — see role-access-descriptions.ts.
    listRoles() {
        return Object.values(role_access_descriptions_1.ROLE_ACCESS_DESCRIPTIONS);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('agents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listAgents", null);
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listRoles", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_repository_1.AdminRepository])
], AdminController);
