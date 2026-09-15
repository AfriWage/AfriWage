import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';

const OWNER = Keypair.random().publicKey();
const NEW_MEMBER = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';

const drizzle = createDrizzleDouble();

const { mockRequireOrg } = vi.hoisted(() => ({ mockRequireOrg: vi.fn() }));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  orgMembers: {
    id: 'org_members.id',
    orgId: 'org_members.org_id',
    walletPublicKey: 'org_members.wallet_public_key',
    role: 'org_members.role',
    createdAt: 'org_members.created_at',
  },
}));

vi.mock('@/lib/require-org', async () => {
  const roles = await import('@/lib/org-roles');
  return { ...roles, requireOrg: mockRequireOrg };
});

let route: typeof import('./route');

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('AUTH_SERVER_SIGNING_KEY', Keypair.random().secret());
  vi.stubEnv('JWT_SECRET', 'j'.repeat(32));
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', 'afriwage.test');
  route = await import('./route');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  drizzle.reset();
  mockRequireOrg.mockReset();
  mockRequireOrg.mockResolvedValue({ orgId: ORG_ID, role: 'owner', walletPublicKey: OWNER });
});

const params = { params: { orgId: ORG_ID } };

function request(url: string, init: RequestInit = {}): Request {
  return new Request(url, { headers: { 'Content-Type': 'application/json' }, ...init });
}

describe('GET /api/orgs/[orgId]/members', () => {
  it('lists the organization members', async () => {
    drizzle.queue([{ walletPublicKey: OWNER, role: 'owner' }]);

    const response = await route.GET(request('http://localhost/api/orgs/x/members'), params);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ members: [{ walletPublicKey: OWNER, role: 'owner' }] });
  });

  it('requires membership but no particular role to read', async () => {
    drizzle.queue([]);

    await route.GET(request('http://localhost/api/orgs/x/members'), params);

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID);
  });

  it('propagates the guard status when the caller is not a member', async () => {
    const { forbidden } = await import('@/lib/api-errors');
    mockRequireOrg.mockRejectedValue(forbidden());

    const response = await route.GET(request('http://localhost/api/orgs/x/members'), params);

    expect(response.status).toBe(403);
  });
});

describe('POST /api/orgs/[orgId]/members', () => {
  it('adds a member, scoped to the org from the guard not the body', async () => {
    drizzle.queue([{ walletPublicKey: NEW_MEMBER, role: 'payer' }]);

    const response = await route.POST(
      request('http://localhost/api/orgs/x/members', {
        method: 'POST',
        body: JSON.stringify({ walletPublicKey: NEW_MEMBER, role: 'payer', orgId: 'other-org' }),
      }),
      params
    );

    expect(response.status).toBe(201);
    expect(firstCall(drizzle.calls, 'values')?.[0]).toEqual({
      orgId: ORG_ID,
      walletPublicKey: NEW_MEMBER,
      role: 'payer',
    });
  });

  it('updates the role when the wallet is already a member', async () => {
    drizzle.queue([{ walletPublicKey: NEW_MEMBER, role: 'admin' }]);

    await route.POST(
      request('http://localhost/api/orgs/x/members', {
        method: 'POST',
        body: JSON.stringify({ walletPublicKey: NEW_MEMBER, role: 'admin' }),
      }),
      params
    );

    expect(firstCall(drizzle.calls, 'onConflictDoUpdate')?.[0]).toMatchObject({
      set: { role: 'admin' },
    });
  });

  it('requires the owner role', async () => {
    drizzle.queue([{}]);

    await route.POST(
      request('http://localhost/api/orgs/x/members', {
        method: 'POST',
        body: JSON.stringify({ walletPublicKey: NEW_MEMBER, role: 'payer' }),
      }),
      params
    );

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID, 'owner');
  });

  it('rejects an invalid role with 400 and writes nothing', async () => {
    const response = await route.POST(
      request('http://localhost/api/orgs/x/members', {
        method: 'POST',
        body: JSON.stringify({ walletPublicKey: NEW_MEMBER, role: 'superuser' }),
      }),
      params
    );

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });
});

describe('DELETE /api/orgs/[orgId]/members', () => {
  it('removes a non-owner member', async () => {
    drizzle.queue([{ role: 'payer' }], []);

    const response = await route.DELETE(
      request(`http://localhost/api/orgs/x/members?walletPublicKey=${NEW_MEMBER}`, {
        method: 'DELETE',
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ removed: NEW_MEMBER });
    expect(drizzle.calls.some((call) => call.method === 'delete')).toBe(true);
  });

  it('removes an owner while another owner remains', async () => {
    drizzle.queue([{ role: 'owner' }], [{ id: 'another-owner-row' }], []);

    const response = await route.DELETE(
      request(`http://localhost/api/orgs/x/members?walletPublicKey=${OWNER}`, { method: 'DELETE' }),
      params
    );

    expect(response.status).toBe(200);
  });

  it('refuses to remove the last owner, leaving the org manageable', async () => {
    drizzle.queue([{ role: 'owner' }], []);

    const response = await route.DELETE(
      request(`http://localhost/api/orgs/x/members?walletPublicKey=${OWNER}`, { method: 'DELETE' }),
      params
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      message: 'An organization must keep at least one owner',
    });
    expect(drizzle.calls.some((call) => call.method === 'delete')).toBe(false);
  });

  it('returns 404 for a wallet that is not a member', async () => {
    drizzle.queue([]);

    const response = await route.DELETE(
      request(`http://localhost/api/orgs/x/members?walletPublicKey=${NEW_MEMBER}`, {
        method: 'DELETE',
      }),
      params
    );

    expect(response.status).toBe(404);
  });

  it('returns 400 when no wallet is named', async () => {
    const response = await route.DELETE(
      request('http://localhost/api/orgs/x/members', { method: 'DELETE' }),
      params
    );

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });
});
