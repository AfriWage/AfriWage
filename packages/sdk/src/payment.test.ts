import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from './types';

const { mockLoadAccount, mockOperations, mockSubmitTransaction, mockTransactions } = vi.hoisted(
  () => ({
    mockLoadAccount: vi.fn(),
    mockOperations: vi.fn(),
    mockSubmitTransaction: vi.fn(),
    mockTransactions: vi.fn(),
  })
);

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');

  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(() => ({
        loadAccount: mockLoadAccount,
        operations: mockOperations,
        submitTransaction: mockSubmitTransaction,
        transactions: mockTransactions,
      })),
    },
  };
});

import { Account, Keypair } from '@stellar/stellar-sdk';
import { getBalance, getTransactionHistory, sendPayment } from './payment';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBalance', () => {
  it('returns formatted XLM and USDC balances from Horizon account data', async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [
        { asset_type: 'native', balance: '100.5' },
        {
          asset_type: 'credit_alphanum4',
          asset_code: USDC_ASSET_CODE,
          asset_issuer: USDC_ISSUER_TESTNET,
          balance: '50.123',
        },
      ],
    });

    const balance = await getBalance('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');

    expect(mockLoadAccount).toHaveBeenCalledWith(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
    );
    expect(balance).toEqual({ xlm: '100.5000000', usdc: '50.12' });
  });

  it('returns zero balances when account has no matching assets', async () => {
    mockLoadAccount.mockResolvedValue({ balances: [] });

    const balance = await getBalance('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');

    expect(balance).toEqual({ xlm: '0', usdc: '0' });
  });

  it('ignores USDC from a different issuer', async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [
        { asset_type: 'native', balance: '25' },
        {
          asset_type: 'credit_alphanum4',
          asset_code: USDC_ASSET_CODE,
          asset_issuer: 'GDIFFERENTISSUERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          balance: '99.99',
        },
      ],
    });

    const balance = await getBalance('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');

    expect(balance).toEqual({ xlm: '25.0000000', usdc: '0' });
  });
});

describe('sendPayment', () => {
  let sender: Keypair;
  const submission = { hash: 'transaction-hash', ledger: 123, successful: true };

  beforeEach(() => {
    sender = Keypair.random();
    mockLoadAccount.mockResolvedValue(new Account(sender.publicKey(), '1'));
    mockSubmitTransaction.mockResolvedValue(submission);
  });

  it('submits the requested USDC payment and returns the Horizon result', async () => {
    const recipient = Keypair.random().publicKey();
    const result = await sendPayment(sender.secret(), recipient, '25.50', 'Invoice 42');
    const transaction = mockSubmitTransaction.mock.calls[0][0];
    const operation = transaction.operations[0];

    expect(operation).toMatchObject({
      type: 'payment',
      destination: recipient,
    });
    expect(Number(operation.amount)).toBe(25.5);
    expect(operation.asset.getCode()).toBe(USDC_ASSET_CODE);
    expect(operation.asset.getIssuer()).toBe(USDC_ISSUER_TESTNET);
    expect(transaction.memo).toMatchObject({ type: 'text', value: 'Invoice 42' });
    expect(result).toEqual(submission);
  });

  it('does not add a memo when one is not provided', async () => {
    await sendPayment(sender.secret(), Keypair.random().publicKey(), '10.00');

    expect(mockSubmitTransaction.mock.calls[0][0].memo.type).toBe('none');
  });
});

