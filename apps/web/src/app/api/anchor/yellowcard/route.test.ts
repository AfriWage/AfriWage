import { Keypair } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@AfriWage/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@AfriWage/sdk')>();
  return {
    ...actual,
    initiateYellowCardWithdrawal: vi.fn(),
  };
});

import { initiateYellowCardWithdrawal } from '@AfriWage/sdk';
import { POST } from './route';

const mockedInitiateYellowCardWithdrawal = vi.mocked(initiateYellowCardWithdrawal);

function validPublicKey() {
  return Keypair.random().publicKey();
}

describe('POST /api/anchor/yellowcard?action=withdraw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully processes valid withdrawal payload', async () => {
    const account = validPublicKey();
    const mockResponse = { id: 'tx-123', status: 'pending' };
    mockedInitiateYellowCardWithdrawal.mockResolvedValueOnce(mockResponse as never);

    const body = {
      amount: '100.50',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      assetCode: 'USDC',
      memo: 'withdrawal-memo',
    };

    const request = new Request('http://localhost/api/anchor/yellowcard?action=withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(mockedInitiateYellowCardWithdrawal).toHaveBeenCalledTimes(1);
    expect(mockedInitiateYellowCardWithdrawal).toHaveBeenCalledWith({
      amount: '100.50',
      account,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      assetCode: 'USDC',
      memo: 'withdrawal-memo',
    });
  });

  it('rejects unsupported actions with 400 Bad Request', async () => {
    const request = new Request('http://localhost/api/anchor/yellowcard?action=invalid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Unsupported action');
    expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
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

        const request = new Request('http://localhost/api/anchor/yellowcard?action=withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
      }
    );

    it('rejects missing amount field with 400 status', async () => {
      const body = {
        account: validPublicKey(),
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

      expect(response.status).toBe(400);
      expect(json.message).toBeDefined();
      expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
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

        const request = new Request('http://localhost/api/anchor/yellowcard?action=withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
      }
    );

    it('rejects missing account field with 400 status', async () => {
      const body = {
        amount: '50.00',
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

      expect(response.status).toBe(400);
      expect(json.message).toBeDefined();
      expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
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

        const request = new Request('http://localhost/api/anchor/yellowcard?action=withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
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

        const request = new Request('http://localhost/api/anchor/yellowcard?action=withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.message).toBeDefined();
        expect(mockedInitiateYellowCardWithdrawal).not.toHaveBeenCalled();
      }
    );
  });
});
