'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type CreatePayrollRunBody,
  type PayrollRun,
  type PayrollRunItem,
  approvePayrollRun,
  createPayrollRun,
  executePayrollRun,
  getPayrollRun,
  listPayrollRuns,
  refreshOfframpStatus,
  submitPayrollRun,
} from '@/lib/payroll-client';

export const payrollKeys = {
  all: ['payroll'] as const,
  list: (orgId: string) => [...payrollKeys.all, 'list', orgId] as const,
  detail: (runId: string) => [...payrollKeys.all, 'detail', runId] as const,
};

export function usePayrollRuns(orgId: string, enabled = true) {
  return useQuery<PayrollRun[]>({
    queryKey: payrollKeys.list(orgId),
    queryFn: () => listPayrollRuns(orgId),
    enabled: enabled && orgId !== '',
  });
}

export function usePayrollRun(runId: string, enabled = true) {
  return useQuery<{ payrollRun: PayrollRun; items: PayrollRunItem[] }>({
    queryKey: payrollKeys.detail(runId),
    queryFn: () => getPayrollRun(runId),
    enabled: enabled && runId !== '',
  });
}

export function useCreatePayrollRun(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePayrollRunBody) => createPayrollRun(orgId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.list(orgId) });
    },
  });
}

/**
 * Invalidates both the run detail and its organization's list.
 *
 * Every run action changes the status shown in the list, so refreshing only the
 * detail would leave a stale badge behind on the page the user returns to.
 */
function invalidateRun(
  queryClient: ReturnType<typeof useQueryClient>,
  runId: string,
  orgId: string
): void {
  void queryClient.invalidateQueries({ queryKey: payrollKeys.detail(runId) });
  void queryClient.invalidateQueries({ queryKey: payrollKeys.list(orgId) });
}

export function useSubmitPayrollRun(runId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => submitPayrollRun(runId, categoryId),
    onSuccess: () => invalidateRun(queryClient, runId, orgId),
  });
}

export function useApprovePayrollRun(runId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => approvePayrollRun(runId),
    onSuccess: () => invalidateRun(queryClient, runId, orgId),
  });
}

export function useExecutePayrollRun(runId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { senderPublicKey: string; items: PayrollRunItem[] }) =>
      executePayrollRun(runId, args.senderPublicKey, args.items),
    onSuccess: () => invalidateRun(queryClient, runId, orgId),
  });
}

export function useRefreshOfframpStatus(runId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshOfframpStatus(runId),
    onSuccess: () => invalidateRun(queryClient, runId, orgId),
  });
}
