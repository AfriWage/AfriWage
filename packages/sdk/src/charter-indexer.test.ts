import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CharterIndexerError,
  getIndexedRequest,
  getIndexerHealth,
  listIndexedCategories,
  listIndexedRequests,
} from './charter-indexer';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const BASE = 'http://localhost:8080';
const TREASURY = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  fetchMock.mockReset();
});

describe('getIndexerHealth', () => {
  it('reports a healthy indexer', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }));

    await expect(getIndexerHealth(BASE)).resolves.toEqual({ status: 'ok' });
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/health`);
  });

  it('surfaces a degraded indexer as an error carrying the status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'degraded', database: 'unreachable' }, 503));

    const error = (await getIndexerHealth(BASE).catch((caught) => caught)) as CharterIndexerError;

    expect(error).toBeInstanceOf(CharterIndexerError);
    expect(error.status).toBe(503);
    expect(error.isNotFound).toBe(false);
  });
});

describe('listIndexedCategories', () => {
  it('returns the indexed categories', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        categories: [
          { categoryId: 1, name: 'January payroll', cap: '250000000000', spent: '0', active: true },
        ],
      })
    );

    await expect(listIndexedCategories(BASE, TREASURY)).resolves.toEqual([
      { categoryId: 1, name: 'January payroll', cap: '250000000000', spent: '0', active: true },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/orgs/${TREASURY}/categories`);
  });

  it('normalises the null the Go handler marshals for an empty slice', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ categories: null }));

    await expect(listIndexedCategories(BASE, TREASURY)).resolves.toEqual([]);
  });

  it('trims a trailing slash off the base URL rather than doubling it', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ categories: [] }));

    await listIndexedCategories(`${BASE}/`, TREASURY);

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/orgs/${TREASURY}/categories`);
  });
});

describe('listIndexedRequests', () => {
  it('passes a status filter through', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ requests: [] }));

    await listIndexedRequests(BASE, TREASURY, 'Pending');

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/orgs/${TREASURY}/requests?status=Pending`);
  });

  it('omits the filter when no status is given', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ requests: null }));

    await expect(listIndexedRequests(BASE, TREASURY)).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/orgs/${TREASURY}/requests`);
  });
});

describe('getIndexedRequest', () => {
  it('returns a request with its approval list', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        requestId: 42,
        categoryId: 1,
        recipient: TREASURY,
        amount: '2505000000',
        memo: 'payroll:8f7e6d5c',
        requester: TREASURY,
        status: 'Pending',
        createdLedger: 900,
        approvals: ['GABC'],
      })
    );

    await expect(getIndexedRequest(BASE, TREASURY, 42)).resolves.toMatchObject({
      requestId: 42,
      status: 'Pending',
      approvals: ['GABC'],
    });
  });

  it('flags a not-yet-ingested request as a 404 so callers can fall back', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'request not found' }, 404));

    const error = (await getIndexedRequest(BASE, TREASURY, 42).catch(
      (caught) => caught
    )) as CharterIndexerError;

    expect(error.isNotFound).toBe(true);
    expect(error.message).toBe('request not found');
  });
});
