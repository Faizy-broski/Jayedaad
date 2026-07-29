"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpModule = void 0;
const common_1 = require("@nestjs/common");
const otp_controller_1 = require("./otp.controller");
const otp_service_1 = require("./otp.service");
const otp_repository_1 = require("./otp.repository");
const mailer_service_1 = require("./mailer.service");
// ThrottlerModule itself is registered once, globally, in app.module.ts —
// OtpController's per-route @Throttle() decorators override that global
// default with the stricter limits this surface needs (send/verify are the
// most abuse-prone routes in the API: free signup + an inbox to spam, or a
// 6-digit code to brute-force).
let OtpModule = class OtpModule {
};
exports.OtpModule = OtpModule;
exports.OtpModule = OtpModule = __decorate([
    (0, common_1.Module)({
        controllers: [otp_controller_1.OtpController],
        providers: [otp_service_1.OtpService, otp_repository_1.OtpRepository, mailer_service_1.MailerService],
    })
], OtpModule);
