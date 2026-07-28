import { useMutation } from '@tanstack/react-query';
import { getUserAgentId, getUserRole, signInWithPassword, signOut, signUp } from '../services/authService';
import { useAuthStore } from '../state/useAuthStore';
// The single entry point apps are expected to call for anything auth-related
// — reactive session state (via useAuthStore) plus the write actions
// (sign in/up/out), each wrapped as a mutation so pages get the same
// isPending/isError/mutate(Async) shape every other write path in this
// codebase already uses (see useListingSubmissionViewModel, etc.). Pages
// should never import authService or useAuthStore directly — this hook is
// the boundary.
export function useAuthViewModel() {
    const session = useAuthStore((state) => state.session);
    const user = useAuthStore((state) => state.user);
    const isInitializing = useAuthStore((state) => state.isInitializing);
    const signIn = useMutation({
        mutationFn: (credentials) => signInWithPassword(credentials),
    });
    const signUpMutation = useMutation({
        mutationFn: (credentials) => signUp(credentials),
    });
    const signOutMutation = useMutation({
        mutationFn: () => signOut(),
    });
    return {
        session,
        user,
        isAuthenticated: !!session,
        isInitializing,
        role: getUserRole(user),
        agentId: getUserAgentId(user),
        signIn,
        signUp: signUpMutation,
        signOut: signOutMutation,
    };
}
