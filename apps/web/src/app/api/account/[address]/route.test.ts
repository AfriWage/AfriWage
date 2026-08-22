import { NotFoundError } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetBalance } = vi.hoisted(() => ({
  mockGetBalance: vi.fn(),
}));

vi.mock('@AfriWage/sdk', () => ({
  getBalance: mockGetBalance,
}));

import { GET } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

describe('GET /api/account/[address]', () => {
  it('returns balances for an existing account with a single Horizon request', async () => {
    mockGetBalance.mockResolvedValue({ xlm: '100.0000000', usdc: '25.00' });

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      address,
      exists: true,
      balances: { xlm: '100.0000000', usdc: '25.00' },
    });
    expect(mockGetBalance).toHaveBeenCalledWith(address);
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid Stellar public key', async () => {
    const response = await GET(new Request('http://localhost'), { params: { address: 'bad' } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid Stellar public key' });
    expect(mockGetBalance).not.toHaveBeenCalled();
  });

  it('maps a confirmed Horizon 404 to a not-found response without a preflight', async () => {
    mockGetBalance.mockRejectedValue(new NotFoundError('Not Found', { status: 404 }));

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: 'Account not found on testnet',
      address,
      exists: false,
    });
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  it('returns 502 when the Stellar network call fails for another reason', async () => {
    mockGetBalance.mockRejectedValue(new Error('network error'));

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to fetch account from Stellar network',
    });
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });
});
