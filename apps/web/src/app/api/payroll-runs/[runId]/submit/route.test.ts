import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';
import { stubServerEnv } from '@/test/env-stub';

const ADMIN = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const RUN_ID = '8f7e6d5c-4b3a-4291-8f7e-6d5c4b3a2918';
const TREASURY_ID = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';
const TX_HASH = 'b'.repeat(64);

const drizzle = createDrizzleDouble();

const { mockRequireRun, mockRequestPayout, mockReadSubmittedRequestId } = vi.hoisted(() => ({
  mockRequireRun: vi.fn(),
  mockRequestPayout: vi.fn(),
  mockReadSubmittedRequestId: vi.fn(),
}));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  organizations: {
    id: 'organizations.id',
    treasuryContractId: 'organizations.treasury_contract_id',
  },
  payrollRuns: { id: 'payroll_runs.id' },
}));

vi.mock('@AfriWage/sdk', async () => {
  const actual = await vi.importActual<typeof import('@AfriWage/sdk')>('@AfriWage/sdk');
  return {
    ...actual,
    requestPayout: mockRequestPayout,
    readSubmittedRequestId: mockReadSubmittedRequestId,
  };
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

function runContext(overrides: Record<string, unknown> = {}) {
  return {
    runId: RUN_ID,
    orgId: ORG_ID,
    role: 'admin',
    walletPublicKey: ADMIN,
    status: 'draft',
    totalAmount: '350.7500000',
    charterRequestId: null,
    ...overrides,
  };
}

beforeEach(() => {
  drizzle.reset();
  mockRequireRun.mockReset();
  mockRequestPayout.mockReset();
  mockReadSubmittedRequestId.mockReset();
  mockRequireRun.mockResolvedValue(runContext());
  mockRequestPayout.mockResolvedValue('unsigned-xdr');
});

const params = { params: { runId: RUN_ID } };

function post(body: unknown): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/payroll-runs/x/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe('POST /api/payroll-runs/[runId]/submit — build phase', () => {
  it('returns the unsigned spend request for the run total', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);

    const response = await post({ categoryId: 1 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ xdr: 'unsigned-xdr', status: 'draft' });
    expect(mockRequestPayout).toHaveBeenCalledWith(
      expect.objectContaining({
        treasuryContractId: TREASURY_ID,
        requester: ADMIN,
        categoryId: 1,
        amount: '350.7500000',
      }),
      expect.anything()
    );
  });

  it('leaves the run a draft until the request is actually submitted', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);

    await post({ categoryId: 1 });

    expect(drizzle.calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('tags the on-chain memo with the run so it can be audited back', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);

    await post({ categoryId: 1 });

    expect(mockRequestPayout.mock.calls[0][0].memo).toBe(`payroll:${RUN_ID.slice(0, 8)}`);
  });

  it('refuses when the organization has no treasury', async () => {
    drizzle.queue([{ treasuryContractId: null }]);

    const response = await post({ categoryId: 1 });

    expect(response.status).toBe(409);
    expect(mockRequestPayout).not.toHaveBeenCalled();
  });

  it('refuses a run that is not a draft', async () => {
    mockRequireRun.mockResolvedValue(runContext({ status: 'pending_approval' }));

    const response = await post({ categoryId: 1 });

    expect(response.status).toBe(409);
    expect((await response.json()).message).toMatch(/pending_approval/);
  });

  it('refuses a settled run outright', async () => {
    mockRequireRun.mockResolvedValue(runContext({ status: 'settled' }));

    expect((await post({ categoryId: 1 })).status).toBe(409);
  });

  it('requires at least the admin role', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);

    await post({ categoryId: 1 });

    expect(mockRequireRun).toHaveBeenCalledWith(expect.any(Request), RUN_ID, 'admin');
  });
});

describe('POST /api/payroll-runs/[runId]/submit — record phase', () => {
  it('records the Charter request id and advances the run', async () => {
    drizzle.queue(
      [{ treasuryContractId: TREASURY_ID }],
      [{ id: RUN_ID, status: 'pending_approval', charterRequestId: '42' }]
    );
    mockReadSubmittedRequestId.mockResolvedValue(42);

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(200);
    expect(firstCall(drizzle.calls, 'set')?.[0]).toEqual({
      status: 'pending_approval',
      charterRequestId: '42',
    });
  });

  it('answers 202 while the RPC has not seen the transaction, leaving the draft alone', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockReadSubmittedRequestId.mockResolvedValue(null);

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ pending: true, status: 'draft' });
    expect(drizzle.calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('surfaces a failed on-chain submission as 400', async () => {
    const { CharterError } = await import('@AfriWage/sdk');
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockReadSubmittedRequestId.mockRejectedValue(new CharterError('Spend request did not succeed'));

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toMatch(/Spend request/);
  });

  it('rejects a malformed hash before reading anything', async () => {
    const response = await post({ transactionHash: 'nope' });

    expect(response.status).toBe(400);
    expect(mockReadSubmittedRequestId).not.toHaveBeenCalled();
  });
});
