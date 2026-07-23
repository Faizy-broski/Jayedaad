import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsRepository } from '../services/listingsRepository';

export function useListingSubmissionViewModel() {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: listingsRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return { submit };
}
