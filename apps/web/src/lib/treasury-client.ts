'use client';

import type { TreasuryState } from '@AfriWage/sdk';
import type { Organization } from './org-client';
import { apiFetch } from './api-client';
import { signTransaction } from './freighter';

/**
 * Client half of the treasury flows.
 *
 * Every one of these follows the same shape the existing payment client uses:
 * the server builds unsigned XDR, Freighter signs it, the server submits it.
 * No treasury key ever reaches the server.
 */

export function fetchTreasuryState(orgId: string): Promise<{ treasury: TreasuryState | null }> {
  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}/treasury`);
}

/** Signs an unsigned XDR and submits it through the Soroban RPC. */
async function signAndSubmit(unsignedXdr: string): Promise<string> {
  const signedXdr = await signTransaction(unsignedXdr);
  const { hash } = await apiFetch<{ hash: string }>('/api/submit-soroban-tx', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  });

  return hash;
}

interface RecordTreasuryResponse {
  organization: Organization | null;
  pending: boolean;
}

/**
 * Provisions the org's treasury end to end.
 *
 * `deploy_treasury` returns an org id rather than an address, and the RPC needs
 * a moment to see the submitted transaction, so the final step polls until the
 * server can resolve the deployed address from the transaction result.
 */
export async function provisionTreasuryViaFreighter(
  orgId: string,
  threshold?: number
): Promise<Organization> {
  const { xdr } = await apiFetch<{ xdr: string }>(
    `/api/orgs/${encodeURIComponent(orgId)}/treasury/provision`,
    { method: 'POST', body: JSON.stringify(threshold === undefined ? {} : { threshold }) }
  );

  const hash = await signAndSubmit(xdr);

  return pollForDeployedTreasury(orgId, hash);
}

/** Attempts and the delay between them while waiting for the RPC to catch up. */
const DEPLOYMENT_POLL_ATTEMPTS = 12;
const DEPLOYMENT_POLL_INTERVAL_MS = 2500;

async function pollForDeployedTreasury(orgId: string, hash: string): Promise<Organization> {
  for (let attempt = 0; attempt < DEPLOYMENT_POLL_ATTEMPTS; attempt++) {
    const result = await apiFetch<RecordTreasuryResponse>(
      `/api/orgs/${encodeURIComponent(orgId)}/treasury`,
      { method: 'POST', body: JSON.stringify({ transactionHash: hash }) }
    );

    if (!result.pending && result.organization) {
      return result.organization;
    }

    await new Promise((resolve) => setTimeout(resolve, DEPLOYMENT_POLL_INTERVAL_MS));
  }

  throw new Error(
    `The treasury transaction ${hash} was submitted but has not confirmed yet. Reopen this organization shortly to finish recording it.`
  );
}

export async function createBudgetCategoryViaFreighter(
  orgId: string,
  body: { name: string; capAmount: string }
): Promise<string> {
  const { xdr } = await apiFetch<{ xdr: string }>(
    `/api/orgs/${encodeURIComponent(orgId)}/treasury/categories`,
    { method: 'POST', body: JSON.stringify(body) }
  );

  return signAndSubmit(xdr);
}
