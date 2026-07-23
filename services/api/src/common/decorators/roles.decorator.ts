import { SetMetadata } from '@nestjs/common';
import { Role } from '../types';

export const ROLES_KEY = 'roles';

// Declares which roles may reach a route. Combined with ScopeGuard, which also
// enforces row-level agent scoping — role alone is not sufficient for agent routes.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
