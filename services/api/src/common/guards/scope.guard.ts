import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../types';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Server-side RBAC enforcement point. Per the blueprint (§3.3) and the RBAC
// dev instructions, access rules must be checked here — never assumed from
// the frontend hiding a button. Runs AFTER JwtAuthGuard, which has already
// attached `request.user`.
//
// This guard only decides ROLE-level access (can this role hit this route at all).
// Row-level agent isolation (agent_id filtering) happens one layer deeper, inside
// each repository method (see leads/leads.repository.ts), so a coding mistake in
// one layer doesn't silently disable the other.
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No @Roles() declared: route is reachable by any authenticated user.
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user on request');
    }

    // Super Admin bypasses all role/agent scoping per [Spec §5] / [Dev Instr §2.1].
    if (user.role === 'super_admin') {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Role '${user.role}' cannot access this resource`);
    }

    return true;
  }
}
