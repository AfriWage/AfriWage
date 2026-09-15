'use client';

import type { OrgRole } from './org-roles';
import { apiFetch } from './api-client';

/** Typed client calls for the organization, member and employee routes. */

export interface Organization {
  id: string;
  name: string;
  treasuryContractId: string | null;
  charterOrgId: string | null;
  defaultOfframpCurrency: string | null;
  createdAt: string | null;
  role: OrgRole;
}

export interface OrgMember {
  id: string;
  walletPublicKey: string;
  role: OrgRole;
  createdAt: string | null;
}

export interface Employee {
  id: string;
  orgId: string;
  name: string;
  stellarPublicKey: string;
  wageAmount: string;
  wageCurrency: string;
  payoutOfframpCurrency: string | null;
  active: boolean;
  createdAt: string | null;
}

export interface CreateOrganizationBody {
  name: string;
  defaultOfframpCurrency?: string | null;
}

export async function listOrganizations(): Promise<Organization[]> {
  const { organizations } = await apiFetch<{ organizations: Organization[] }>('/api/orgs');
  return organizations;
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const { organization } = await apiFetch<{ organization: Organization }>(
    `/api/orgs/${encodeURIComponent(orgId)}`
  );
  return organization;
}

export async function createOrganization(body: CreateOrganizationBody): Promise<Organization> {
  const { organization } = await apiFetch<{ organization: Organization }>('/api/orgs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return organization;
}

export async function listMembers(orgId: string): Promise<OrgMember[]> {
  const { members } = await apiFetch<{ members: OrgMember[] }>(
    `/api/orgs/${encodeURIComponent(orgId)}/members`
  );
  return members;
}

export async function addMember(
  orgId: string,
  body: { walletPublicKey: string; role: OrgRole }
): Promise<OrgMember> {
  const { member } = await apiFetch<{ member: OrgMember }>(
    `/api/orgs/${encodeURIComponent(orgId)}/members`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return member;
}

export async function removeMember(orgId: string, walletPublicKey: string): Promise<void> {
  await apiFetch<{ removed: string }>(
    `/api/orgs/${encodeURIComponent(orgId)}/members?walletPublicKey=${encodeURIComponent(walletPublicKey)}`,
    { method: 'DELETE' }
  );
}

export async function listEmployees(orgId: string, activeOnly = false): Promise<Employee[]> {
  const query = activeOnly ? '?active=true' : '';
  const { employees } = await apiFetch<{ employees: Employee[] }>(
    `/api/orgs/${encodeURIComponent(orgId)}/employees${query}`
  );
  return employees;
}

export interface CreateEmployeeBody {
  name: string;
  stellarPublicKey: string;
  wageAmount: string;
  payoutOfframpCurrency?: string | null;
}

export async function createEmployee(orgId: string, body: CreateEmployeeBody): Promise<Employee> {
  const { employee } = await apiFetch<{ employee: Employee }>(
    `/api/orgs/${encodeURIComponent(orgId)}/employees`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return employee;
}

export async function updateEmployee(
  orgId: string,
  body: { id: string } & Partial<CreateEmployeeBody> & { active?: boolean }
): Promise<Employee> {
  const { employee } = await apiFetch<{ employee: Employee }>(
    `/api/orgs/${encodeURIComponent(orgId)}/employees`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  return employee;
}
