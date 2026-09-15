import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble } from '@/test/drizzle-double';
import { stubServerEnv } from '@/test/env-stub';

const MEMBER = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const RUN_ID = '8f7e6d5c-4b3a-4291-8f7e-6d5c4b3a2918';
const TX_HASH = 'd'.repeat(64);

const drizzle = createDrizzleDouble();

const { mockRequireRun, mockGetTransactionStatus } = vi.hoisted(() => ({
  mockRequireRun: vi.fn(),
  mockGetTransactionStatus: vi.fn(),
}));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  payrollRuns: { id: 'payroll_runs.id' },
  payrollRunItems: {
    id: 'payroll_run_items.id',
    payrollRunId: 'payroll_run_items.payroll_run_id',
    onchainTxHash: 'payroll_run_items.onchain_tx_hash',
    offrampStatus: 'payroll_run_items.offramp_status',
    offrampAnchorTxId: 'payroll_run_items.offramp_anchor_tx_id',
  },
}));

vi.mock('@AfriWage/sdk', async () => {
  const actual = await vi.importActual<typeof import('@AfriWage/sdk')>('@AfriWage/sdk');
  return { ...actual, getTransactionStatus: mockGetTransactionStatus };
});

vi.mock('@/lib/require-run', () => ({ requireRun: mockRequireRun }));

let route: typeof import('./route');

beforeAll(async () => {
  stubServerEnv();
  route = await import('./route');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  drizzle.reset();
  mockRequireRun.mockReset();
  mockGetTransactionStatus.mockReset();
  mockRequireRun.mockResolvedValue({
    runId: RUN_ID,
    orgId: ORG_ID,
    role: 'admin',
    walletPublicKey: MEMBER,
    status: 'executing',
    totalAmount: '350.7500000',
    charterRequestId: '42',
  });
});

const params = { params: { runId: RUN_ID } };

function post(): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/payroll-runs/x/offramp-status', { method: 'POST' }),
    params
  );
}

describe('mapAnchorStatus', () => {
  it('maps a completed withdrawal to complete', () => {
    expect(route.mapAnchorStatus('completed')).toBe('complete');
  });

  it.each([['error'], ['refunded'], ['expired']])('maps %s to failed', (status) => {
    expect(route.mapAnchorStatus(status)).toBe('failed');
  });

  it.each([
    ['pending_user_transfer_start'],
    ['pending_anchor'],
    ['pending_external'],
    ['incomplete'],
  ])('treats the intermediate state %s as pending', (status) => {
    expect(route.mapAnchorStatus(status)).toBe('pending');
  });

  it('treats an unfamiliar status as pending rather than paid', () => {
    expect(route.mapAnchorStatus('some_future_anchor_state')).toBe('pending');
  });
});

describe('POST /api/payroll-runs/[runId]/offramp-status', () => {
  it('writes a completed withdrawal back and settles the run', async () => {
    drizzle.queue(
      [{ id: 'item-1', offrampAnchorTxId: 'anchor-1' }],
      [],
      [{ onchainTxHash: TX_HASH, offrampStatus: 'complete' }],
      []
    );
    mockGetTransactionStatus.mockResolvedValue({ id: 'anchor-1', status: 'completed' });

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'settled', checked: 1 });
  });

  it('leaves a still-pending withdrawal untouched', async () => {
    drizzle.queue(
      [{ id: 'item-1', offrampAnchorTxId: 'anchor-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: 'pending' }]
    );
    mockGetTransactionStatus.mockResolvedValue({ id: 'anchor-1', status: 'pending_anchor' });

    const response = await post();

    expect((await response.json()).status).toBe('executing');
    expect(drizzle.calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('fails the run when the anchor reports an error', async () => {
    drizzle.queue(
      [{ id: 'item-1', offrampAnchorTxId: 'anchor-1' }],
      [],
      [{ onchainTxHash: TX_HASH, offrampStatus: 'failed' }],
      []
    );
    mockGetTransactionStatus.mockResolvedValue({ id: 'anchor-1', status: 'error' });

    expect((await post()).status).toBe(200);
    const statuses = drizzle.calls.filter((call) => call.method === 'set').map((c) => c.args[0]);
    expect(statuses).toContainEqual(expect.objectContaining({ offrampStatus: 'failed' }));
  });

  it('leaves an item pending when the anchor itself is unreachable', async () => {
    drizzle.queue(
      [{ id: 'item-1', offrampAnchorTxId: 'anchor-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: 'pending' }]
    );
    mockGetTransactionStatus.mockRejectedValue(new Error('anchor timeout'));

    const response = await post();

    expect(response.status).toBe(200);
    expect(drizzle.calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('does not move a run that is not executing', async () => {
    mockRequireRun.mockResolvedValue({
      runId: RUN_ID,
      orgId: ORG_ID,
      role: 'admin',
      walletPublicKey: MEMBER,
      status: 'settled',
      totalAmount: '1',
      charterRequestId: '42',
    });
    drizzle.queue([], [{ onchainTxHash: TX_HASH, offrampStatus: 'complete' }]);

    expect((await post()).status).toBe(200);
    expect((await (await post()).json()).status).toBe('settled');
  });

  it('is readable by any member, with no role requirement', async () => {
    drizzle.queue([], [{ onchainTxHash: TX_HASH, offrampStatus: 'complete' }]);

    await post();

    expect(mockRequireRun).toHaveBeenCalledWith(expect.any(Request), RUN_ID);
  });
});
