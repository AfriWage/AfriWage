import { db, orgMembers, organizations } from '@AfriWage/db';
import { and, eq } from 'drizzle-orm';
import { type Session, getSession } from './auth';
import { forbidden, notFound, unauthorized } from './api-errors';

/**
 * Org-scoped authorisation for every organization, treasury and payroll route.
 *
 * Membership is read from `org_members` on each request rather than carried in
 * the session token, so removing a member takes effect immediately.
 */

export const ORG_ROLES = ['owner', 'admin', 'payer'] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === 'string' && (ORG_ROLES as readonly string[]).includes(value);
}

/**
 * Which stored roles satisfy a required role.
 *
 * An `owner` has full governance control, so it satisfies `admin`. It
 * deliberately does **not** satisfy `payer`: `payer` mirrors the approver set
 * on the org's Charter treasury instance, and an owner who is not also a payer
 * is not an on-chain approver. Letting an owner through here would produce a
 * request that passes our checks and then fails with Charter's `NotApprover`,
 * which is a worse failure than refusing it up front.
 */
const ROLE_SATISFIES: Record<OrgRole, readonly OrgRole[]> = {
  owner: ['owner'],
  admin: ['owner', 'admin'],
  payer: ['payer'],
};

export interface OrgContext {
  orgId: string;
  role: OrgRole;
  walletPublicKey: string;
}

/** Returns the authenticated session or raises a 401. */
export function requireSession(request: Request): Session {
  const session = getSession(request);

  if (!session) {
    throw unauthorized('Connect and authenticate a wallet to continue');
  }

  return session;
}

/**
 * Resolves the caller's membership of an organization.
 *
 * Raises 401 when unauthenticated, 404 when the org does not exist, and 403
 * when the caller is not a member or lacks the required role.
 *
 * A non-member gets 403 rather than 404 only because the org's existence is
 * already public on-chain via Charter's org registry; nothing is leaked that a
 * factory read would not reveal.
 */
export async function requireOrg(
  request: Request,
  orgId: string,
  requiredRole?: OrgRole
): Promise<OrgContext> {
  const { walletPublicKey } = requireSession(request);

  if (!isUuid(orgId)) {
    throw notFound('Organization not found');
  }

  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!organization) {
    throw notFound('Organization not found');
  }

  const [membership] = await db
    .select({ role: orgMembers.role })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.walletPublicKey, walletPublicKey)))
    .limit(1);

  if (!membership || !isOrgRole(membership.role)) {
    throw forbidden('Your wallet is not a member of this organization');
  }

  if (requiredRole && !ROLE_SATISFIES[requiredRole].includes(membership.role)) {
    throw forbidden(`This action requires the ${requiredRole} role`);
  }

  return { orgId, role: membership.role, walletPublicKey };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Guards the org id before it reaches Postgres. Drizzle would otherwise send a
 * non-uuid straight into a `uuid` comparison, which Postgres rejects with a
 * driver error that would surface as a 500 instead of a 404.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
