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
exports.OtpController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const scope_guard_1 = require("../../common/guards/scope.guard");
const otp_service_1 = require("./otp.service");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
// Self-scoped to req.user.id, no @Roles() restriction — any authenticated
// user can verify their own email. Sits behind the global JwtAuthGuard, which
// is all that's needed: the user already has a session from signUp(), they
// just aren't email_verified yet. ThrottlerGuard is applied globally
// (app.module.ts) — @Throttle() below just overrides its default per-route.
let OtpController = class OtpController {
    otp;
    constructor(otp) {
        this.otp = otp;
    }
    send(req) {
        return this.otp.sendCode(req.user.id);
    }
    verify(req, body) {
        return this.otp.verifyCode(req.user.id, body.code);
    }
    status(req) {
        return this.otp.getStatus(req.user.id);
    }
};
exports.OtpController = OtpController;
__decorate([
    (0, common_1.Post)('send'),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtpController.prototype, "send", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_otp_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", void 0)
], OtpController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtpController.prototype, "status", null);
exports.OtpController = OtpController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, common_1.Controller)('auth/otp'),
    __metadata("design:paramtypes", [otp_service_1.OtpService])
], OtpController);
