import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, apiFetch } from './api-client';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  it('returns the parsed body on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ organizations: [] }));

    await expect(apiFetch('/api/orgs')).resolves.toEqual({ organizations: [] });
  });

  it('sets a JSON content type only when there is a body', async () => {
    // A Response body can only be read once, so each call needs a fresh one.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({})));

    await apiFetch('/api/orgs', { method: 'POST', body: '{}' });
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      'Content-Type': 'application/json',
    });

    await apiFetch('/api/orgs');
    expect(fetchMock.mock.calls[1][1].headers).toEqual({});
  });

  it("surfaces the server's message rather than the status text", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'An organization must keep at least one owner' }, 409)
    );

    await expect(apiFetch('/api/orgs/x/members')).rejects.toThrow(
      'An organization must keep at least one owner'
    );
  });

  it('falls back to the status text when the error body has no message', async () => {
    fetchMock.mockResolvedValue(new Response('gateway blew up', { status: 502 }));

    await expect(apiFetch('/api/orgs')).rejects.toBeInstanceOf(ApiClientError);
  });

  it('flags a 401 so callers can prompt for login instead of retrying', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Authentication required' }, 401));

    const error = (await apiFetch('/api/orgs').catch((caught) => caught)) as ApiClientError;

    expect(error.isUnauthenticated).toBe(true);
    expect(error.status).toBe(401);
  });

  it('does not flag a 403 as unauthenticated — the session is valid, the role is not', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Not permitted' }, 403));

    const error = (await apiFetch('/api/orgs').catch((caught) => caught)) as ApiClientError;

    expect(error.isUnauthenticated).toBe(false);
  });
});
