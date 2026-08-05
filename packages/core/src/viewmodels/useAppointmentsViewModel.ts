import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsRepository, AppointmentListFilters } from '../services/appointmentsRepository';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../models';

// Backs the agent Calendar screen — self-scoped server-side, always the
// logged-in agent's own appointments.
export function useAppointmentsViewModel(filters: AppointmentListFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['appointments', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => appointmentsRepository.list(filters),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const create = useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentsRepository.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ appointmentId, input }: { appointmentId: string; input: UpdateAppointmentInput }) =>
      appointmentsRepository.update(appointmentId, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (appointmentId: string) => appointmentsRepository.remove(appointmentId),
    onSuccess: invalidate,
  });

  return {
    appointments: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
