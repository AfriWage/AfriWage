/**
 * Client for the Charter indexer's read-only REST API.
 *
 * The indexer (https://github.com/Ch-rter/app, `indexer/`) is a Go service that
 * folds Soroban contract events into Postgres read models and serves them over
 * HTTP. It is **not** a push/webhook source — it polls Soroban itself on an
 * interval — so it does not remove the need to poll; it makes each poll a cheap
 * REST read instead of a Soroban simulation, and it is the only way to read a
 * request's approval list without a contract call.
 *
 * It is optional. AfriWage works without it by simulating the contract's view
 * functions directly, and every read here has that fallback.
 *
 * Amounts arrive as decimal strings in the token's smallest unit, matching the
 * contract's `i128` exactly — the indexer stores them as `NUMERIC(30,0)` and
 * never lets them become a float. Callers scale them with `fromTokenUnits`.
 */

/** Raised when the indexer is reachable but cannot serve the request. */
export class CharterIndexerError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'CharterIndexerError';
  }

  /** True when the resource simply has not been ingested yet. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/** An organization as the indexer serves it. */
export interface IndexedOrg {
  id: number;
  name: string;
  treasuryAddress: string;
  adminAddress: string;
  createdLedger: number;
}

/** A budget category. `cap` and `spent` are raw token units. */
export interface IndexedCategory {
  categoryId: number;
  name: string;
  cap: string;
  spent: string;
  active: boolean;
}

/** A disbursement request with its current approvals. `amount` is raw units. */
export interface IndexedRequest {
  requestId: number;
  categoryId: number;
  recipient: string;
  amount: string;
  memo: string;
  requester: string;
  status: string;
  createdLedger: number;
  approvals: string[];
}

function join(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

async function getJson<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(join(baseUrl, path), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new CharterIndexerError(
      body.error ?? `Charter indexer returned HTTP ${response.status}`,
      response.status
    );
  }

  return (await response.json()) as T;
}

/** Liveness plus database reachability, for a startup or health check. */
export async function getIndexerHealth(baseUrl: string): Promise<{ status: string }> {
  return getJson<{ status: string }>(baseUrl, '/health');
}

export async function getIndexedOrg(baseUrl: string, treasury: string): Promise<IndexedOrg> {
  return getJson<IndexedOrg>(baseUrl, `/orgs/${encodeURIComponent(treasury)}`);
}

export async function listIndexedCategories(
  baseUrl: string,
  treasury: string
): Promise<IndexedCategory[]> {
  const { categories } = await getJson<{ categories: IndexedCategory[] | null }>(
    baseUrl,
    `/orgs/${encodeURIComponent(treasury)}/categories`
  );

  // The Go handler marshals an empty slice as null, so normalise it here rather
  // than making every caller guard against it.
  return categories ?? [];
}

export async function listIndexedRequests(
  baseUrl: string,
  treasury: string,
  status?: 'Pending' | 'Executed' | 'Rejected' | 'Cancelled'
): Promise<IndexedRequest[]> {
  const query = status ? `?status=${status}` : '';
  const { requests } = await getJson<{ requests: IndexedRequest[] | null }>(
    baseUrl,
    `/orgs/${encodeURIComponent(treasury)}/requests${query}`
  );

  return requests ?? [];
}

export async function getIndexedRequest(
  baseUrl: string,
  treasury: string,
  requestId: number
): Promise<IndexedRequest> {
  return getJson<IndexedRequest>(
    baseUrl,
    `/orgs/${encodeURIComponent(treasury)}/requests/${requestId}`
  );
}
