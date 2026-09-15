'use client';

import type { TreasuryState } from '@AfriWage/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBudgetCategoryViaFreighter,
  fetchTreasuryState,
  provisionTreasuryViaFreighter,
} from '@/lib/treasury-client';
import { orgKeys } from './use-orgs';

export const treasuryKeys = {
  detail: (orgId: string) => ['treasury', orgId] as const,
};

export function useTreasury(orgId: string, enabled = true) {
  return useQuery<{ treasury: TreasuryState | null }>({
    queryKey: treasuryKeys.detail(orgId),
    queryFn: () => fetchTreasuryState(orgId),
    enabled: enabled && orgId !== '',
    // Treasury state lives on chain and changes when a payout executes, so it
    // goes stale faster than the org record beside it.
    staleTime: 15 * 1000,
  });
}

/**
 * Provisions the treasury, then refreshes both the org record — which now
 * carries the treasury address — and the on-chain state.
 */
export function useProvisionTreasury(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threshold?: number) => provisionTreasuryViaFreighter(orgId, threshold),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
      void queryClient.invalidateQueries({ queryKey: orgKeys.list() });
      void queryClient.invalidateQueries({ queryKey: treasuryKeys.detail(orgId) });
    },
  });
}

export function useCreateBudgetCategory(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; capAmount: string }) =>
      createBudgetCategoryViaFreighter(orgId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: treasuryKeys.detail(orgId) });
    },
  });
}
