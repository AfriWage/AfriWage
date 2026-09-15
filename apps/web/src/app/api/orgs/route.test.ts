import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';

const WALLET = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';

const drizzle = createDrizzleDouble();

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  organizations: {
    id: 'organizations.id',
    name: 'organizations.name',
    treasuryContractId: 'organizations.treasury_contract_id',
    charterOrgId: 'organizations.charter_org_id',
    defaultOfframpCurrency: 'organizations.default_offramp_currency',
    createdAt: 'organizations.created_at',
  },
  orgMembers: {
    orgId: 'org_members.org_id',
    walletPublicKey: 'org_members.wallet_public_key',
    role: 'org_members.role',
  },
}));

let GET: typeof import('./route').GET;
let POST: typeof import('./route').POST;
let auth: typeof import('@/lib/auth');

beforeAll(async () => {
  stubServerEnv();
  auth = await import('@/lib/auth');
  ({ GET, POST } = await import('./route'));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  drizzle.reset();
});

type FetchInit = Parameters<typeof fetch>[1];

function authed(init: FetchInit = {}): Request {
  const token = auth.createSessionToken(WALLET);
  return new Request('http://localhost/api/orgs', {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      cookie: `${auth.SESSION_COOKIE_NAME}=${token}`,
      ...(init.headers ?? {}),
    },
  });
}

describe('GET /api/orgs', () => {
  it('lists the organizations the wallet is a member of, with its role', async () => {
    drizzle.queue([{ id: ORG_ID, name: 'Kano Logistics', role: 'owner' }]);

    const response = await GET(authed());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      organizations: [{ id: ORG_ID, name: 'Kano Logistics', role: 'owner' }],
    });
  });

  it('drives the listing from org_members so other tenants are invisible', async () => {
    drizzle.queue([]);

    await GET(authed());

    expect(firstCall(drizzle.calls, 'from')).toEqual([
      expect.objectContaining({ orgId: 'org_members.org_id' }),
    ]);
  });

  it('returns 401 without a session', async () => {
    const response = await GET(new Request('http://localhost/api/orgs'));

    expect(response.status).toBe(401);
  });
});

describe('POST /api/orgs', () => {
  it('creates the organization and makes the caller its owner', async () => {
    drizzle.queue([{ id: ORG_ID, name: 'Kano Logistics' }], []);

    const response = await POST(
      authed({ method: 'POST', body: JSON.stringify({ name: 'Kano Logistics' }) })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      organization: { id: ORG_ID, name: 'Kano Logistics', role: 'owner' },
    });

    const memberValues = drizzle.calls.filter((call) => call.method === 'values').at(1)?.args[0];
    expect(memberValues).toEqual({ orgId: ORG_ID, walletPublicKey: WALLET, role: 'owner' });
  });

  it('writes the org and its owner in one transaction', async () => {
    drizzle.queue([{ id: ORG_ID, name: 'Kano Logistics' }], []);

    await POST(authed({ method: 'POST', body: JSON.stringify({ name: 'Kano Logistics' }) }));

    expect(drizzle.calls[0].method).toBe('transaction');
  });

  it('stores an off-ramp currency when given one', async () => {
    drizzle.queue([{ id: ORG_ID }], []);

    await POST(
      authed({
        method: 'POST',
        body: JSON.stringify({ name: 'Accra Crew', defaultOfframpCurrency: 'GHS' }),
      })
    );

    expect(firstCall(drizzle.calls, 'values')?.[0]).toEqual({
      name: 'Accra Crew',
      defaultOfframpCurrency: 'GHS',
    });
  });

  it('defaults the off-ramp currency to null when omitted', async () => {
    drizzle.queue([{ id: ORG_ID }], []);

    await POST(authed({ method: 'POST', body: JSON.stringify({ name: 'Kano Logistics' }) }));

    expect(firstCall(drizzle.calls, 'values')?.[0]).toEqual({
      name: 'Kano Logistics',
      defaultOfframpCurrency: null,
    });
  });

  it.each([
    { body: {}, description: 'a missing name' },
    { body: { name: '   ' }, description: 'a blank name' },
    { body: { name: 'a'.repeat(121) }, description: 'an over-long name' },
    {
      body: { name: 'Kano', defaultOfframpCurrency: 'KES' },
      description: 'an unsupported off-ramp currency',
    },
  ])('rejects $description with 400', async ({ body }) => {
    const response = await POST(authed({ method: 'POST', body: JSON.stringify(body) }));

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });

  it('returns 401 without a session and writes nothing', async () => {
    const response = await POST(
      new Request('http://localhost/api/orgs', {
        method: 'POST',
        body: JSON.stringify({ name: 'Kano Logistics' }),
      })
    );

    expect(response.status).toBe(401);
    expect(drizzle.calls).toHaveLength(0);
  });
});
