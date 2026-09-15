import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';

const OWNER = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const TREASURY_ID = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';
const TX_HASH = 'a'.repeat(64);

const drizzle = createDrizzleDouble();

const { mockRequireOrg, mockGetTreasuryState, mockReadDeployedOrgId, mockGetOrgRecord } =
  vi.hoisted(() => ({
    mockRequireOrg: vi.fn(),
    mockGetTreasuryState: vi.fn(),
    mockReadDeployedOrgId: vi.fn(),
    mockGetOrgRecord: vi.fn(),
  }));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  organizations: {
    id: 'organizations.id',
    treasuryContractId: 'organizations.treasury_contract_id',
  },
}));

vi.mock('@AfriWage/sdk', async () => {
  const actual = await vi.importActual<typeof import('@AfriWage/sdk')>('@AfriWage/sdk');
  return {
    ...actual,
    getTreasuryState: mockGetTreasuryState,
    readDeployedOrgId: mockReadDeployedOrgId,
    getOrgRecord: mockGetOrgRecord,
  };
});

vi.mock('@/lib/require-org', async () => {
  const roles = await import('@/lib/org-roles');
  return { ...roles, requireOrg: mockRequireOrg };
});

let route: typeof import('./route');

beforeAll(async () => {
  stubServerEnv();
  vi.stubEnv(
    'CHARTER_FACTORY_CONTRACT_ID',
    'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4'
  );
  stubServerEnv();
  route = await import('./route');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  drizzle.reset();
  mockRequireOrg.mockReset();
  mockGetTreasuryState.mockReset();
  mockReadDeployedOrgId.mockReset();
  mockGetOrgRecord.mockReset();
  mockRequireOrg.mockResolvedValue({ orgId: ORG_ID, role: 'owner', walletPublicKey: OWNER });
});

const params = { params: { orgId: ORG_ID } };

function get(): Promise<Response> {
  return route.GET(new Request('http://localhost/api/orgs/x/treasury'), params);
}

function post(body: unknown): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/orgs/x/treasury', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe('GET /api/orgs/[orgId]/treasury', () => {
  it('returns the on-chain treasury state', async () => {
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockGetTreasuryState.mockResolvedValue({
      contractId: TREASURY_ID,
      balance: '500.0000000',
      threshold: 2,
      approvers: [],
      categories: [],
    });

    const response = await get();

    expect(response.status).toBe(200);
    expect((await response.json()).treasury.balance).toBe('500.0000000');
  });

  it('reports an unprovisioned treasury as null, not as an error', async () => {
    drizzle.queue([{ treasuryContractId: null }]);

    const response = await get();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ treasury: null });
    expect(mockGetTreasuryState).not.toHaveBeenCalled();
  });

  it('maps a failed chain read to 502, not 500 — the request itself was fine', async () => {
    const { CharterError } = await import('@AfriWage/sdk');
    drizzle.queue([{ treasuryContractId: TREASURY_ID }]);
    mockGetTreasuryState.mockRejectedValue(new CharterError('rpc unreachable'));

    expect((await get()).status).toBe(502);
  });

  it('is readable by any member, with no role requirement', async () => {
    drizzle.queue([{ treasuryContractId: null }]);

    await get();

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID);
  });
});

describe('POST /api/orgs/[orgId]/treasury', () => {
  it('resolves the address from the transaction result and the factory registry', async () => {
    mockReadDeployedOrgId.mockResolvedValue(7);
    mockGetOrgRecord.mockResolvedValue({
      name: 'Kano Logistics',
      treasury: TREASURY_ID,
      admin: OWNER,
      createdLedger: 500,
    });
    drizzle.queue([{ id: ORG_ID, treasuryContractId: TREASURY_ID }]);

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(200);
    expect(mockReadDeployedOrgId).toHaveBeenCalledWith(TX_HASH, expect.anything());
    expect(firstCall(drizzle.calls, 'set')?.[0]).toEqual({
      treasuryContractId: TREASURY_ID,
      charterOrgId: '7',
    });
  });

  it('never takes the treasury address from the request body', async () => {
    mockReadDeployedOrgId.mockResolvedValue(7);
    mockGetOrgRecord.mockResolvedValue({
      name: 'Org',
      treasury: TREASURY_ID,
      admin: OWNER,
      createdLedger: 1,
    });
    drizzle.queue([{ id: ORG_ID }]);

    await post({
      transactionHash: TX_HASH,
      treasuryContractId: 'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4',
    });

    expect(firstCall(drizzle.calls, 'set')?.[0]).toMatchObject({
      treasuryContractId: TREASURY_ID,
    });
  });

  it('answers 202 while the RPC has not yet seen the transaction', async () => {
    mockReadDeployedOrgId.mockResolvedValue(null);

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ organization: null, pending: true });
    expect(drizzle.calls).toHaveLength(0);
  });

  it.each([
    [{}, 'a missing hash'],
    [{ transactionHash: 'too-short' }, 'a malformed hash'],
    [{ transactionHash: 123 }, 'a non-string hash'],
  ])('rejects %j (%s) with 400', async (body, _description) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(mockReadDeployedOrgId).not.toHaveBeenCalled();
  });

  it('requires the owner role', async () => {
    mockReadDeployedOrgId.mockResolvedValue(null);

    await post({ transactionHash: TX_HASH });

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID, 'owner');
  });

  it('surfaces a failed deployment as a 400 naming the reason', async () => {
    const { CharterError } = await import('@AfriWage/sdk');
    mockReadDeployedOrgId.mockRejectedValue(new CharterError('deployment did not succeed'));

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toMatch(/did not succeed/);
  });
});
