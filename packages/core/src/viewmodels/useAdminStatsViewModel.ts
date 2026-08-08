import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';

// Platform-wide rollup (GET /admin/stats) — shared by any admin table whose
// header stat tiles need a true total, not just a count over whatever page
// of results happens to be loaded (Agencies/Agents/Users all hit this once
// their list views became server-side paginated, instead of each
// recomputing its own breakdown from the full unpaginated array the way
// they used to).
export function useAdminStatsViewModel() {
  const query = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminRepository.getPlatformStats,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
  };
}
