import { Keypair, Networks, type Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAccount,
  mockSimulateTransaction,
  mockGetLatestLedger,
  mockGetTransaction,
  mockAssembleTransaction,
  mockIsSimulationError,
} = vi.hoisted(() => ({
  mockGetAccount: vi.fn(),
  mockSimulateTransaction: vi.fn(),
  mockGetLatestLedger: vi.fn(),
  mockGetTransaction: vi.fn(),
  mockAssembleTransaction: vi.fn(),
  mockIsSimulationError: vi.fn(),
}));

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');

  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: class {
        getAccount = mockGetAccount;
        simulateTransaction = mockSimulateTransaction;
        getLatestLedger = mockGetLatestLedger;
        getTransaction = mockGetTransaction;
      },
      assembleTransaction: mockAssembleTransaction,
      Api: {
        ...actual.rpc.Api,
        isSimulationError: mockIsSimulationError,
      },
    },
  };
});

import {
  CharterError,
  TREASURY_TOKEN_DECIMALS,
  approvePayout,
  createSpendCategory,
  depositToTreasury,
  fromTokenUnits,
  getOrgRecord,
  getPayoutRequest,
  getTreasuryState,
  provisionTreasury,
  readDeployedOrgId,
  requestPayout,
  toTokenUnits,
} from './charter';

const config = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
};

const ADMIN = Keypair.random();
const APPROVER_ONE = Keypair.random();
const APPROVER_TWO = Keypair.random();
const RECIPIENT = Keypair.random();
const DEPLOYER = Keypair.random();

const FACTORY_ID = 'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4';
const TREASURY_ID = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';
const TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

/** Captures the transaction handed to simulateTransaction so its args can be read back. */
let simulated: Transaction;

beforeEach(() => {
  vi.clearAllMocks();

  mockGetAccount.mockImplementation(async () => {
    const { Account } = await import('@stellar/stellar-sdk');
    return new Account(ADMIN.publicKey(), '1');
  });

  mockSimulateTransaction.mockImplementation(async (transaction: Transaction) => {
    simulated = transaction;
    return { result: { auth: [], retval: xdr.ScVal.scvU32(1) } };
  });

  mockIsSimulationError.mockReturnValue(false);
  mockGetLatestLedger.mockResolvedValue({ sequence: 1000 });
  mockAssembleTransaction.mockImplementation((raw) => ({ build: () => raw }));
});

/** Reads the ScVal arguments off the invocation the module built. */
function invokedArgs(): xdr.ScVal[] {
  const operation = simulated.operations[0] as unknown as { func: xdr.HostFunction };
  return operation.func.invokeContract().args();
}

function invokedFunctionName(): string {
  const operation = simulated.operations[0] as unknown as { func: xdr.HostFunction };
  return operation.func.invokeContract().functionName().toString();
}

describe('toTokenUnits', () => {
  it('scales a decimal amount to the token’s smallest unit', () => {
    expect(toTokenUnits('250.50')).toBe(2_505_000_000n);
  });

  it('handles the full seven decimal places USDC supports', () => {
    expect(toTokenUnits('0.0000001')).toBe(1n);
  });

  it('does not lose precision on a large amount', () => {
    expect(toTokenUnits('1000000.1234567')).toBe(10_000_001_234_567n);
  });

  it('refuses to round an amount finer than the token can represent', () => {
    expect(() => toTokenUnits('1.12345678')).toThrow(CharterError);
  });

  it('rejects a non-numeric amount rather than producing NaN units', () => {
    expect(() => toTokenUnits('abc')).toThrow(CharterError);
  });

  it('honours a non-default decimal count', () => {
    expect(toTokenUnits('1.23', 2)).toBe(123n);
  });
});

describe('fromTokenUnits', () => {
  it('round-trips an amount through toTokenUnits', () => {
    expect(fromTokenUnits(toTokenUnits('250.50'))).toBe('250.5000000');
  });

  it('formats to the token’s full precision', () => {
    expect(fromTokenUnits(1n)).toBe('0.0000001');
  });

  it('accepts the bigint scValToNative returns for an i128', () => {
    expect(fromTokenUnits(10_000_001_234_567n)).toBe('1000000.1234567');
  });
});

