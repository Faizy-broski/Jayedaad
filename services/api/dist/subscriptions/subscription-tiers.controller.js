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
exports.SubscriptionTiersController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const subscription_tiers_repository_1 = require("./subscription-tiers.repository");
const subscription_tier_dto_1 = require("./dto/subscription-tier.dto");
let SubscriptionTiersController = class SubscriptionTiersController {
    tiers;
    constructor(tiers) {
        this.tiers = tiers;
    }
    // Public — agents need to see available plans before upgrading.
    list() {
        return this.tiers.list();
    }
    create(body) {
        return this.tiers.create(body);
    }
    update(id, body) {
        return this.tiers.update(id, body);
    }
    remove(id) {
        return this.tiers.remove(id);
    }
};
exports.SubscriptionTiersController = SubscriptionTiersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionTiersController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [subscription_tier_dto_1.CreateSubscriptionTierDto]),
    __metadata("design:returntype", void 0)
], SubscriptionTiersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, subscription_tier_dto_1.UpdateSubscriptionTierDto]),
    __metadata("design:returntype", void 0)
], SubscriptionTiersController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionTiersController.prototype, "remove", null);
exports.SubscriptionTiersController = SubscriptionTiersController = __decorate([
    (0, common_1.Controller)('subscription-tiers'),
    __metadata("design:paramtypes", [subscription_tiers_repository_1.SubscriptionTiersRepository])
], SubscriptionTiersController);
