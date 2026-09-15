'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type SessionState, fetchSession, loginWithFreighter, logout } from '@/lib/auth-client';

export const sessionQueryKey = ['session'] as const;

/**
 * The wallet this browser is authenticated as.
 *
 * The session cookie is HttpOnly, so the server is the only source of truth
 * here — the hook cannot short-circuit by reading a token itself.
 */
export function useSession() {
  return useQuery<SessionState>({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: 60 * 1000,
  });
}

/**
 * Runs the SEP-10 login and refreshes every query afterwards.
 *
 * Org and employee data is scoped to the authenticated wallet, so anything
 * cached from a previous session would be wrong once the wallet changes.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithFreighter,
    onSuccess: (walletPublicKey) => {
      queryClient.setQueryData<SessionState>(sessionQueryKey, {
        authenticated: true,
        walletPublicKey,
      });
      void queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<SessionState>(sessionQueryKey, { authenticated: false });
      queryClient.clear();
    },
  });
}
