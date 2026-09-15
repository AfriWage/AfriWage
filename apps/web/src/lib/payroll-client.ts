'use client';

import { apiFetch } from './api-client';
import { signTransaction } from './freighter';
import type { PayrollStatus } from './payroll-state';

/**
 * Client half of the payroll run flows.
 *
 * Submit, approve and execute are each build-sign-submit round trips: the
 * server builds unsigned XDR, Freighter signs it, and the server records the
 * confirmed result. No treasury key ever reaches the server.
 */

export interface PayrollRun {
  id: string;
  orgId: string;
  status: PayrollStatus;
  totalAmount: string;
  createdBy: string;
  charterRequestId: string | null;
  createdAt: string | null;
  executedAt: string | null;
}

export interface PayrollRunItem {
  id: string;
  employeeId: string;
  employeeName: string;
  stellarPublicKey: string;
  payoutOfframpCurrency: string | null;
  amount: string;
  onchainTxHash: string | null;
  offrampStatus: string | null;
  offrampAnchorTxId: string | null;
  settledAt: string | null;
}

export async function listPayrollRuns(orgId: string): Promise<PayrollRun[]> {
  const { payrollRuns } = await apiFetch<{ payrollRuns: PayrollRun[] }>(
    `/api/orgs/${encodeURIComponent(orgId)}/payroll-runs`
  );
  return payrollRuns;
}

export function getPayrollRun(
  runId: string
): Promise<{ payrollRun: PayrollRun; items: PayrollRunItem[] }> {
  return apiFetch(`/api/payroll-runs/${encodeURIComponent(runId)}`);
}

export interface CreatePayrollRunBody {
  fromActiveEmployees?: true;
  items?: { employeeId: string; amount?: string }[];
}

export async function createPayrollRun(
  orgId: string,
  body: CreatePayrollRunBody
): Promise<PayrollRun> {
  const { payrollRun } = await apiFetch<{ payrollRun: PayrollRun }>(
    `/api/orgs/${encodeURIComponent(orgId)}/payroll-runs`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return payrollRun;
}

async function signAndSubmitSoroban(unsignedXdr: string): Promise<string> {
  const signedXdr = await signTransaction(unsignedXdr);
  const { hash } = await apiFetch<{ hash: string }>('/api/submit-soroban-tx', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  });

  return hash;
}

/** Retries a step that waits on the RPC catching up with a submitted transaction. */
const CONFIRM_ATTEMPTS = 12;
const CONFIRM_INTERVAL_MS = 2500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submits a run for approval: builds the Charter spend request, signs it, then
 * polls until the server can read the request id out of the transaction.
 */
export async function submitPayrollRun(runId: string, categoryId: number): Promise<PayrollRun> {
  const { xdr } = await apiFetch<{ xdr: string }>(
    `/api/payroll-runs/${encodeURIComponent(runId)}/submit`,
    { method: 'POST', body: JSON.stringify({ categoryId }) }
  );

  const transactionHash = await signAndSubmitSoroban(xdr);

  for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt++) {
    const result = await apiFetch<{ payrollRun: PayrollRun | null; pending?: boolean }>(
      `/api/payroll-runs/${encodeURIComponent(runId)}/submit`,
      { method: 'POST', body: JSON.stringify({ transactionHash }) }
    );

    if (result.payrollRun) {
      return result.payrollRun;
    }

    await wait(CONFIRM_INTERVAL_MS);
  }

  throw new Error(
    `The spend request ${transactionHash} was submitted but has not confirmed yet. Reopen this run shortly.`
  );
}

export interface ApproveResult {
  payrollRun: PayrollRun | null;
  approvalsRemaining?: boolean;
}

/**
 * Approves a run and then asks the server to resync from Charter.
 *
 * The resync is separate because Charter executes the payout inside whichever
 * approval meets the threshold — this approval may or may not be that one, and
 * the contract is what decides.
 */
export async function approvePayrollRun(runId: string): Promise<ApproveResult> {
  const { xdr } = await apiFetch<{ xdr: string }>(
    `/api/payroll-runs/${encodeURIComponent(runId)}/approve`,
    { method: 'POST', body: JSON.stringify({}) }
  );

  await signAndSubmitSoroban(xdr);

  return apiFetch<ApproveResult>(`/api/payroll-runs/${encodeURIComponent(runId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ sync: true }),
  });
}

/**
 * Pays the workers.
 *
 * The fan-out is built by the existing `/api/build-payment` route — the same
 * multi-operation builder the ad-hoc batch screen uses — and submitted through
 * Horizon via `/api/submit-tx`. Only the recording step is payroll-specific.
 */
export async function executePayrollRun(
  runId: string,
  senderPublicKey: string,
  items: PayrollRunItem[]
): Promise<PayrollRun> {
  const { xdr } = await apiFetch<{ xdr: string }>('/api/build-payment', {
    method: 'POST',
    body: JSON.stringify({
      senderPublicKey,
      payments: items.map((item) => ({
        recipientPublicKey: item.stellarPublicKey,
        amount: item.amount,
      })),
      memo: `payroll:${runId.slice(0, 8)}`,
    }),
  });

  const signedXdr = await signTransaction(xdr);

  const { hash } = await apiFetch<{ hash: string }>('/api/submit-tx', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  });

  const { payrollRun } = await apiFetch<{ payrollRun: PayrollRun }>(
    `/api/payroll-runs/${encodeURIComponent(runId)}/execute`,
    { method: 'POST', body: JSON.stringify({ transactionHash: hash }) }
  );

  return payrollRun;
}

export interface OfframpStatusResult {
  status: PayrollStatus;
  checked: number;
}

export function refreshOfframpStatus(runId: string): Promise<OfframpStatusResult> {
  return apiFetch(`/api/payroll-runs/${encodeURIComponent(runId)}/offramp-status`, {
    method: 'POST',
  });
}

export function startOfframp(
  runId: string,
  body: { itemId: string; authToken: string }
): Promise<{ interactiveUrl: string }> {
  return apiFetch(`/api/payroll-runs/${encodeURIComponent(runId)}/offramp`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
