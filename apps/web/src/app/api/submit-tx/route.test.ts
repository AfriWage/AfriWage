import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFromXDR, mockSubmitTransaction } = vi.hoisted(() => ({
  mockFromXDR: vi.fn(),
  mockSubmitTransaction: vi.fn(),
}));

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');

  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(() => ({
        submitTransaction: mockSubmitTransaction,
      })),
    },
    TransactionBuilder: {
      ...actual.TransactionBuilder,
      fromXDR: mockFromXDR,
    },
  };
});

import { POST } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/submit-tx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/submit-tx', () => {
  it('submits a signed transaction and returns the Horizon result', async () => {
    mockFromXDR.mockReturnValue({ parsed: true });
    mockSubmitTransaction.mockResolvedValue({ hash: 'tx-hash', ledger: 123, successful: true });

    const response = await POST(jsonRequest({ signedXdr: 'AAAA...' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hash: 'tx-hash', ledger: 123, successful: true });
    expect(mockFromXDR).toHaveBeenCalledWith('AAAA...', expect.any(String));
    expect(mockSubmitTransaction).toHaveBeenCalledWith({ parsed: true });
  });

  it('rejects requests without a signedXdr', async () => {
    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'signedXdr is required' });
    expect(mockSubmitTransaction).not.toHaveBeenCalled();
  });

  it('surfaces Horizon result codes when submission fails', async () => {
    mockFromXDR.mockReturnValue({ parsed: true });
    mockSubmitTransaction.mockRejectedValue({
      response: { data: { extras: { result_codes: { transaction: 'tx_failed' } } } },
    });

    const response = await POST(jsonRequest({ signedXdr: 'AAAA...' }));

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.successful).toBe(false);
    expect(body.message).toContain('Transaction failed');
    expect(body.message).toContain('tx_failed');
  });

  it('rejects an XDR that cannot be parsed', async () => {
    mockFromXDR.mockImplementation(() => {
      throw new Error('Invalid XDR');
    });

    const response = await POST(jsonRequest({ signedXdr: 'not-xdr' }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'Invalid XDR', successful: false });
  });
});
