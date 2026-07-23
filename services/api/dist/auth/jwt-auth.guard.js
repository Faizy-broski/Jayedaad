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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jose_1 = require("jose");
const public_decorator_1 = require("../common/decorators/public.decorator");
// Verifies a Supabase-issued JWT and derives { id, role, agentId } from it.
// Identity itself (sign-up/sign-in) is handled entirely by Supabase Auth on
// the client side — this API only ever verifies tokens, never issues them.
//
// Supabase projects sign tokens one of two ways depending on project
// configuration: the newer asymmetric signing keys (ES256/RS256, verified
// against the project's public JWKS — no shared secret involved at all,
// confirmed live against a real project's tokens), or the older "Legacy
// JWT" shared-secret mode (HS256, SUPABASE_JWT_SECRET). This guard supports
// both, branching on the token's own `alg` header — a fixed HS256-only
// implementation cannot verify an ES256 token no matter what secret value
// is supplied, which is what a real dev-project test surfaced.
//
// role/agentId come from the token's app_metadata claim, which is only
// settable via the Supabase service-role Admin API — never by the end user —
// so it can't be self-escalated by a client.
//
// Every route is authenticated by default; routes must opt OUT via @Public(),
// never opt in — so a missing guard can never silently expose data.
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    // Lazy + memoized: only constructed (and only fetches the JWKS on first
    // use) if a token actually needs asymmetric verification.
    jwks;
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) {
            if (isPublic)
                return true;
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        try {
            const payload = await this.verify(token);
            request.user = {
                id: payload.sub,
                role: payload.app_metadata?.role ?? 'buyer',
                agentId: payload.app_metadata?.agent_id,
            };
            return true;
        }
        catch {
            if (isPublic)
                return true;
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async verify(token) {
        const { alg } = (0, jose_1.decodeProtectedHeader)(token);
        if (alg === 'HS256') {
            const secret = process.env.SUPABASE_JWT_SECRET;
            if (!secret)
                throw new Error('SUPABASE_JWT_SECRET must be set to verify an HS256 (legacy) Supabase token');
            const { payload } = await (0, jose_1.jwtVerify)(token, new TextEncoder().encode(secret));
            return payload;
        }
        // Asymmetric signing (ES256/RS256) — verify against the project's
        // public JWKS. No secret needed; the key is fetched (and cached, with
        // automatic re-fetch on an unrecognized `kid`) from Supabase directly.
        if (!this.jwks) {
            const supabaseUrl = process.env.SUPABASE_URL;
            if (!supabaseUrl)
                throw new Error('SUPABASE_URL must be set to verify an asymmetrically-signed Supabase token');
            this.jwks = (0, jose_1.createRemoteJWKSet)(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
        }
        const { payload } = await (0, jose_1.jwtVerify)(token, this.jwks);
        return payload;
    }
    extractToken(request) {
        const header = request.headers.authorization;
        if (!header?.startsWith('Bearer '))
            return undefined;
        return header.slice('Bearer '.length);
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], JwtAuthGuard);
