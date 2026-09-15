import { db, employees } from '@AfriWage/db';
import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import { parseCreateEmployee, parseUpdateEmployee } from '@/lib/org-validation';
import { requireOrg } from '@/lib/require-org';

/**
 * Lists an organization's employees.
 *
 * Any member may read the roster; only admins and owners may change it. Pass
 * `?active=true` to see only payable employees, which is what the payroll run
 * builder uses.
 */
export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId);

    const activeOnly = new URL(request.url).searchParams.get('active') === 'true';
    const scope = activeOnly
      ? and(eq(employees.orgId, orgId), eq(employees.active, true))
      : eq(employees.orgId, orgId);

    const rows = await db
      .select()
      .from(employees)
      .where(scope)
      .orderBy(asc(employees.createdAt), asc(employees.id));

    return NextResponse.json({ employees: rows });
  } catch (error) {
    return errorResponse(error, 'Failed to list employees');
  }
}

/** Adds an employee to the organization. Admins and owners only. */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId, 'admin');
    const input = parseCreateEmployee(await readJsonBody(request));

    const [employee] = await db
      .insert(employees)
      .values({
        orgId,
        name: input.name,
        stellarPublicKey: input.stellarPublicKey,
        wageAmount: input.wageAmount,
        wageCurrency: input.wageCurrency,
        payoutOfframpCurrency: input.payoutOfframpCurrency,
      })
      .returning();

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create employee');
  }
}

/**
 * Updates an employee. Admins and owners only.
 *
 * The `orgId` in the URL is part of the update predicate, so an id belonging to
 * another tenant matches no row and returns 404 rather than crossing the tenant
 * boundary.
 *
 * Employees are deactivated via `active: false`, never deleted — payroll run
 * items reference them, and a settled run has to stay readable.
 */
export async function PATCH(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId, 'admin');
    const { id, ...changes } = parseUpdateEmployee(await readJsonBody(request));

    const [employee] = await db
      .update(employees)
      .set(changes)
      .where(and(eq(employees.id, id), eq(employees.orgId, orgId)))
      .returning();

    if (!employee) {
      throw notFound('Employee not found in this organization');
    }

    return NextResponse.json({ employee });
  } catch (error) {
    return errorResponse(error, 'Failed to update employee');
  }
}
