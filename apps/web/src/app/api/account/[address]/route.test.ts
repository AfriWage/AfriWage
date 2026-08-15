import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAccountExists, mockGetBalance } = vi.hoisted(() => ({
  mockAccountExists: vi.fn(),
  mockGetBalance: vi.fn(),
}));

vi.mock('@AfriWage/sdk', () => ({
  accountExists: mockAccountExists,
  getBalance: mockGetBalance,
}));

import { GET } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

describe('GET /api/account/[address]', () => {
  it('returns balances for an existing account', async () => {
    mockAccountExists.mockResolvedValue(true);
    mockGetBalance.mockResolvedValue({ xlm: '100.0000000', usdc: '25.00' });

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      address,
      exists: true,
      balances: { xlm: '100.0000000', usdc: '25.00' },
    });
    expect(mockAccountExists).toHaveBeenCalledWith(address);
    expect(mockGetBalance).toHaveBeenCalledWith(address);
  });

  it('rejects an invalid Stellar public key', async () => {
    const response = await GET(new Request('http://localhost'), { params: { address: 'bad' } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid Stellar public key' });
    expect(mockAccountExists).not.toHaveBeenCalled();
  });

  it('returns 404 for an account that does not exist', async () => {
    mockAccountExists.mockResolvedValue(false);

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: 'Account not found on testnet',
      address,
      exists: false,
    });
    expect(mockGetBalance).not.toHaveBeenCalled();
  });

  it('returns 502 when the Stellar network call fails', async () => {
    mockAccountExists.mockRejectedValue(new Error('network error'));

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to fetch account from Stellar network',
    });
  });
});
