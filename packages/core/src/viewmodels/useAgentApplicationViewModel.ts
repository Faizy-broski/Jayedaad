import { useMutation } from '@tanstack/react-query';
import { agentsRepository } from '../services/agentsRepository';
import { refreshSession } from '../services/authService';
import { ApplyAsAgentInput } from '../models';

// Self-service "Apply to become an agent" — for the become-an-agent page.
// Refreshes the session on success so role/agentId (read from the JWT via
// useAuthViewModel) reflect the buyer -> agent flip immediately, without
// requiring the user to sign out and back in.
export function useAgentApplicationViewModel() {
  const apply = useMutation({
    mutationFn: (input: ApplyAsAgentInput) => agentsRepository.applyAsAgent(input),
    onSuccess: () => refreshSession(),
  });

  return { apply };
}
