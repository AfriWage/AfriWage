import { db, orgMembers } from '@AfriWage/db';
import { and, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { badRequest, conflict, errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import { parseAddMember } from '@/lib/org-validation';
import { requireOrg } from '@/lib/require-org';

/** Lists the wallets that belong to an organization. Any member may read. */
export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId);

    const members = await db
      .select({
        id: orgMembers.id,
        walletPublicKey: orgMembers.walletPublicKey,
        role: orgMembers.role,
        createdAt: orgMembers.createdAt,
      })
      .from(orgMembers)
      .where(eq(orgMembers.orgId, orgId));

    return NextResponse.json({ members });
  } catch (error) {
    return errorResponse(error, 'Failed to list organization members');
  }
}

/**
 * Adds a member, or changes an existing member's role. Owner only.
 *
 * Adding a `payer` here does not authorise that wallet on the org's Charter
 * treasury instance — Charter's approver set is changed on-chain by the
 * treasury admin. The two are kept in step deliberately rather than
 * automatically, because only the admin's own signature can change the
 * on-chain set.
 */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId, 'owner');
    const input = parseAddMember(await readJsonBody(request));

    const [member] = await db
      .insert(orgMembers)
      .values({
        orgId,
        walletPublicKey: input.walletPublicKey,
        role: input.role,
      })
      .onConflictDoUpdate({
        target: [orgMembers.orgId, orgMembers.walletPublicKey],
        set: { role: input.role },
      })
      .returning();

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to add organization member');
  }
}

/**
 * Removes a member. Owner only.
 *
 * Removing the last owner is refused: the organization would keep its
 * employees, payroll history and treasury address but have nobody able to
 * manage members or provision a treasury, and there is no recovery path.
 */
export async function DELETE(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId, 'owner');

    const walletPublicKey = new URL(request.url).searchParams.get('walletPublicKey');

    if (!walletPublicKey) {
      throw badRequest('walletPublicKey query parameter is required');
    }

    const [target] = await db
      .select({ role: orgMembers.role })
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.walletPublicKey, walletPublicKey)))
      .limit(1);

    if (!target) {
      throw notFound('That wallet is not a member of this organization');
    }

    if (target.role === 'owner') {
      const otherOwners = await db
        .select({ id: orgMembers.id })
        .from(orgMembers)
        .where(
          and(
            eq(orgMembers.orgId, orgId),
            eq(orgMembers.role, 'owner'),
            ne(orgMembers.walletPublicKey, walletPublicKey)
          )
        )
        .limit(1);

      if (otherOwners.length === 0) {
        throw conflict('An organization must keep at least one owner');
      }
    }

    await db
      .delete(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.walletPublicKey, walletPublicKey)));

    return NextResponse.json({ removed: walletPublicKey });
  } catch (error) {
    return errorResponse(error, 'Failed to remove organization member');
  }
}
