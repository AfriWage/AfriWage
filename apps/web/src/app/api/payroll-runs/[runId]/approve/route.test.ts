import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';
import { stubServerEnv } from '@/test/env-stub';

const PAYER = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const RUN_ID = '8f7e6d5c-4b3a-4291-8f7e-6d5c4b3a2918';
const TREASURY_ID = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';

const drizzle = createDrizzleDouble();

const { mockRequireRun, mockApprovePayout, mockGetPayoutRequest } = vi.hoisted(() => ({
  mockRequireRun: vi.fn(),
  mockApprovePayout: vi.fn(),
  mockGetPayoutRequest: vi.fn(),
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
  return { ...actual, approvePayout: mockApprovePayout, getPayoutRequest: mockGetPayoutRequest };
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
    role: 'payer',
    walletPublicKey: PAYER,
    status: 'pending_approval',
    totalAmount: '350.7500000',
    charterRequestId: '42',
    ...overrides,
  };
}

function charterRequest(status: string) {
  return {
    id: 42,
    categoryId: 1,
    recipient: PAYER,
    amount: '350.7500000',
    memo: 'payroll:8f7e6d5c',
    requester: PAYER,
    approvals: [PAYER],
    status,
    createdLedger: 900,
  };
}

beforeEach(() => {
  drizzle.reset();
  mockRequireRun.mockReset();
  mockApprovePayout.mockReset();
  mockGetPayoutRequest.mockReset();
  mockRequireRun.mockResolvedValue(runContext());
  mockApprovePayout.mockResolvedValue('unsigned-approval-xdr');
});

const params = { params: { runId: RUN_ID } };

function post(body: unknown = {}): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/payroll-runs/x/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe('POST /api/payroll-runs/[runId]/approve — build phase', () => {
  it('returns the unsigned approval for this payer', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      xdr: 'unsigned-approval-xdr',
      status: 'pending_approval',
    });
    expect(mockApprovePayout).toHaveBeenCalledWith(
      { treasuryContractId: TREASURY_ID, approver: PAYER, requestId: 42 },
      expect.anything()
    );
  });

  it('requires the payer role literally, so an owner cannot stand in', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);

    await post();

    expect(mockRequireRun).toHaveBeenCalledWith(expect.any(Request), RUN_ID, 'payer');
  });

  it('refuses a run that has not been submitted', async () => {
    mockRequireRun.mockResolvedValue(runContext({ status: 'draft' }));

    const response = await post();

    expect(response.status).toBe(409);
    expect(mockApprovePayout).not.toHaveBeenCalled();
  });

  it('refuses a run with no Charter request behind it', async () => {
    mockRequireRun.mockResolvedValue(runContext({ charterRequestId: null }));

    expect((await post()).status).toBe(409);
  });
});

describe('POST /api/payroll-runs/[runId]/approve — sync phase', () => {
  it('advances the run once Charter reports the request executed', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }], [{ id: RUN_ID, status: 'approved' }]);
    mockGetPayoutRequest.mockResolvedValue(charterRequest('Executed'));

    const response = await post({ sync: true });

    expect(response.status).toBe(200);
    expect(firstCall(drizzle.calls, 'set')?.[0]).toEqual({ status: 'approved' });
  });

  it('leaves the run pending while approvals are still outstanding', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockGetPayoutRequest.mockResolvedValue(charterRequest('Pending'));

    const response = await post({ sync: true });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ approvalsRemaining: true, payrollRun: null });
    expect(drizzle.calls.some((call) => call.method === 'update')).toBe(false);
  });

  it.each([['Rejected'], ['Cancelled']])(
    'fails the run when Charter reports %s',
    async (status) => {
      drizzle.queue([{ treasuryContractId: TREASURY_ID }], [{ id: RUN_ID, status: 'failed' }]);
      mockGetPayoutRequest.mockResolvedValue(charterRequest(status));

      const response = await post({ sync: true });

      expect(response.status).toBe(200);
      expect(firstCall(drizzle.calls, 'set')?.[0]).toEqual({ status: 'failed' });
    }
  );

  it('reads the contract rather than counting approvals itself', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockGetPayoutRequest.mockResolvedValue(charterRequest('Pending'));

    await post({ sync: true });

    expect(mockGetPayoutRequest).toHaveBeenCalledWith(TREASURY_ID, 42, expect.anything());
  });

  it('does not build an approval transaction during a sync', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockGetPayoutRequest.mockResolvedValue(charterRequest('Pending'));

    await post({ sync: true });

    expect(mockApprovePayout).not.toHaveBeenCalled();
  });
});
