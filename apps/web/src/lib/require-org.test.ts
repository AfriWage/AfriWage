import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type RequireOrgModule = typeof import('./require-org');
type AuthModule = typeof import('./auth');

const JWT_SECRET = 'e'.repeat(32);
const HOME_DOMAIN = 'afriwage.test';
const ORG_ID = '4f6d2f6e-0a4f-4c11-9a4c-2f1e0d7b5c31';
const WALLET = Keypair.random().publicKey();

/**
 * Queued results for the two selects `requireOrg` performs, in order: the
 * organization lookup, then the membership lookup.
 */
let selectResults: unknown[][];

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock('@AfriWage/db', () => ({
  db: { select: mockSelect },
  organizations: { id: 'organizations.id' },
  orgMembers: {
    orgId: 'org_members.org_id',
    walletPublicKey: 'org_members.wallet_public_key',
    role: 'org_members.role',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
}));

let requireOrgModule: RequireOrgModule;
let auth: AuthModule;

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('AUTH_SERVER_SIGNING_KEY', Keypair.random().secret());
  vi.stubEnv('JWT_SECRET', JWT_SECRET);
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', HOME_DOMAIN);
  auth = await import('./auth');
  requireOrgModule = await import('./require-org');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  selectResults = [];
  mockSelect.mockReset();
  mockSelect.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(selectResults.shift() ?? []),
      }),
    }),
  }));
});

function authenticatedRequest(wallet = WALLET): Request {
  const token = auth.createSessionToken(wallet);
  return new Request('http://localhost/api/orgs', {
    headers: { cookie: `${auth.SESSION_COOKIE_NAME}=${token}` },
  });
}

async function statusOf(promise: Promise<unknown>): Promise<number> {
  try {
    await promise;
  } catch (error) {
    return (error as { status: number }).status;
  }

  throw new Error('Expected the call to reject');
}

describe('requireSession', () => {
  it('returns the session for an authenticated request', () => {
    expect(requireOrgModule.requireSession(authenticatedRequest())).toEqual({
      walletPublicKey: WALLET,
    });
  });

  it('raises 401 for an unauthenticated request', () => {
    try {
      requireOrgModule.requireSession(new Request('http://localhost/api/orgs'));
      throw new Error('Expected the call to throw');
    } catch (error) {
      expect((error as { status: number }).status).toBe(401);
    }
  });
});

describe('requireOrg', () => {
  it('returns the membership for a member of the organization', async () => {
    selectResults = [[{ id: ORG_ID }], [{ role: 'admin' }]];

    await expect(requireOrgModule.requireOrg(authenticatedRequest(), ORG_ID)).resolves.toEqual({
      orgId: ORG_ID,
      role: 'admin',
      walletPublicKey: WALLET,
    });
  });

  it('raises 401 before touching the database when unauthenticated', async () => {
    const status = await statusOf(
      requireOrgModule.requireOrg(new Request('http://localhost/api/orgs'), ORG_ID)
    );

    expect(status).toBe(401);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('raises 404 for a malformed org id without querying Postgres', async () => {
    const status = await statusOf(
      requireOrgModule.requireOrg(authenticatedRequest(), 'not-a-uuid')
    );

    expect(status).toBe(404);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('raises 404 when the organization does not exist', async () => {
    selectResults = [[]];

    expect(await statusOf(requireOrgModule.requireOrg(authenticatedRequest(), ORG_ID))).toBe(404);
  });

  it('raises 403 when the wallet is not a member', async () => {
    selectResults = [[{ id: ORG_ID }], []];

    expect(await statusOf(requireOrgModule.requireOrg(authenticatedRequest(), ORG_ID))).toBe(403);
  });

  it('raises 403 when a stored role is not one AfriWage recognises', async () => {
    selectResults = [[{ id: ORG_ID }], [{ role: 'superuser' }]];

    expect(await statusOf(requireOrgModule.requireOrg(authenticatedRequest(), ORG_ID))).toBe(403);
  });

  describe('role requirements', () => {
    it.each([
      ['owner', 'owner', true],
      ['owner', 'admin', true],
      ['owner', 'payer', false],
      ['admin', 'admin', true],
      ['admin', 'owner', false],
      ['admin', 'payer', false],
      ['payer', 'payer', true],
      ['payer', 'admin', false],
      ['payer', 'owner', false],
    ])(
      'a stored %s role against a required %s role: allowed=%s',
      async (storedRole, requiredRole, allowed) => {
        selectResults = [[{ id: ORG_ID }], [{ role: storedRole }]];

        const call = requireOrgModule.requireOrg(
          authenticatedRequest(),
          ORG_ID,
          requiredRole as 'owner' | 'admin' | 'payer'
        );

        if (allowed) {
          await expect(call).resolves.toMatchObject({ role: storedRole });
        } else {
          expect(await statusOf(call)).toBe(403);
        }
      }
    );
  });
});

describe('isOrgRole', () => {
  it.each([['owner'], ['admin'], ['payer']])('accepts %s', (role) => {
    expect(requireOrgModule.isOrgRole(role)).toBe(true);
  });

  it.each([['superuser'], [''], [null], [7]])('rejects %s', (value) => {
    expect(requireOrgModule.isOrgRole(value)).toBe(false);
  });
});