describe('provisionTreasury', () => {
  const params = {
    factoryContractId: FACTORY_ID,
    name: 'Kano Logistics',
    admin: ADMIN.publicKey(),
    approvers: [APPROVER_ONE.publicKey(), APPROVER_TWO.publicKey()],
    threshold: 2,
    tokenContractId: TOKEN_ID,
    deployerKeypair: DEPLOYER,
  };

  it('calls deploy_treasury with the real argument order', async () => {
    await provisionTreasury(params, config);

    expect(invokedFunctionName()).toBe('deploy_treasury');

    const args = invokedArgs();
    expect(args).toHaveLength(5);
    expect(args[0].str().toString()).toBe('Kano Logistics');
    expect(args[3].u32()).toBe(2);
  });

  it('sources the transaction from the org admin, never from the server', async () => {
    await provisionTreasury(params, config);

    expect(mockGetAccount).toHaveBeenCalledWith(ADMIN.publicKey());
  });

  it('returns unsigned XDR — the admin still has to sign in Freighter', async () => {
    const { xdr: unsigned } = await provisionTreasury(params, config);
    const rebuilt = TransactionBuilder.fromXDR(unsigned, Networks.TESTNET);

    expect(rebuilt.signatures).toHaveLength(0);
  });

  it('rejects a threshold larger than the approver set', async () => {
    await expect(provisionTreasury({ ...params, threshold: 3 }, config)).rejects.toThrow(
      /exceeds the 2 approver/
    );
  });

  it('rejects a zero threshold, which Charter would reject on-chain anyway', async () => {
    await expect(provisionTreasury({ ...params, threshold: 0 }, config)).rejects.toThrow(
      CharterError
    );
  });

  it('surfaces a failed simulation instead of returning an unusable XDR', async () => {
    mockIsSimulationError.mockReturnValue(true);
    mockSimulateTransaction.mockResolvedValue({ error: 'HostError: factory not initialized' });

    await expect(provisionTreasury(params, config)).rejects.toThrow(/factory not initialized/);
  });
});

describe('createSpendCategory', () => {
  it('calls create_category with the admin, name and scaled cap', async () => {
    await createSpendCategory(
      {
        treasuryContractId: TREASURY_ID,
        admin: ADMIN.publicKey(),
        name: 'January payroll',
        capAmount: '25000.00',
      },
      config
    );

    expect(invokedFunctionName()).toBe('create_category');

    const args = invokedArgs();
    expect(args[1].str().toString()).toBe('January payroll');
    expect(args[2].switch().name).toBe('scvI128');
  });

  it('refuses a cap finer than the token can represent', async () => {
    await expect(
      createSpendCategory(
        {
          treasuryContractId: TREASURY_ID,
          admin: ADMIN.publicKey(),
          name: 'January payroll',
          capAmount: '1.123456789',
        },
        config
      )
    ).rejects.toThrow(CharterError);
  });
});

describe('requestPayout', () => {
  const params = {
    treasuryContractId: TREASURY_ID,
    requester: ADMIN.publicKey(),
    categoryId: 1,
    recipient: RECIPIENT.publicKey(),
    amount: '250.50',
    memo: 'payroll-run-7',
  };

  it('calls submit_request with the real five-argument order', async () => {
    await requestPayout(params, config);

    expect(invokedFunctionName()).toBe('submit_request');

    const args = invokedArgs();
    expect(args).toHaveLength(5);
    expect(args[1].u32()).toBe(1);
    expect(args[4].str().toString()).toBe('payroll-run-7');
  });

  it('is sourced by the requester so only they need to sign', async () => {
    await requestPayout(params, config);

    expect(mockGetAccount).toHaveBeenCalledWith(ADMIN.publicKey());
  });

  it('rejects a negative category id before it reaches the contract', async () => {
    await expect(requestPayout({ ...params, categoryId: -1 }, config)).rejects.toThrow(
      CharterError
    );
  });
});

