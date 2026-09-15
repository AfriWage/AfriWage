/**
 * The organization role vocabulary.
 *
 * Kept in its own module with no imports so request validation can use it
 * without pulling in `require-org.ts`, which reaches the database and the
 * server environment.
 *
 * - `owner` — full control, may add/remove members and provision the treasury
 * - `admin` — manage employees, create and submit payroll runs
 * - `payer` — approve/execute payroll runs; mirrors an approver address on the
 *   org's Charter treasury instance
 */
export const ORG_ROLES = ['owner', 'admin', 'payer'] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === 'string' && (ORG_ROLES as readonly string[]).includes(value);
}
