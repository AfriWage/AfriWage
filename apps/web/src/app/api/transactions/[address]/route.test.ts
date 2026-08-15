import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAccountExists, mockGetTransactionHistory } = vi.hoisted(() => ({
  mockAccountExists: vi.fn(),
  mockGetTransactionHistory: vi.fn(),
}));

vi.mock('@AfriWage/sdk', () => ({
  accountExists: mockAccountExists,
  getTransactionHistory: mockGetTransactionHistory,
}));

import { GET } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const history = [
  {
    id: 'tx-id',
    hash: 'tx-hash',
    type: 'payment',
    amount: '25.00',
    asset: 'USDC',
    from: 'GSENDER',
    to: 'GRECIPIENT',
    memo: 'Payroll',
    createdAt: '2025-01-01T00:00:00Z',
    successful: true,
  },
];

describe('GET /api/transactions/[address]', () => {
  it('returns transaction history for an existing account', async () => {
    mockAccountExists.mockResolvedValue(true);
    mockGetTransactionHistory.mockResolvedValue(history);

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ address, transactions: history });
    expect(mockAccountExists).toHaveBeenCalledWith(address);
    expect(mockGetTransactionHistory).toHaveBeenCalledWith(address);
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
      transactions: [],
    });
    expect(mockGetTransactionHistory).not.toHaveBeenCalled();
  });

  it('returns 502 when the Stellar network call fails', async () => {
    mockAccountExists.mockRejectedValue(new Error('network error'));

    const response = await GET(new Request('http://localhost'), { params: { address } });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to fetch transactions from Stellar network',
    });
  });
});
