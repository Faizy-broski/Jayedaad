import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersRepository } from '../services/remindersRepository';
import { CreateReminderInput } from '../models';

// Backs the "Set reminder" action on a lead — web CRM cards and mobile's
// LeadDetailScreen. Reminders don't fire client-side; services/api's
// RemindersService (a @Cron job) turns a due one into a real notification
// for the lead's assigned agent, surfaced via useNotificationsViewModel.
export function useLeadRemindersViewModel(leadId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['reminders', leadId];

  const query = useQuery({
    queryKey,
    queryFn: () => remindersRepository.listForLead(leadId!),
    enabled: !!leadId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: (input: CreateReminderInput) => remindersRepository.create(leadId!, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => remindersRepository.remove(id),
    onSuccess: invalidate,
  });

  return {
    reminders: query.data ?? [],
    isLoading: query.isLoading,
    create,
    remove,
  };
}
