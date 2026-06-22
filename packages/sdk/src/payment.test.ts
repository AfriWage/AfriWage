import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from './types';

const { mockLoadAccount } = vi.hoisted(() => ({
  mockLoadAccount: vi.fn(),
}));

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');

  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(() => ({
        loadAccount: mockLoadAccount,
      })),
    },
  };
});

import { getBalance } from './payment';

describe('getBalance', () => {
  beforeEach(() => {
    mockLoadAccount.mockReset();
  });

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