describe('approvePayout', () => {
  it('calls approve_request with the approver and request id', async () => {
    await approvePayout(
      { treasuryContractId: TREASURY_ID, approver: APPROVER_ONE.publicKey(), requestId: 42 },
      config
    );

    expect(invokedFunctionName()).toBe('approve_request');
    expect(invokedArgs()[1].u32()).toBe(42);
  });

  it('is sourced by the approver, so each approval is its own signature', async () => {
    await approvePayout(
      { treasuryContractId: TREASURY_ID, approver: APPROVER_ONE.publicKey(), requestId: 42 },
      config
    );

    expect(mockGetAccount).toHaveBeenCalledWith(APPROVER_ONE.publicKey());
  });
});

describe('depositToTreasury', () => {
  it('calls deposit with the funder and scaled amount', async () => {
    await depositToTreasury(
      { treasuryContractId: TREASURY_ID, from: ADMIN.publicKey(), amount: '100.00' },
      config
    );

    expect(invokedFunctionName()).toBe('deposit');
    expect(invokedArgs()).toHaveLength(2);
  });
});

describe('getTreasuryState', () => {
  beforeEach(() => {
    const responses: Record<string, xdr.ScVal> = {
      get_balance: xdr.ScVal.scvI128(
        new xdr.Int128Parts({
          hi: xdr.Int64.fromString('0'),
          lo: xdr.Uint64.fromString('5000000000'),
        })
      ),
      get_threshold: xdr.ScVal.scvU32(2),
      get_approvers: xdr.ScVal.scvVec([]),
      get_categories: xdr.ScVal.scvVec([]),
    };

    mockSimulateTransaction.mockImplementation(async (transaction: Transaction) => {
      simulated = transaction;
      const operation = transaction.operations[0] as unknown as { func: xdr.HostFunction };
      const name = operation.func.invokeContract().functionName().toString();
      return { result: { auth: [], retval: responses[name] } };
    });
  });

  it('reads balance, threshold, approvers and categories in one call', async () => {
    const state = await getTreasuryState(TREASURY_ID, config);

    expect(state.contractId).toBe(TREASURY_ID);
    expect(state.balance).toBe('500.0000000');
    expect(state.threshold).toBe(2);
    expect(state.approvers).toEqual([]);
    expect(state.categories).toEqual([]);
  });

  it('never fetches an account — reads are pure simulation', async () => {
    await getTreasuryState(TREASURY_ID, config);

    expect(mockGetAccount).not.toHaveBeenCalled();
  });

  it('surfaces a simulation error rather than reporting a zero balance', async () => {
    mockIsSimulationError.mockReturnValue(true);
    mockSimulateTransaction.mockResolvedValue({ error: 'HostError: not initialized' });

    await expect(getTreasuryState(TREASURY_ID, config)).rejects.toThrow(CharterError);
  });
});

describe('readDeployedOrgId', () => {
  it('returns the org id from a successful deployment', async () => {
    const { rpc } = await import('@stellar/stellar-sdk');
    mockGetTransaction.mockResolvedValue({
      status: rpc.Api.GetTransactionStatus.SUCCESS,
      returnValue: xdr.ScVal.scvU32(7),
    });

    await expect(readDeployedOrgId('abc123', config)).resolves.toBe(7);
  });

  it('returns null while the transaction is still pending, so callers can poll', async () => {
    const { rpc } = await import('@stellar/stellar-sdk');
    mockGetTransaction.mockResolvedValue({ status: rpc.Api.GetTransactionStatus.NOT_FOUND });

    await expect(readDeployedOrgId('abc123', config)).resolves.toBeNull();
  });

  it('throws when the deployment failed', async () => {
    const { rpc } = await import('@stellar/stellar-sdk');
    mockGetTransaction.mockResolvedValue({ status: rpc.Api.GetTransactionStatus.FAILED });

    await expect(readDeployedOrgId('abc123', config)).rejects.toThrow(CharterError);
  });
});

