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
exports.DevelopersController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const developers_repository_1 = require("./developers.repository");
const create_developer_dto_1 = require("./dto/create-developer.dto");
const update_developer_dto_1 = require("./dto/update-developer.dto");
let DevelopersController = class DevelopersController {
    developers;
    constructor(developers) {
        this.developers = developers;
    }
    list(city) {
        return this.developers.list({ city });
    }
    findBySlug(slug) {
        return this.developers.findBySlug(slug);
    }
    create(body) {
        return this.developers.create(body);
    }
    update(id, body) {
        return this.developers.update(id, body);
    }
    remove(id) {
        return this.developers.remove(id);
    }
};
exports.DevelopersController = DevelopersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevelopersController.prototype, "list", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevelopersController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_developer_dto_1.CreateDeveloperDto]),
    __metadata("design:returntype", void 0)
], DevelopersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_developer_dto_1.UpdateDeveloperDto]),
    __metadata("design:returntype", void 0)
], DevelopersController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevelopersController.prototype, "remove", null);
exports.DevelopersController = DevelopersController = __decorate([
    (0, common_1.Controller)('developers'),
    __metadata("design:paramtypes", [developers_repository_1.DevelopersRepository])
], DevelopersController);
