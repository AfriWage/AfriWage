import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFundTestnetAccount } = vi.hoisted(() => ({
  mockFundTestnetAccount: vi.fn(),
}));

vi.mock('@AfriWage/sdk', () => ({
  fundTestnetAccount: mockFundTestnetAccount,
}));

import { POST } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/fund-testnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/fund-testnet', () => {
  it('funds a valid testnet account via Friendbot', async () => {
    mockFundTestnetAccount.mockResolvedValue({ funded: true, publicKey: address });

    const response = await POST(jsonRequest({ address }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      funded: true,
      publicKey: address,
      message: 'Account funded with 10,000 testnet XLM',
    });
    expect(mockFundTestnetAccount).toHaveBeenCalledWith(address);
  });

  it('rejects an invalid Stellar public key', async () => {
    const response = await POST(jsonRequest({ address: 'not-a-key' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid Stellar public key' });
    expect(mockFundTestnetAccount).not.toHaveBeenCalled();
  });

  it('returns 502 when Friendbot funding fails', async () => {
    mockFundTestnetAccount.mockRejectedValue(new Error('Friendbot is down'));

    const response = await POST(jsonRequest({ address }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'Friendbot is down', funded: false });
  });
});
