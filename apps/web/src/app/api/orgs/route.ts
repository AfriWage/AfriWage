import { db, orgMembers, organizations } from '@AfriWage/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { errorResponse, readJsonBody } from '@/lib/api-errors';
import { parseCreateOrganization } from '@/lib/org-validation';
import { requireSession } from '@/lib/require-org';

/**
 * Organizations the authenticated wallet belongs to.
 *
 * The listing is driven from `org_members`, not from `organizations`, so a
 * wallet only ever sees tenants it is a member of.
 */
export async function GET(request: Request) {
  try {
    const { walletPublicKey } = requireSession(request);

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        treasuryContractId: organizations.treasuryContractId,
        charterOrgId: organizations.charterOrgId,
        defaultOfframpCurrency: organizations.defaultOfframpCurrency,
        createdAt: organizations.createdAt,
        role: orgMembers.role,
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
      .where(eq(orgMembers.walletPublicKey, walletPublicKey));

    return NextResponse.json({ organizations: rows });
  } catch (error) {
    return errorResponse(error, 'Failed to list organizations');
  }
}

/**
 * Creates an organization, making the authenticated wallet its owner.
 *
 * The org row and the owner membership are written in one transaction: an
 * organization with no members would be unreachable through `require-org.ts`
 * and could never be claimed afterwards.
 */
export async function POST(request: Request) {
  try {
    const { walletPublicKey } = requireSession(request);
    const input = parseCreateOrganization(await readJsonBody(request));

    const organization = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(organizations)
        .values({
          name: input.name,
          defaultOfframpCurrency: input.defaultOfframpCurrency,
        })
        .returning();

      await tx.insert(orgMembers).values({
        orgId: created.id,
        walletPublicKey,
        role: 'owner',
      });

      return created;
    });

    return NextResponse.json({ organization: { ...organization, role: 'owner' } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create organization');
  }
}
