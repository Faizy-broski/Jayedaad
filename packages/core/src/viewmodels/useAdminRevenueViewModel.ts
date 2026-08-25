import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';

// Kept separate from useAdminDashboardViewModel (rather than folded into
// its existing stats query) — revenue has its own query key and is likely
// to grow its own dedicated deep-dive page later (this dashboard section is
// explicitly the "brief breakdown"), so a standalone hook avoids a refactor
// when that happens. Costs nothing to keep separate today.
export function useAdminRevenueViewModel() {
  const revenueQuery = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: adminRepository.getRevenueStats,
  });

  return {
    revenue: revenueQuery.data,
    isRevenueLoading: revenueQuery.isLoading,
    isRevenueError: revenueQuery.isError,
  };
}
