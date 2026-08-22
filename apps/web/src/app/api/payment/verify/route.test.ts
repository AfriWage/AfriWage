import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockOperations, mockTransactions } = vi.hoisted(() => ({
  mockOperations: vi.fn(),
  mockTransactions: vi.fn(),
}));

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');

  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(() => ({
        operations: mockOperations,
        transactions: mockTransactions,
      })),
    },
  };
});

import { GET } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

const transaction = {
  hash: 'tx-hash',
  successful: true,
  source_account: 'GSENDER',
  memo_type: 'text',
  memo: 'Payroll',
  created_at: '2025-01-01T00:00:00Z',
};
const validHash = 'a'.repeat(64);

describe('GET /api/payment/verify', () => {
  it('verifies a payment and extracts its payment details', async () => {
    mockTransactions.mockReturnValue({
      transaction: vi.fn().mockReturnValue({ call: vi.fn().mockResolvedValue(transaction) }),
    });
    mockOperations.mockReturnValue({
      forTransaction: vi.fn().mockReturnValue({
        call: vi.fn().mockResolvedValue({
          records: [
            {
              type: 'payment',
              from: 'GSENDER',
              to: 'GRECIPIENT',
              amount: '25.50',
              asset_type: 'credit_alphanum4',
              asset_code: 'USDC',
            },
          ],
        }),
      }),
    });

    const request = new Request(`http://localhost/api/payment/verify?hash=${validHash}`);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      verified: true,
      hash: 'tx-hash',
      sender: 'GSENDER',
      recipient: 'GRECIPIENT',
      amount: '25.50',
      asset: 'USDC',
      memo: 'Payroll',
      createdAt: '2025-01-01T00:00:00Z',
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/tx-hash',
    });
  });

  it('treats native payments as XLM', async () => {
    mockTransactions.mockReturnValue({
      transaction: vi.fn().mockReturnValue({
        call: vi.fn().mockResolvedValue({ ...transaction, memo_type: 'none', memo: undefined }),
      }),
    });
    mockOperations.mockReturnValue({
      forTransaction: vi.fn().mockReturnValue({
        call: vi.fn().mockResolvedValue({
          records: [
            {
              type: 'payment',
              from: 'GSENDER',
              to: 'GRECIPIENT',
              amount: '100',
              asset_type: 'native',
            },
          ],
        }),
      }),
    });

    const request = new Request(`http://localhost/api/payment/verify?hash=${validHash}`);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.asset).toBe('XLM');
    expect(body.amount).toBe('100');
    expect(body.memo).toBeUndefined();
  });

  it('requires a transaction hash', async () => {
    const request = new Request('http://localhost/api/payment/verify');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Transaction hash is required' });
    expect(mockTransactions).not.toHaveBeenCalled();
  });

  it('rejects a malformed hash before calling Horizon', async () => {
    const request = new Request('http://localhost/api/payment/verify?hash=not-a-hash');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid transaction hash' });
    expect(mockTransactions).not.toHaveBeenCalled();
    expect(mockOperations).not.toHaveBeenCalled();
  });

  it('returns 404 when the transaction cannot be found', async () => {
    mockTransactions.mockReturnValue({
      transaction: vi.fn().mockReturnValue({
        call: vi.fn().mockRejectedValue({ response: { status: 404 } }),
      }),
    });

    const request = new Request(`http://localhost/api/payment/verify?hash=${validHash}`);
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Transaction not found', verified: false });
  });

  it.each([
    ['a network failure', new Error('network unavailable')],
    ['an upstream 503', { response: { status: 503 } }],
  ])('returns 502 for %s', async (_label, error) => {
    mockTransactions.mockReturnValue({
      transaction: vi.fn().mockReturnValue({
        call: vi.fn().mockRejectedValue(error),
      }),
    });

    const request = new Request(`http://localhost/api/payment/verify?hash=${validHash}`);
    const response = await GET(request);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Payment verification temporarily unavailable',
      verified: false,
    });
  });
});
