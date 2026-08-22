import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

const coingeckoResponse = {
  'usd-coin': {
    ngn: 1650.5,
    ghs: 15.2,
    kes: 129,
    zar: 18.4,
    tzs: 2600,
    ugx: 3750,
    xof: 610,
    xaf: 610,
  },
};

const offRampScope = {
  supported: ['NGN', 'GHS'],
  estimateOnly: ['KES', 'ZAR', 'TZS', 'UGX', 'XOF', 'XAF'],
};

describe('GET /api/rates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns live CoinGecko rates when available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => coingeckoResponse })
    );

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ NGN: 1650.5, GHS: 15.2, base: 'USDC', offRamp: offRampScope });
    expect(body.updatedAt).toEqual(expect.any(String));
    expect(response.headers.get('cache-control')).toContain('s-maxage=60');
  });

  it('falls back to static rates when CoinGecko is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      NGN: 1650,
      GHS: 15.2,
      base: 'USDC',
      offRamp: offRampScope,
    });
  });

  it('falls back to static rates when CoinGecko returns a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ NGN: 1650, base: 'USDC' });
  });
});
