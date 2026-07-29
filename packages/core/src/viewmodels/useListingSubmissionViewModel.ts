import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateListingInput, listingsRepository } from '../services/listingsRepository';

export function useListingSubmissionViewModel() {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: listingsRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  // Save-as-draft — same body as submit(), but the listing lands with
  // status='draft' instead of entering the verification queue.
  const saveDraft = useMutation({
    mutationFn: listingsRepository.createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  // Moves an existing draft into the verification queue.
  const submitForVerification = useMutation({
    mutationFn: (listingId: string) => listingsRepository.submitDraft(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  // The /submit form's edit-mode write path — same page, same field set,
  // just PATCHes an existing listing instead of POSTing a new one.
  const update = useMutation({
    mutationFn: ({ listingId, input }: { listingId: string; input: Partial<CreateListingInput> }) =>
      listingsRepository.updateListing(listingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return { submit, saveDraft, submitForVerification, update };
}
