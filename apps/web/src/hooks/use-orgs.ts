'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrgRole } from '@/lib/org-roles';
import {
  type CreateEmployeeBody,
  type CreateOrganizationBody,
  type Employee,
  type OrgMember,
  type Organization,
  addMember,
  createEmployee,
  createOrganization,
  getOrganization,
  listEmployees,
  listMembers,
  listOrganizations,
  removeMember,
  updateEmployee,
} from '@/lib/org-client';

export const orgKeys = {
  all: ['orgs'] as const,
  list: () => [...orgKeys.all, 'list'] as const,
  detail: (orgId: string) => [...orgKeys.all, 'detail', orgId] as const,
  members: (orgId: string) => [...orgKeys.all, orgId, 'members'] as const,
  employees: (orgId: string, activeOnly: boolean) =>
    [...orgKeys.all, orgId, 'employees', activeOnly] as const,
};

export function useOrganizations(enabled = true) {
  return useQuery<Organization[]>({
    queryKey: orgKeys.list(),
    queryFn: listOrganizations,
    enabled,
  });
}

export function useOrganization(orgId: string, enabled = true) {
  return useQuery<Organization>({
    queryKey: orgKeys.detail(orgId),
    queryFn: () => getOrganization(orgId),
    enabled: enabled && orgId !== '',
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateOrganizationBody) => createOrganization(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.list() });
    },
  });
}

export function useOrgMembers(orgId: string, enabled = true) {
  return useQuery<OrgMember[]>({
    queryKey: orgKeys.members(orgId),
    queryFn: () => listMembers(orgId),
    enabled: enabled && orgId !== '',
  });
}

export function useAddMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { walletPublicKey: string; role: OrgRole }) => addMember(orgId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletPublicKey: string) => removeMember(orgId, walletPublicKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

export function useEmployees(orgId: string, activeOnly = false, enabled = true) {
  return useQuery<Employee[]>({
    queryKey: orgKeys.employees(orgId, activeOnly),
    queryFn: () => listEmployees(orgId, activeOnly),
    enabled: enabled && orgId !== '',
  });
}

/** Invalidates both the all-employees and active-only lists after a write. */
function invalidateEmployees(queryClient: ReturnType<typeof useQueryClient>, orgId: string): void {
  void queryClient.invalidateQueries({ queryKey: orgKeys.employees(orgId, false) });
  void queryClient.invalidateQueries({ queryKey: orgKeys.employees(orgId, true) });
}

export function useCreateEmployee(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateEmployeeBody) => createEmployee(orgId, body),
    onSuccess: () => invalidateEmployees(queryClient, orgId),
  });
}

export function useUpdateEmployee(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { id: string } & Partial<CreateEmployeeBody> & { active?: boolean }) =>
      updateEmployee(orgId, body),
    onSuccess: () => invalidateEmployees(queryClient, orgId),
  });
}
