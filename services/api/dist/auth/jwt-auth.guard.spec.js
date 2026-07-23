"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const jose_1 = require("jose");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const TEST_SECRET = 'test-secret-at-least-32-bytes-long-for-hs256';
function buildContext(authorizationHeader) {
    const request = { headers: { authorization: authorizationHeader }, user: undefined };
    return {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => ({}),
        getClass: () => ({}),
    };
}
// Real HS256-signed tokens (not mocked verification) — exercises the guard's
// actual legacy-secret verification path. Asymmetric (ES256/JWKS)
// verification isn't covered here since it requires a live network fetch of
// a project's JWKS; that path was instead confirmed against a real Supabase
// dev project during manual testing.
async function signPayload(payload) {
    return new jose_1.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(new TextEncoder().encode(TEST_SECRET));
}
describe('JwtAuthGuard', () => {
    const originalSecret = process.env.SUPABASE_JWT_SECRET;
    beforeEach(() => {
        process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
    });
    afterAll(() => {
        process.env.SUPABASE_JWT_SECRET = originalSecret;
    });
    it('rejects a request with no bearer token on a protected route', async () => {
        const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
        const guard = new jwt_auth_guard_1.JwtAuthGuard(reflector);
        await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(common_1.UnauthorizedException);
    });
    it('allows a request with no token on a @Public() route', async () => {
        const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
        const guard = new jwt_auth_guard_1.JwtAuthGuard(reflector);
        await expect(guard.canActivate(buildContext(undefined))).resolves.toBe(true);
    });
    it('derives { id, role, agentId } from a Supabase JWT payload', async () => {
        const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
        const guard = new jwt_auth_guard_1.JwtAuthGuard(reflector);
        // Shape of a real Supabase Auth access token: identity in `sub`,
        // app-specific role/agent_id in `app_metadata` (set via the Admin API).
        const token = await signPayload({ sub: 'u1', app_metadata: { role: 'agent', agent_id: 'a1' } });
        const ctx = buildContext(`Bearer ${token}`);
        await expect(guard.canActivate(ctx)).resolves.toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({ id: 'u1', role: 'agent', agentId: 'a1' });
    });
    it('defaults role to buyer when app_metadata has no role claim', async () => {
        const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
        const guard = new jwt_auth_guard_1.JwtAuthGuard(reflector);
        const token = await signPayload({ sub: 'u2', app_metadata: {} });
        const ctx = buildContext(`Bearer ${token}`);
        await expect(guard.canActivate(ctx)).resolves.toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({ id: 'u2', role: 'buyer', agentId: undefined });
    });
    it('rejects an invalid/expired token on a protected route', async () => {
        const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
        const guard = new jwt_auth_guard_1.JwtAuthGuard(reflector);
        await expect(guard.canActivate(buildContext('Bearer not.a.validtoken'))).rejects.toThrow(common_1.UnauthorizedException);
    });
    it('rejects a token signed with the wrong secret', async () => {
        const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
        const guard = new jwt_auth_guard_1.JwtAuthGuard(reflector);
        const token = await new jose_1.SignJWT({ sub: 'u3', app_metadata: {} })
            .setProtectedHeader({ alg: 'HS256' })
            .sign(new TextEncoder().encode('a-completely-different-secret-value'));
        await expect(guard.canActivate(buildContext(`Bearer ${token}`))).rejects.toThrow(common_1.UnauthorizedException);
    });
});
