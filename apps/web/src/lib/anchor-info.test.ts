import { afterEach, describe, expect, it, vi } from 'vitest';

// `getAnchorInfoOnce` caches its promise at module scope, so each test resets
// the module registry to get a fresh cache.
async function importFreshModule() {
  vi.resetModules();
  return import('./anchor-info');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const infoResponse = () =>
  new Response(JSON.stringify({ transferServer: 'https://api.yellowcard.io' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('getAnchorInfoOnce', () => {
  it('fetches anchor info on the first request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(infoResponse());
    vi.stubGlobal('fetch', fetchMock);

    const { getAnchorInfoOnce } = await importFreshModule();
    const result = await getAnchorInfoOnce();

    expect(result).toEqual({ transferServer: 'https://api.yellowcard.io' });
    expect(fetchMock).toHaveBeenCalledWith('/api/anchor/yellowcard?action=info');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reuses the cached result on subsequent requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(infoResponse());
    vi.stubGlobal('fetch', fetchMock);

    const { getAnchorInfoOnce } = await importFreshModule();
    const first = await getAnchorInfoOnce();
    const second = await getAnchorInfoOnce();

    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed request, allowing a later retry', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(infoResponse());
    vi.stubGlobal('fetch', fetchMock);

    const { getAnchorInfoOnce } = await importFreshModule();

    await expect(getAnchorInfoOnce()).rejects.toThrow('network unavailable');

    const result = await getAnchorInfoOnce();
    expect(result).toEqual({ transferServer: 'https://api.yellowcard.io' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects when the info endpoint responds with an error status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    const { getAnchorInfoOnce } = await importFreshModule();

    await expect(getAnchorInfoOnce()).rejects.toThrow('Unable to fetch anchor configuration');
  });
});
