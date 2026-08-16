import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountExists } from './account';
import { HORIZON_TESTNET_URL } from './types';

const publicKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('accountExists', () => {
  it('returns true when Horizon finds the account', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(accountExists(publicKey)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(`${HORIZON_TESTNET_URL}/accounts/${publicKey}`);
  });

  it('returns false only for a confirmed Horizon 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(accountExists(publicKey)).resolves.toBe(false);
  });

  it('rejects when Horizon returns an upstream error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(accountExists(publicKey)).rejects.toThrow(
      'Horizon account lookup failed with HTTP 503'
    );
  });

  it('propagates network failures', async () => {
    const networkError = new Error('network unavailable');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    await expect(accountExists(publicKey)).rejects.toBe(networkError);
  });
});
