import { db, organizations } from '@AfriWage/db';
import { CharterError, createSpendCategory } from '@AfriWage/sdk';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { badRequest, conflict, errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import { charterConfig } from '@/lib/charter-config';
import { requireOrg } from '@/lib/require-org';

/**
 * Builds the unsigned transaction creating a budget category with a lifetime
 * spend cap. Admins and owners only.
 *
 * Charter requires the treasury's `admin` to authorise this, so the returned
 * XDR is only signable by the wallet that provisioned the treasury. A non-admin
 * org admin will see Charter's `NotAdmin` error at simulation time rather than
 * a confusing signing failure.
 */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId, walletPublicKey } = await requireOrg(request, params.orgId, 'admin');
    const { name, capAmount } = parseCreateCategoryBody(await readJsonBody(request));

    const [organization] = await db
      .select({ treasuryContractId: organizations.treasuryContractId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!organization) {
      throw notFound('Organization not found');
    }

    if (!organization.treasuryContractId) {
      throw conflict('Provision a treasury before creating budget categories');
    }

    const xdr = await createSpendCategory(
      {
        treasuryContractId: organization.treasuryContractId,
        admin: walletPublicKey,
        name,
        capAmount,
      },
      charterConfig()
    );

    return NextResponse.json({ xdr });
  } catch (error) {
    if (error instanceof CharterError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return errorResponse(error, 'Failed to build the budget category transaction');
  }
}

function parseCreateCategoryBody(body: unknown): { name: string; capAmount: string } {
  if (typeof body !== 'object' || body === null) {
    throw badRequest('Request body must be an object');
  }

  const { name, capAmount } = body as { name?: unknown; capAmount?: unknown };

  if (typeof name !== 'string' || name.trim() === '' || name.length > 120) {
    throw badRequest('name must be between 1 and 120 characters');
  }

  if (typeof capAmount !== 'string' || !/^\d+(\.\d{1,7})?$/.test(capAmount)) {
    throw badRequest('capAmount must be a positive number with up to 7 decimal places');
  }

  return { name: name.trim(), capAmount };
}
