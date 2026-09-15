import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble } from '@/test/drizzle-double';

const OWNER = Keypair.random().publicKey();
const PAYER_ONE = Keypair.random().publicKey();
const PAYER_TWO = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';

const drizzle = createDrizzleDouble();

const { mockRequireOrg, mockProvisionTreasury } = vi.hoisted(() => ({
  mockRequireOrg: vi.fn(),
  mockProvisionTreasury: vi.fn(),
}));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  organizations: {
    id: 'organizations.id',
    name: 'organizations.name',
    treasuryContractId: 'organizations.treasury_contract_id',
  },
  orgMembers: {
    orgId: 'org_members.org_id',
    role: 'org_members.role',
    walletPublicKey: 'org_members.wallet_public_key',
  },
}));

vi.mock('@AfriWage/sdk', async () => {
  const actual = await vi.importActual<typeof import('@AfriWage/sdk')>('@AfriWage/sdk');
  return { ...actual, provisionTreasury: mockProvisionTreasury };
});

vi.mock('@/lib/require-org', async () => {
  const roles = await import('@/lib/org-roles');
  return { ...roles, requireOrg: mockRequireOrg };
});

let route: typeof import('./route');

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('AUTH_SERVER_SIGNING_KEY', Keypair.random().secret());
  vi.stubEnv('JWT_SECRET', 'm'.repeat(32));
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', 'afriwage.test');
  vi.stubEnv(
    'CHARTER_FACTORY_CONTRACT_ID',
    'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4'
  );
  vi.stubEnv('CHARTER_FACTORY_DEPLOYER_SECRET_KEY', Keypair.random().secret());
  vi.stubEnv(
    'CHARTER_TREASURY_TOKEN_CONTRACT_ID',
    'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT'
  );
  route = await import('./route');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  drizzle.reset();
  mockRequireOrg.mockReset();
  mockProvisionTreasury.mockReset();
  mockRequireOrg.mockResolvedValue({ orgId: ORG_ID, role: 'owner', walletPublicKey: OWNER });
  mockProvisionTreasury.mockResolvedValue({ xdr: 'unsigned-xdr' });
});

const params = { params: { orgId: ORG_ID } };

function post(body: unknown = {}): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/orgs/x/treasury/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe('POST /api/orgs/[orgId]/treasury/provision', () => {
  it('builds the deploy transaction from the org’s payer members', async () => {
    drizzle.queue(
      [{ name: 'Kano Logistics', treasuryContractId: null }],
      [{ walletPublicKey: PAYER_ONE }, { walletPublicKey: PAYER_TWO }]
    );

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      xdr: 'unsigned-xdr',
      approvers: [PAYER_ONE, PAYER_TWO],
      threshold: 2,
    });

    expect(mockProvisionTreasury).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Kano Logistics',
        admin: OWNER,
        approvers: [PAYER_ONE, PAYER_TWO],
        threshold: 2,
      }),
      expect.anything()
    );
  });

  it('defaults to unanimous approval rather than a single signature', async () => {
    drizzle.queue(
      [{ name: 'Org', treasuryContractId: null }],
      [{ walletPublicKey: PAYER_ONE }, { walletPublicKey: PAYER_TWO }]
    );

    await post();

    expect(mockProvisionTreasury.mock.calls[0][0].threshold).toBe(2);
  });

  it('accepts a lower explicit threshold', async () => {
    drizzle.queue(
      [{ name: 'Org', treasuryContractId: null }],
      [{ walletPublicKey: PAYER_ONE }, { walletPublicKey: PAYER_TWO }]
    );

    await post({ threshold: 1 });

    expect(mockProvisionTreasury.mock.calls[0][0].threshold).toBe(1);
  });

  it('rejects a threshold above the payer count', async () => {
    drizzle.queue([{ name: 'Org', treasuryContractId: null }], [{ walletPublicKey: PAYER_ONE }]);

    const response = await post({ threshold: 5 });

    expect(response.status).toBe(400);
    expect(mockProvisionTreasury).not.toHaveBeenCalled();
  });

  it('refuses when the org has no payer members to approve payouts', async () => {
    drizzle.queue([{ name: 'Org', treasuryContractId: null }], []);

    const response = await post();

    expect(response.status).toBe(409);
    expect((await response.json()).message).toMatch(/payer member/);
    expect(mockProvisionTreasury).not.toHaveBeenCalled();
  });

  it('refuses to provision a second treasury for the same org', async () => {
    drizzle.queue([
      {
        name: 'Org',
        treasuryContractId: 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT',
      },
    ]);

    const response = await post();

    expect(response.status).toBe(409);
    expect(mockProvisionTreasury).not.toHaveBeenCalled();
  });

  it('requires the owner role', async () => {
    drizzle.queue([{ name: 'Org', treasuryContractId: null }], [{ walletPublicKey: PAYER_ONE }]);

    await post();

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID, 'owner');
  });

  it('surfaces a Charter simulation failure as a 400', async () => {
    const { CharterError } = await import('@AfriWage/sdk');
    drizzle.queue([{ name: 'Org', treasuryContractId: null }], [{ walletPublicKey: PAYER_ONE }]);
    mockProvisionTreasury.mockRejectedValue(new CharterError('factory not initialized'));

    const response = await post();

    expect(response.status).toBe(400);
    expect((await response.json()).message).toMatch(/factory not initialized/);
  });

  it('scopes the payer lookup to this organization', async () => {
    drizzle.queue([{ name: 'Org', treasuryContractId: null }], [{ walletPublicKey: PAYER_ONE }]);

    await post();

    const memberWhere = JSON.stringify(
      drizzle.calls.filter((c) => c.method === 'where').at(1)?.args[0]
    );
    expect(memberWhere).toContain('org_members.org_id');
    expect(memberWhere).toContain('payer');
  });

  it('never passes an org secret to the SDK — only the factory deployer keypair', async () => {
    drizzle.queue([{ name: 'Org', treasuryContractId: null }], [{ walletPublicKey: PAYER_ONE }]);

    await post();

    const call = mockProvisionTreasury.mock.calls[0][0];
    expect(Object.keys(call)).not.toContain('adminSecret');
    expect(call.deployerKeypair.publicKey()).toEqual(expect.stringMatching(/^G/));
  });
});
