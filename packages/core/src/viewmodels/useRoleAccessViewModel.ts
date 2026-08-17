import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';
import { Role } from '../models';

// Backs both admin shells' role label/description — GET /admin/roles is
// method-level-widened to verification_staff too (see
// services/api/src/admin/admin.controller.ts's listRoles()), so this isn't
// super_admin-only despite living in adminRepository. Previously every
// shell hardcoded its own role label as a literal string ("Super Admin"
// baked into (super-admin)/layout.tsx regardless of who was actually
// logged in) — this resolves the real ROLE_ACCESS_DESCRIPTIONS manifest
// instead, so the label always matches the signed-in user's actual role.
export function useRoleAccessViewModel(role: Role | undefined) {
  const query = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminRepository.listRoles,
    enabled: !!role,
    staleTime: 5 * 60_000,
  });

  const current = query.data?.find((r) => r.role === role);

  return {
    roles: query.data ?? [],
    current,
    isLoading: query.isLoading,
  };
}
