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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const entitlements_service_1 = require("./entitlements.service");
const subscriptions_repository_1 = require("./subscriptions.repository");
const assign_subscription_dto_1 = require("./dto/assign-subscription.dto");
let SubscriptionsController = class SubscriptionsController {
    entitlements;
    subscriptions;
    constructor(entitlements, subscriptions) {
        this.entitlements = entitlements;
        this.subscriptions = subscriptions;
    }
    // "40 of 50 listings used" — real-time usage tracking [Spec §6/§8.1].
    usage(req) {
        return this.entitlements.getListingUsage(req.user.agentId);
    }
    // Super Admin assigns/changes an agent's plan — the write side that was
    // entirely missing; nothing ever populated `subscriptions` before this.
    assign(agentId, body) {
        return this.subscriptions.assign(agentId, body);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Get)('usage'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "usage", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':agentId/assign'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_subscription_dto_1.AssignSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "assign", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [entitlements_service_1.EntitlementsService,
        subscriptions_repository_1.SubscriptionsRepository])
], SubscriptionsController);
