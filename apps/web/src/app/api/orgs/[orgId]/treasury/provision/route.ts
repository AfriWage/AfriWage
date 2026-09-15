import { db, orgMembers, organizations } from '@AfriWage/db';
import { CharterError, provisionTreasury } from '@AfriWage/sdk';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { badRequest, conflict, errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import {
  charterConfig,
  charterFactoryContractId,
  factoryDeployerKeypair,
  treasuryTokenContractId,
} from '@/lib/charter-config';
import { requireOrg } from '@/lib/require-org';

/**
 * Builds the unsigned transaction that deploys this organization's Charter
 * treasury. Owner only.
 *
 * The approver set comes from the org's `payer` members, which is what keeps
 * AfriWage's role model and Charter's on-chain approver set in step: after this
 * deploys, a `payer` here is an approver there.
 *
 * Nothing is signed by an org key on the server. The returned XDR is sourced by
 * the owner's wallet and carries the factory's deployer authorization entry
 * already signed — Charter's factory is permissioned and requires it. See
 * docs/charter-treasury.md.
 */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId, walletPublicKey } = await requireOrg(request, params.orgId, 'owner');
    const body = (await readJsonBody(request)) as { threshold?: unknown };

    const [organization] = await db
      .select({ name: organizations.name, treasuryContractId: organizations.treasuryContractId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!organization) {
      throw notFound('Organization not found');
    }

    if (organization.treasuryContractId) {
      throw conflict('This organization already has a treasury');
    }

    const payers = await db
      .select({ walletPublicKey: orgMembers.walletPublicKey })
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, 'payer')));

    const approvers = payers.map((payer) => payer.walletPublicKey);

    if (approvers.length === 0) {
      throw conflict(
        'Add at least one payer member before provisioning — payers become the treasury approvers'
      );
    }

    const threshold = parseThreshold(body.threshold, approvers.length);

    const { xdr } = await provisionTreasury(
      {
        factoryContractId: charterFactoryContractId(),
        name: organization.name,
        admin: walletPublicKey,
        approvers,
        threshold,
        tokenContractId: treasuryTokenContractId(),
        deployerKeypair: factoryDeployerKeypair(),
      },
      charterConfig()
    );

    return NextResponse.json({ xdr, approvers, threshold });
  } catch (error) {
    if (error instanceof CharterError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return errorResponse(error, 'Failed to build the treasury provisioning transaction');
  }
}

/**
 * Defaults the threshold to unanimous approval.
 *
 * A treasury that pays out on one signature is the same trust model as the
 * ad-hoc `/batch` flow, so opting into a lower threshold should be explicit.
 */
function parseThreshold(value: unknown, approverCount: number): number {
  if (value === undefined || value === null) {
    return approverCount;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw badRequest('threshold must be a positive integer');
  }

  if (value > approverCount) {
    throw badRequest(`threshold cannot exceed the ${approverCount} payer member(s)`);
  }

  return value;
}
