import { db, organizations } from '@AfriWage/db';
import { CharterError, getOrgRecord, getTreasuryState, readDeployedOrgId } from '@AfriWage/sdk';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { badRequest, errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import { charterConfig, charterFactoryContractId } from '@/lib/charter-config';
import { requireOrg } from '@/lib/require-org';

/**
 * Reads the organization's treasury state from chain. Any member may read.
 *
 * Answers 200 with `treasury: null` when none is provisioned — that is a normal
 * state for a new organization, not an error.
 */
export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId);

    const [organization] = await db
      .select({ treasuryContractId: organizations.treasuryContractId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!organization) {
      throw notFound('Organization not found');
    }

    if (!organization.treasuryContractId) {
      return NextResponse.json({ treasury: null });
    }

    const treasury = await getTreasuryState(organization.treasuryContractId, charterConfig());

    return NextResponse.json({ treasury });
  } catch (error) {
    if (error instanceof CharterError) {
      // The organization and its stored address are fine; the chain read is
      // what failed, so this is an upstream problem rather than a bad request.
      return NextResponse.json({ message: error.message }, { status: 502 });
    }

    return errorResponse(error, 'Failed to read the treasury state');
  }
}

/**
 * Records the treasury deployed by a submitted provisioning transaction. Owner only.
 *
 * The address is never taken from the request body. It is resolved from the
 * transaction's own return value — `deploy_treasury` returns the new org id —
 * and then read back out of Charter's public registry, so a caller cannot point
 * their organization at a contract they do not control.
 */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId, 'owner');
    const { transactionHash } = parseRecordTreasuryBody(await readJsonBody(request));

    const config = charterConfig();
    const charterOrgId = await readDeployedOrgId(transactionHash, config);

    if (charterOrgId === null) {
      // Soroban RPC has not caught up with the submitted transaction yet. 202
      // tells the client to poll rather than to retry the whole provisioning.
      return NextResponse.json({ organization: null, pending: true }, { status: 202 });
    }

    const record = await getOrgRecord(charterFactoryContractId(), charterOrgId, config);

    const [organization] = await db
      .update(organizations)
      .set({ treasuryContractId: record.treasury, charterOrgId: String(charterOrgId) })
      .where(eq(organizations.id, orgId))
      .returning();

    if (!organization) {
      throw notFound('Organization not found');
    }

    return NextResponse.json({ organization, pending: false });
  } catch (error) {
    if (error instanceof CharterError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return errorResponse(error, 'Failed to record the deployed treasury');
  }
}

function parseRecordTreasuryBody(body: unknown): { transactionHash: string } {
  if (typeof body !== 'object' || body === null) {
    throw badRequest('Request body must be an object');
  }

  const { transactionHash } = body as { transactionHash?: unknown };

  // Stellar transaction hashes are 32 bytes, hex-encoded.
  if (typeof transactionHash !== 'string' || !/^[0-9a-f]{64}$/i.test(transactionHash)) {
    throw badRequest('transactionHash must be a 64-character hex transaction hash');
  }

  return { transactionHash };
}
