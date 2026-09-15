import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';

const ADMIN = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const RUN_ID = '8f7e6d5c-4b3a-4291-8f7e-6d5c4b3a2918';
const EMPLOYEE_A = '7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d';
const EMPLOYEE_B = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5e';

const drizzle = createDrizzleDouble();

const { mockRequireOrg } = vi.hoisted(() => ({ mockRequireOrg: vi.fn() }));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  employees: {
    id: 'employees.id',
    orgId: 'employees.org_id',
    active: 'employees.active',
    wageAmount: 'employees.wage_amount',
  },
  payrollRuns: {
    id: 'payroll_runs.id',
    orgId: 'payroll_runs.org_id',
    createdAt: 'payroll_runs.created_at',
  },
  payrollRunItems: { payrollRunId: 'payroll_run_items.payroll_run_id' },
}));

vi.mock('@/lib/require-org', async () => {
  const roles = await import('@/lib/org-roles');
  return { ...roles, requireOrg: mockRequireOrg };
});

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
  mockRequireOrg.mockReset();
  mockRequireOrg.mockResolvedValue({ orgId: ORG_ID, role: 'admin', walletPublicKey: ADMIN });
});

const params = { params: { orgId: ORG_ID } };

function post(body: unknown): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/orgs/x/payroll-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe('GET /api/orgs/[orgId]/payroll-runs', () => {
  it('lists the organization’s runs for any member', async () => {
    drizzle.queue([{ id: RUN_ID, status: 'draft' }]);

    const response = await route.GET(
      new Request('http://localhost/api/orgs/x/payroll-runs'),
      params
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ payrollRuns: [{ id: RUN_ID, status: 'draft' }] });
    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID);
  });
});

describe('POST /api/orgs/[orgId]/payroll-runs', () => {
  it('builds a run from every active employee at their stored wage', async () => {
    drizzle.queue(
      [
        { id: EMPLOYEE_A, wageAmount: '250.50' },
        { id: EMPLOYEE_B, wageAmount: '100.25' },
      ],
      [{ id: RUN_ID, status: 'draft', totalAmount: '350.7500000' }],
      []
    );

    const response = await post({ fromActiveEmployees: true });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ itemCount: 2 });

    const runValues = firstCall(drizzle.calls, 'values')?.[0] as { totalAmount: string };
    expect(runValues.totalAmount).toBe('350.7500000');
    expect(runValues).toMatchObject({ orgId: ORG_ID, status: 'draft', createdBy: ADMIN });
  });

  it('totals at full precision rather than rounding to cents', async () => {
    drizzle.queue(
      [
        { id: EMPLOYEE_A, wageAmount: '0.0000001' },
        { id: EMPLOYEE_B, wageAmount: '0.0000002' },
      ],
      [{ id: RUN_ID }],
      []
    );

    await post({ fromActiveEmployees: true });

    expect((firstCall(drizzle.calls, 'values')?.[0] as { totalAmount: string }).totalAmount).toBe(
      '0.0000003'
    );
  });

  it('snapshots the wage onto the item so a later raise does not change the run', async () => {
    drizzle.queue([{ id: EMPLOYEE_A, wageAmount: '250.50' }], [{ id: RUN_ID }], []);

    await post({ fromActiveEmployees: true });

    const itemValues = drizzle.calls.filter((call) => call.method === 'values').at(1)?.args[0];
    expect(itemValues).toEqual([
      { payrollRunId: RUN_ID, employeeId: EMPLOYEE_A, amount: '250.50' },
    ]);
  });

  it('honours an explicit per-item amount override', async () => {
    drizzle.queue([{ id: EMPLOYEE_A, wageAmount: '250.50', active: true }], [{ id: RUN_ID }], []);

    await post({ items: [{ employeeId: EMPLOYEE_A, amount: '400.00' }] });

    expect((firstCall(drizzle.calls, 'values')?.[0] as { totalAmount: string }).totalAmount).toBe(
      '400.0000000'
    );
  });

  it('rejects an employee id belonging to another tenant, failing the whole run', async () => {
    drizzle.queue([]);

    const response = await post({ items: [{ employeeId: EMPLOYEE_A }] });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toMatch(/not in this organization/);
  });

  it('refuses to pay a deactivated employee', async () => {
    drizzle.queue([{ id: EMPLOYEE_A, wageAmount: '250.50', active: false }]);

    const response = await post({ items: [{ employeeId: EMPLOYEE_A }] });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toMatch(/deactivated/);
  });

  it('refuses a run with no active employees', async () => {
    drizzle.queue([]);

    const response = await post({ fromActiveEmployees: true });

    expect(response.status).toBe(409);
  });

  it('writes the run and its items in one transaction', async () => {
    drizzle.queue([{ id: EMPLOYEE_A, wageAmount: '250.50' }], [{ id: RUN_ID }], []);

    await post({ fromActiveEmployees: true });

    expect(drizzle.calls.some((call) => call.method === 'transaction')).toBe(true);
  });

  it('requires at least the admin role', async () => {
    drizzle.queue([{ id: EMPLOYEE_A, wageAmount: '250.50' }], [{ id: RUN_ID }], []);

    await post({ fromActiveEmployees: true });

    expect(mockRequireOrg).toHaveBeenCalledWith(expect.any(Request), ORG_ID, 'admin');
  });

  it('rejects a malformed body before touching the database', async () => {
    const response = await post({});

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });
});
