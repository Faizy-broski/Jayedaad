import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsRepository } from '../services/notificationsRepository';

// Backs the notification bell on both platforms — previously nothing
// consumed GET /notifications at all, despite it (and the underlying write
// path used by lead assignment/reminders) already existing and working.
// Polled every 30s, same convention as the CRM viewmodels, so a fired
// reminder or new-lead alert shows up without a manual refresh.
export function useNotificationsViewModel() {
  const queryClient = useQueryClient();
  const queryKey = ['notifications'];

  const query = useQuery({
    queryKey,
    queryFn: () => notificationsRepository.list(),
    refetchInterval: 30_000,
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsRepository.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsRepository.markAllRead(),
    onSuccess: invalidate,
  });

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
  };
}
