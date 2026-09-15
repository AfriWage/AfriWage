import { db, payrollRuns } from '@AfriWage/db';
import { eq } from 'drizzle-orm';
import { notFound } from './api-errors';
import { type PayrollStatus, isPayrollStatus } from './payroll-state';
import { type OrgRole, isUuid, requireOrg } from './require-org';

/**
 * Authorisation for the run-scoped routes.
 *
 * A payroll run is addressed by its own id rather than nested under its
 * organization, so the org has to be resolved from the run before membership
 * can be checked. Doing that here keeps every run route from re-deriving it —
 * and from forgetting to.
 */

export interface RunContext {
  runId: string;
  orgId: string;
  role: OrgRole;
  walletPublicKey: string;
  status: PayrollStatus;
  totalAmount: string;
  charterRequestId: string | null;
}

export async function requireRun(
  request: Request,
  runId: string,
  requiredRole?: OrgRole
): Promise<RunContext> {
  if (!isUuid(runId)) {
    throw notFound('Payroll run not found');
  }

  const [run] = await db
    .select({
      id: payrollRuns.id,
      orgId: payrollRuns.orgId,
      status: payrollRuns.status,
      totalAmount: payrollRuns.totalAmount,
      charterRequestId: payrollRuns.charterRequestId,
    })
    .from(payrollRuns)
    .where(eq(payrollRuns.id, runId))
    .limit(1);

  if (!run) {
    throw notFound('Payroll run not found');
  }

  // Membership is checked against the run's own org, so a run id from another
  // tenant is a 403 rather than a readable record.
  const { orgId, role, walletPublicKey } = await requireOrg(request, run.orgId, requiredRole);

  if (!isPayrollStatus(run.status)) {
    throw notFound('Payroll run is in an unrecognised state');
  }

  return {
    runId: run.id,
    orgId,
    role,
    walletPublicKey,
    status: run.status,
    totalAmount: run.totalAmount,
    charterRequestId: run.charterRequestId,
  };
}
