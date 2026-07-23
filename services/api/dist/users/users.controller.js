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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_repository_1 = require("./users.repository");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
// User/account management — Super Admin ONLY. Verification Staff and Agent
// must never reach this module, per [Spec §5] / [Dev Instr §2.2/§2.3].
let UsersController = class UsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    // Backs the "team members" screen — ?role=super_admin,verification_staff
    // pulls just internal staff instead of the full user base.
    list(role) {
        const roles = role ? role.split(',').map((r) => r.trim()) : undefined;
        return this.users.list({ roles });
    }
    findById(id) {
        return this.users.findById(id);
    }
    create(body) {
        return this.users.create(body);
    }
    updateRole(id, body) {
        return this.users.updateRole(id, body);
    }
    suspend(id) {
        return this.users.suspend(id);
    }
    unsuspend(id) {
        return this.users.unsuspend(id);
    }
    remove(id) {
        return this.users.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateUserRoleDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Patch)(':id/suspend'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "suspend", null);
__decorate([
    (0, common_1.Patch)(':id/unsuspend'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unsuspend", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersController);
