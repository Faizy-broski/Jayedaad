"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_controller_1 = require("./subscriptions.controller");
const subscription_tiers_controller_1 = require("./subscription-tiers.controller");
const entitlements_service_1 = require("./entitlements.service");
const subscriptions_repository_1 = require("./subscriptions.repository");
const subscription_tiers_repository_1 = require("./subscription-tiers.repository");
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        controllers: [subscriptions_controller_1.SubscriptionsController, subscription_tiers_controller_1.SubscriptionTiersController],
        providers: [entitlements_service_1.EntitlementsService, subscriptions_repository_1.SubscriptionsRepository, subscription_tiers_repository_1.SubscriptionTiersRepository],
        exports: [entitlements_service_1.EntitlementsService],
    })
], SubscriptionsModule);