describe('getTransactionHistory', () => {
  it('maps payment and account creation transactions in newest-first order', async () => {
    const transaction = {
      id: 'id',
      source_account: 'GSENDER',
      memo: 'ignored',
      created_at: '2025-01-01T00:00:00Z',
      successful: true,
    };
    const request = {
      call: vi.fn().mockResolvedValue({
        records: [
          {
            ...transaction,
            hash: 'payment-hash',
            memo_type: 'text',
            memo: 'Payroll',
          },
          { ...transaction, hash: 'create-hash', source_account: 'GCREATOR', memo_type: 'hash' },
        ],
      }),
      forAccount: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    const operationRecords = {
      'payment-hash': [
        {
          type: 'payment',
          amount: '42.567',
          asset_type: 'credit_alphanum4',
          asset_code: 'USDC',
          from: 'GSENDER',
          to: 'GRECIPIENT',
        },
      ],
      'create-hash': [
        {
          type: 'create_account',
          starting_balance: '10',
          account: 'GNEWACCOUNT',
        },
      ],
    };
    const forTransaction = vi.fn((hash: keyof typeof operationRecords) => ({
      call: vi.fn().mockResolvedValue({ records: operationRecords[hash] }),
    }));
    mockTransactions.mockReturnValue(request);
    mockOperations.mockReturnValue({ forTransaction });

    const history = await getTransactionHistory('GACCOUNT');

    expect(request.forAccount).toHaveBeenCalledWith('GACCOUNT');
    expect(request.order).toHaveBeenCalledWith('desc');
    expect(request.limit).toHaveBeenCalledWith(20);
    expect(history).toMatchObject([
      {
        hash: 'payment-hash',
        type: 'payment',
        amount: '42.57',
        asset: 'USDC',
        from: 'GSENDER',
        to: 'GRECIPIENT',
        memo: 'Payroll',
      },
      {
        hash: 'create-hash',
        type: 'create_account',
        amount: '10.00',
        asset: 'XLM',
        from: 'GCREATOR',
        to: 'GNEWACCOUNT',
      },
    ]);
    expect(history[1].memo).toBeUndefined();
  });

  it('returns an empty array immediately when account has no transactions', async () => {
    const request = {
      call: vi.fn().mockResolvedValue({ records: [] }),
      forAccount: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    mockTransactions.mockReturnValue(request);

    const history = await getTransactionHistory('GACCOUNT');

    expect(history).toEqual([]);
    expect(mockOperations).not.toHaveBeenCalled();
  });

  it('fetches operations concurrently for multiple transactions without sequential blocking', async () => {
    const tx1 = {
      id: '1',
      hash: 'tx1',
      source_account: 'G1',
      created_at: '2025-01-01',
      successful: true,
      memo_type: 'none',
    };
    const tx2 = {
      id: '2',
      hash: 'tx2',
      source_account: 'G2',
      created_at: '2025-01-02',
      successful: true,
      memo_type: 'none',
    };

    const request = {
      call: vi.fn().mockResolvedValue({ records: [tx1, tx2] }),
      forAccount: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    const forTransactionMock = vi.fn().mockImplementation((_hash: string) => ({
      call: vi.fn().mockResolvedValue({
        records: [{ type: 'payment', amount: '10', asset_type: 'native', from: 'G1', to: 'G2' }],
      }),
    }));

    mockTransactions.mockReturnValue(request);
    mockOperations.mockReturnValue({ forTransaction: forTransactionMock });

    const history = await getTransactionHistory('GACCOUNT');

    expect(history).toHaveLength(2);
    expect(forTransactionMock).toHaveBeenCalledWith('tx1');
    expect(forTransactionMock).toHaveBeenCalledWith('tx2');
    expect(forTransactionMock).toHaveBeenCalledTimes(2);
  });

  it('formats native XLM payments without applying USDC validation first', async () => {
    const transaction = {
      id: 'id',
      source_account: 'GSENDER',
      created_at: '2025-01-01T00:00:00Z',
      successful: true,
      hash: 'xlm-payment-hash',
      memo_type: 'none',
    };
    const request = {
      call: vi.fn().mockResolvedValue({ records: [transaction] }),
      forAccount: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    mockTransactions.mockReturnValue(request);
    mockOperations.mockReturnValue({
      forTransaction: vi.fn(() => ({
        call: vi.fn().mockResolvedValue({
          records: [
            {
              type: 'payment',
              amount: '1.2345678',
              asset_type: 'native',
              from: 'GSENDER',
              to: 'GRECIPIENT',
            },
          ],
        }),
      })),
    });

    const history = await getTransactionHistory('GACCOUNT');

    expect(history[0]).toMatchObject({
      type: 'payment',
      amount: '1.23',
      asset: 'XLM',
    });
  });
});
