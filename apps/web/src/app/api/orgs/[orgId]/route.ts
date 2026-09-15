import { db, organizations } from '@AfriWage/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { errorResponse, notFound } from '@/lib/api-errors';
import { requireOrg } from '@/lib/require-org';

/** Returns one organization, including the caller's role in it. */
export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId, role } = await requireOrg(request, params.orgId);

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!organization) {
      throw notFound('Organization not found');
    }

    return NextResponse.json({ organization: { ...organization, role } });
  } catch (error) {
    return errorResponse(error, 'Failed to load organization');
  }
}
