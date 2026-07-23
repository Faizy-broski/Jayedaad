import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopeGuard } from './scope.guard';

// Unit-level RBAC verification: exercises the guard's own decision logic
// directly, independent of a running HTTP server or database. Per [Dev Instr
// §4] ("automated tests hitting the API directly, not just UI-level checks"),
// these are a prerequisite layer — full e2e Supertest coverage against a live
// DB is added once a database is provisioned (see README).
function buildContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('ScopeGuard', () => {
  function makeGuard(rolesForRoute: string[] | undefined) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(rolesForRoute) } as unknown as Reflector;
    return new ScopeGuard(reflector);
  }

  it('allows any authenticated user when no @Roles() is declared', () => {
    const guard = makeGuard(undefined);
    const ctx = buildContext({ id: '1', role: 'buyer' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('super_admin bypasses role restrictions entirely [Spec §5]', () => {
    const guard = makeGuard(['agent'] as any);
    const ctx = buildContext({ id: '1', role: 'super_admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows a user whose role matches the required roles', () => {
    const guard = makeGuard(['agent', 'super_admin'] as any);
    const ctx = buildContext({ id: '1', role: 'agent', agentId: 'agent-1' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects verification_staff from agent/CRM routes [Dev Instr §2.2]', () => {
    const guard = makeGuard(['agent', 'super_admin'] as any);
    const ctx = buildContext({ id: '1', role: 'verification_staff' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects an agent from staff-only verification routes', () => {
    const guard = makeGuard(['verification_staff', 'super_admin'] as any);
    const ctx = buildContext({ id: '1', role: 'agent', agentId: 'agent-1' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects an agent from user/account management routes [Spec §5]', () => {
    const guard = makeGuard(['super_admin'] as any);
    const ctx = buildContext({ id: '1', role: 'agent', agentId: 'agent-1' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws if no authenticated user is present on the request', () => {
    const guard = makeGuard(['agent'] as any);
    const ctx = buildContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
