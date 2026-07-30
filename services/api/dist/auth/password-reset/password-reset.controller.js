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
exports.PasswordResetController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const password_reset_service_1 = require("./password-reset.service");
const request_password_reset_dto_1 = require("./dto/request-password-reset.dto");
const confirm_password_reset_dto_1 = require("./dto/confirm-password-reset.dto");
// Both routes are @Public() — the user isn't logged in yet, that's the whole
// point of this flow. Explicit ThrottlerGuard (not just the global default)
// with tight limits: this is the most sensitive unauthenticated surface in
// the API — email enumeration risk on /request, password-change risk on
// /confirm.
let PasswordResetController = class PasswordResetController {
    passwordReset;
    constructor(passwordReset) {
        this.passwordReset = passwordReset;
    }
    request(body) {
        return this.passwordReset.requestReset(body.email);
    }
    confirm(body) {
        return this.passwordReset.confirmReset(body.email, body.code, body.newPassword);
    }
};
exports.PasswordResetController = PasswordResetController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('request'),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_password_reset_dto_1.RequestPasswordResetDto]),
    __metadata("design:returntype", void 0)
], PasswordResetController.prototype, "request", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('confirm'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [confirm_password_reset_dto_1.ConfirmPasswordResetDto]),
    __metadata("design:returntype", void 0)
], PasswordResetController.prototype, "confirm", null);
exports.PasswordResetController = PasswordResetController = __decorate([
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Controller)('auth/password-reset'),
    __metadata("design:paramtypes", [password_reset_service_1.PasswordResetService])
], PasswordResetController);
