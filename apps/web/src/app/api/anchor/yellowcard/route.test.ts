import { Keypair } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAnchorInfo, mockGetTransactionStatus, mockInitiateWithdrawal } = vi.hoisted(() => ({
  mockGetAnchorInfo: vi.fn(),
  mockGetTransactionStatus: vi.fn(),
  mockInitiateWithdrawal: vi.fn(),
}));

vi.mock('@AfriWage/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@AfriWage/sdk')>();
  return {
    ...actual,
    getAnchorInfo: mockGetAnchorInfo,
    getTransactionStatus: mockGetTransactionStatus,
    initiateYellowCardWithdrawal: mockInitiateWithdrawal,
  };
});

import { GET, POST } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

function validPublicKey() {
  return Keypair.random().publicKey();
}

describe('GET /api/anchor/yellowcard', () => {
  it('returns anchor info for action=info', async () => {
    mockGetAnchorInfo.mockResolvedValue({ transferServer: 'https://api.yellowcard.io' });

    const response = await GET(new Request('http://localhost/api/anchor/yellowcard?action=info'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transferServer: 'https://api.yellowcard.io' });
  });

  it('returns transaction status for action=status', async () => {
    mockGetTransactionStatus.mockResolvedValue({ id: 'tx-1', status: 'completed' });

    const response = await GET(
      new Request('http://localhost/api/anchor/yellowcard?action=status&id=tx-1')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'tx-1', status: 'completed' });
    expect(mockGetTransactionStatus).toHaveBeenCalledWith('tx-1');
  });

  it('requires an id for action=status', async () => {
    const response = await GET(new Request('http://localhost/api/anchor/yellowcard?action=status'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Transaction id is required' });
  });

  it('rejects unsupported actions', async () => {
    const response = await GET(
      new Request('http://localhost/api/anchor/yellowcard?action=unknown')
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Unsupported action' });
  });

  it('returns 502 when fetching anchor info fails', async () => {
    mockGetAnchorInfo.mockRejectedValue(new Error('network error'));

    const response = await GET(new Request('http://localhost/api/anchor/yellowcard?action=info'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to fetch Yellow Card anchor information',
    });
  });
});

describe('POST /api/anchor/yellowcard', () => {
  function jsonRequest(body: unknown, search = '') {
    return new Request(`http://localhost/api/anchor/yellowcard?${search}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('successfully processes valid withdrawal payload', async () => {
    const account = validPublicKey();
    const mockResponse = { id: 'tx-123', status: 'pending' };
    mockInitiateWithdrawal.mockResolvedValueOnce(mockResponse);

    const body = {
      amount: '100.50',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      assetCode: 'USDC',
      memo: 'withdrawal-memo',
    };

    const request = jsonRequest(body, 'action=withdraw');

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(mockInitiateWithdrawal).toHaveBeenCalledTimes(1);
    expect(mockInitiateWithdrawal).toHaveBeenCalledWith({
      amount: '100.50',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      assetCode: 'USDC',
      memo: 'withdrawal-memo',
    });
  });

  it('handles error when initiation fails with 502 status', async () => {
    const account = validPublicKey();
    mockInitiateWithdrawal.mockRejectedValueOnce(new Error('Anchor API down'));

    const body = {
      amount: '50.00',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
    };

    const request = new Request('http://localhost/api/anchor/yellowcard?action=withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.message).toBe('Failed to create Yellow Card withdrawal');
  });

  it('rejects unsupported actions with 400 Bad Request', async () => {
    const response = await POST(jsonRequest({}, 'action=invalid'));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Unsupported action');
    expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
  });

  describe('amount validation', () => {
    const invalidAmounts = [
      '-50.00',
      '0',
      '0.00',
      'abc',
      '12.34.56',
      '10.12345678',
      '',
      100, // non-string
    ];

    it.each(invalidAmounts)(
      'rejects invalid amount "%s" with 400 status',
      async (invalidAmount) => {
        const body = {
          amount: invalidAmount,
          account: validPublicKey(),
          bankAccount: '1234567890',
          bankName: 'Test Bank',
        };

        const response = await POST(jsonRequest(body, 'action=withdraw'));
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
      }
    );

    it('rejects missing amount field with 400 status', async () => {
      const body = {
        account: validPublicKey(),
        bankAccount: '1234567890',
        bankName: 'Test Bank',
      };

      const response = await POST(jsonRequest(body, 'action=withdraw'));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.message).toBeDefined();
      expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
    });
  });

  describe('account validation', () => {
    const invalidAccounts = [
      'invalid-public-key',
      'SDJ35324523452345234523452345234523452345234523452345234', // secret key format
      'G123', // too short
      '',
      12345, // non-string
    ];

    it.each(invalidAccounts)(
      'rejects invalid account "%s" with 400 status',
      async (invalidAccount) => {
        const body = {
          amount: '50.00',
          account: invalidAccount,
          bankAccount: '1234567890',
          bankName: 'Test Bank',
        };

        const response = await POST(jsonRequest(body, 'action=withdraw'));
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
      }
    );

    it('rejects missing account field with 400 status', async () => {
      const body = {
        amount: '50.00',
        bankAccount: '1234567890',
        bankName: 'Test Bank',
      };

      const response = await POST(jsonRequest(body, 'action=withdraw'));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.message).toBeDefined();
      expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
    });
  });

  describe('bankAccount validation', () => {
    const invalidBankAccounts = ['', '   ', null, 12345];

    it.each(invalidBankAccounts)(
      'rejects invalid bankAccount "%s" with 400 status',
      async (invalidBankAccount) => {
        const body = {
          amount: '50.00',
          account: validPublicKey(),
          bankAccount: invalidBankAccount,
          bankName: 'Test Bank',
        };

        const response = await POST(jsonRequest(body, 'action=withdraw'));
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
      }
    );
  });

  describe('bankName validation', () => {
    const invalidBankNames = ['', '   ', null, 12345];

    it.each(invalidBankNames)(
      'rejects invalid bankName "%s" with 400 status',
      async (invalidBankName) => {
        const body = {
          amount: '50.00',
          account: validPublicKey(),
          bankAccount: '1234567890',
          bankName: invalidBankName,
        };

        const response = await POST(jsonRequest(body, 'action=withdraw'));
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
      }
    );
  });

  it('initiates a withdrawal with valid params', async () => {
    const account = validPublicKey();
    const validBody = {
      amount: '100',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
    };
    mockInitiateWithdrawal.mockResolvedValue({ id: 'w-1', status: 'pending' });

    const response = await POST(jsonRequest(validBody, 'action=withdraw'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'w-1', status: 'pending' });
    expect(mockInitiateWithdrawal).toHaveBeenCalledWith({
      amount: '100',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      assetCode: 'USDC',
      memo: undefined,
    });
  });

  it('rejects unsupported actions', async () => {
    const account = validPublicKey();
    const validBody = {
      amount: '100',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
    };
    const response = await POST(jsonRequest(validBody, 'action=deposit'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Unsupported action' });
    expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
  });

  it('rejects a body with missing fields', async () => {
    const response = await POST(jsonRequest({ amount: '100' }, 'action=withdraw'));

    expect(response.status).toBe(400);
    expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
  });

  it('rejects a non-USDC asset code so local-currency amounts are never sent as USDC', async () => {
    const response = await POST(
      jsonRequest({ ...validBody, assetCode: 'NGN' }, 'action=withdraw')
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Only USDC withdrawals are supported' });
    expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
  });

  it('returns 502 when the withdrawal fails', async () => {
    const account = validPublicKey();
    const validBody = {
      amount: '100',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
    };
    mockInitiateWithdrawal.mockRejectedValue(new Error('upstream error'));

    const response = await POST(jsonRequest(validBody, 'action=withdraw'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to create Yellow Card withdrawal',
    });
  });
});