describe('getOrgRecord', () => {
  it('maps Charter’s snake_case record onto the SDK shape', async () => {
    mockSimulateTransaction.mockResolvedValue({
      result: {
        auth: [],
        retval: xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('admin'),
            val: xdr.ScVal.scvString(ADMIN.publicKey()),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('created_ledger'),
            val: xdr.ScVal.scvU32(500),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('name'),
            val: xdr.ScVal.scvString('Kano Logistics'),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('treasury'),
            val: xdr.ScVal.scvString(TREASURY_ID),
          }),
        ]),
      },
    });

    await expect(getOrgRecord(FACTORY_ID, 7, config)).resolves.toEqual({
      name: 'Kano Logistics',
      treasury: TREASURY_ID,
      admin: ADMIN.publicKey(),
      createdLedger: 500,
    });
  });
});

describe('getPayoutRequest', () => {
  it('normalises the unit-variant status enum and scales the amount', async () => {
    mockSimulateTransaction.mockResolvedValue({
      result: {
        auth: [],
        retval: xdr.ScVal.scvMap(
          [
            {
              key: 'amount',
              val: xdr.ScVal.scvI128(
                new xdr.Int128Parts({
                  hi: xdr.Int64.fromString('0'),
                  lo: xdr.Uint64.fromString('2505000000'),
                })
              ),
            },
            { key: 'approvals', val: xdr.ScVal.scvVec([]) },
            { key: 'category_id', val: xdr.ScVal.scvU32(1) },
            { key: 'created_ledger', val: xdr.ScVal.scvU32(900) },
            { key: 'id', val: xdr.ScVal.scvU32(3) },
            { key: 'memo', val: xdr.ScVal.scvString('payroll-run-7') },
            { key: 'recipient', val: xdr.ScVal.scvString(RECIPIENT.publicKey()) },
            { key: 'requester', val: xdr.ScVal.scvString(ADMIN.publicKey()) },
            { key: 'status', val: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Pending')]) },
          ].map(({ key, val }) => new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol(key), val }))
        ),
      },
    });

    await expect(getPayoutRequest(TREASURY_ID, 3, config)).resolves.toMatchObject({
      id: 3,
      categoryId: 1,
      amount: '250.5000000',
      status: 'Pending',
      memo: 'payroll-run-7',
    });
  });

  it('throws on an unrecognised status rather than returning undefined', async () => {
    mockSimulateTransaction.mockResolvedValue({
      result: {
        auth: [],
        retval: xdr.ScVal.scvMap(
          [
            {
              key: 'amount',
              val: xdr.ScVal.scvI128(
                new xdr.Int128Parts({
                  hi: xdr.Int64.fromString('0'),
                  lo: xdr.Uint64.fromString('1'),
                })
              ),
            },
            { key: 'approvals', val: xdr.ScVal.scvVec([]) },
            { key: 'category_id', val: xdr.ScVal.scvU32(1) },
            { key: 'created_ledger', val: xdr.ScVal.scvU32(900) },
            { key: 'id', val: xdr.ScVal.scvU32(3) },
            { key: 'memo', val: xdr.ScVal.scvString('') },
            { key: 'recipient', val: xdr.ScVal.scvString(RECIPIENT.publicKey()) },
            { key: 'requester', val: xdr.ScVal.scvString(ADMIN.publicKey()) },
            { key: 'status', val: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Unknown')]) },
          ].map(({ key, val }) => new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol(key), val }))
        ),
      },
    });

    await expect(getPayoutRequest(TREASURY_ID, 3, config)).rejects.toThrow(/Unrecognised/);
  });
});

describe('token decimals', () => {
  it('defaults to the seven decimals a USDC Stellar Asset Contract carries', () => {
    expect(TREASURY_TOKEN_DECIMALS).toBe(7);
  });
});
