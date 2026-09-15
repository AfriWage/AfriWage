import { db, employees, payrollRunItems, payrollRuns } from '@AfriWage/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { badRequest, conflict, errorResponse, readJsonBody } from '@/lib/api-errors';
import { sumWageAmounts } from '@/lib/payroll-state';
import { parseCreatePayrollRun } from '@/lib/payroll-validation';
import { requireOrg } from '@/lib/require-org';

/** Lists an organization's payroll runs, newest first. Any member may read. */
export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = await requireOrg(request, params.orgId);

    const runs = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.orgId, orgId))
      .orderBy(desc(payrollRuns.createdAt));

    return NextResponse.json({ payrollRuns: runs });
  } catch (error) {
    return errorResponse(error, 'Failed to list payroll runs');
  }
}

/**
 * Creates a draft payroll run. Admins and owners only.
 *
 * Either takes explicit `items` (employee id plus an override amount) or, with
 * `fromActiveEmployees`, builds one line per active employee at their stored
 * wage.
 *
 * Amounts are snapshotted onto the run at creation rather than read from the
 * employee at payout time. A wage change between drafting and settling must not
 * silently alter what a reviewer already approved.
 */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const { orgId, walletPublicKey } = await requireOrg(request, params.orgId, 'admin');
    const input = parseCreatePayrollRun(await readJsonBody(request));

    const lines = input.fromActiveEmployees
      ? await linesFromActiveEmployees(orgId)
      : await linesFromExplicitItems(orgId, input.items);

    if (lines.length === 0) {
      throw conflict('A payroll run needs at least one active employee');
    }

    const totalAmount = sumWageAmounts(lines.map((line) => line.amount));

    const run = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(payrollRuns)
        .values({ orgId, status: 'draft', totalAmount, createdBy: walletPublicKey })
        .returning();

      await tx.insert(payrollRunItems).values(
        lines.map((line) => ({
          payrollRunId: created.id,
          employeeId: line.employeeId,
          amount: line.amount,
        }))
      );

      return created;
    });

    return NextResponse.json({ payrollRun: run, itemCount: lines.length }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create the payroll run');
  }
}

interface RunLine {
  employeeId: string;
  amount: string;
}

async function linesFromActiveEmployees(orgId: string): Promise<RunLine[]> {
  const rows = await db
    .select({ id: employees.id, wageAmount: employees.wageAmount })
    .from(employees)
    .where(and(eq(employees.orgId, orgId), eq(employees.active, true)));

  return rows.map((row) => ({ employeeId: row.id, amount: row.wageAmount }));
}

/**
 * Resolves explicit line items, defaulting each amount to the employee's stored
 * wage.
 *
 * The employee lookup is scoped to this organization and every requested id
 * must come back, so an id belonging to another tenant fails the whole request
 * rather than being silently dropped from the run.
 */
async function linesFromExplicitItems(
  orgId: string,
  items: { employeeId: string; amount?: string }[]
): Promise<RunLine[]> {
  const requestedIds = items.map((item) => item.employeeId);

  const rows = await db
    .select({ id: employees.id, wageAmount: employees.wageAmount, active: employees.active })
    .from(employees)
    .where(and(eq(employees.orgId, orgId), inArray(employees.id, requestedIds)));

  const byId = new Map(rows.map((row) => [row.id, row]));

  return items.map((item) => {
    const employee = byId.get(item.employeeId);

    if (!employee) {
      throw badRequest(`Employee ${item.employeeId} is not in this organization`);
    }

    if (!employee.active) {
      throw badRequest(`Employee ${item.employeeId} is deactivated and cannot be paid`);
    }

    return { employeeId: item.employeeId, amount: item.amount ?? employee.wageAmount };
  });
}
