import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';

const ADMIN = Keypair.random().publicKey();
const WORKER = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const EMPLOYEE_ID = '7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d';

const drizzle = createDrizzleDouble();

const { mockRequireOrg } = vi.hoisted(() => ({ mockRequireOrg: vi.fn() }));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  employees: {
    id: 'employees.id',
    orgId: 'employees.org_id',
    active: 'employees.active',
    createdAt: 'employees.created_at',
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
  vi.stubEnv('JWT_SECRET', 'k'.repeat(32));
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', 'afriwage.test');
  route = await import('./route');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  drizzle.reset();
  mockRequireOrg.mockReset();
  mockRequireOrg.mockResolvedValue({ orgId: ORG_ID, role: 'admin', walletPublicKey: ADMIN });
});

const params = { params: { orgId: ORG_ID } };

function request(url: string, init: RequestInit = {}): Request {
  return new Request(url, { headers: { 'Content-Type': 'application/json' }, ...init });
}

const validEmployee = {
  name: 'Amina Yusuf',
  stellarPublicKey: WORKER,
  wageAmount: '250.50',
};

describe('GET /api/orgs/[orgId]/employees', () => {
  it('lists the roster for any member', async () => {
    drizzle.queue([{ id: EMPLOYEE_ID, name: 'Amina Yusuf' }]);

    const response = await route.GET(request('http://localhost/api/orgs/x/employees'), params);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      employees: [{ id: EMPLOYEE_ID, name: 'Amina Yusuf' }],
    });
    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID);
  });

  it('narrows to active employees when asked, which is what payroll runs use', async () => {
    drizzle.queue([]);

    await route.GET(request('http://localhost/api/orgs/x/employees?active=true'), params);

    const where = firstCall(drizzle.calls, 'where')?.[0];
    expect(JSON.stringify(where)).toContain('employees.active');
  });

  it('does not filter by active when the flag is absent', async () => {
    drizzle.queue([]);

    await route.GET(request('http://localhost/api/orgs/x/employees'), params);

    const where = firstCall(drizzle.calls, 'where')?.[0];
    expect(JSON.stringify(where)).not.toContain('employees.active');
  });
});

describe('POST /api/orgs/[orgId]/employees', () => {
  it('creates an employee scoped to the org from the guard', async () => {
    drizzle.queue([{ id: EMPLOYEE_ID, ...validEmployee }]);

    const response = await route.POST(
      request('http://localhost/api/orgs/x/employees', {
        method: 'POST',
        body: JSON.stringify({ ...validEmployee, orgId: 'other-org' }),
      }),
      params
    );

    expect(response.status).toBe(201);
    expect(firstCall(drizzle.calls, 'values')?.[0]).toEqual({
      orgId: ORG_ID,
      name: 'Amina Yusuf',
      stellarPublicKey: WORKER,
      wageAmount: '250.50',
      wageCurrency: 'USDC',
      payoutOfframpCurrency: null,
    });
  });

  it('stores the wage as the exact string given, never a float', async () => {
    drizzle.queue([{}]);

    await route.POST(
      request('http://localhost/api/orgs/x/employees', {
        method: 'POST',
        body: JSON.stringify({ ...validEmployee, wageAmount: '1000000.1234567' }),
      }),
      params
    );

    const values = firstCall(drizzle.calls, 'values')?.[0] as { wageAmount: unknown };
    expect(values.wageAmount).toBe('1000000.1234567');
    expect(typeof values.wageAmount).toBe('string');
  });

  it('requires at least the admin role', async () => {
    drizzle.queue([{}]);

    await route.POST(
      request('http://localhost/api/orgs/x/employees', {
        method: 'POST',
        body: JSON.stringify(validEmployee),
      }),
      params
    );

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID, 'admin');
  });

  it('returns 403 when the guard refuses and writes nothing', async () => {
    const { forbidden } = await import('@/lib/api-errors');
    mockRequireOrg.mockRejectedValue(forbidden());

    const response = await route.POST(
      request('http://localhost/api/orgs/x/employees', {
        method: 'POST',
        body: JSON.stringify(validEmployee),
      }),
      params
    );

    expect(response.status).toBe(403);
    expect(drizzle.calls).toHaveLength(0);
  });

  it('rejects a zero wage with 400', async () => {
    const response = await route.POST(
      request('http://localhost/api/orgs/x/employees', {
        method: 'POST',
        body: JSON.stringify({ ...validEmployee, wageAmount: '0' }),
      }),
      params
    );

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });
});

describe('PATCH /api/orgs/[orgId]/employees', () => {
  it('updates an employee and scopes the predicate to the org', async () => {
    drizzle.queue([{ id: EMPLOYEE_ID, active: false }]);

    const response = await route.PATCH(
      request('http://localhost/api/orgs/x/employees', {
        method: 'PATCH',
        body: JSON.stringify({ id: EMPLOYEE_ID, active: false }),
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(firstCall(drizzle.calls, 'set')?.[0]).toEqual({ active: false });

    const where = JSON.stringify(firstCall(drizzle.calls, 'where')?.[0]);
    expect(where).toContain('employees.org_id');
    expect(where).toContain('employees.id');
  });

  it('returns 404 for an employee id belonging to another tenant', async () => {
    drizzle.queue([]);

    const response = await route.PATCH(
      request('http://localhost/api/orgs/x/employees', {
        method: 'PATCH',
        body: JSON.stringify({ id: EMPLOYEE_ID, active: false }),
      }),
      params
    );

    expect(response.status).toBe(404);
  });

  it('rejects an update with no changes', async () => {
    const response = await route.PATCH(
      request('http://localhost/api/orgs/x/employees', {
        method: 'PATCH',
        body: JSON.stringify({ id: EMPLOYEE_ID }),
      }),
      params
    );

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });
});
