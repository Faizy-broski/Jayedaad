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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const supabase_service_1 = require("../supabase/supabase.service");
let HealthController = class HealthController {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async check() {
        // Readiness, not just liveness — a load balancer/uptime monitor should
        // be able to tell "process is up" apart from "process is up but can't
        // reach the database", since those need different responses.
        const { error } = await this.supabase.client.from('profiles').select('id').limit(1);
        if (error) {
            throw new common_1.ServiceUnavailableException({
                status: 'degraded',
                service: 'jayedaad-api',
                database: 'unreachable',
                timestamp: new Date().toISOString(),
            });
        }
        return { status: 'ok', service: 'jayedaad-api', database: 'reachable', timestamp: new Date().toISOString() };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], HealthController);
