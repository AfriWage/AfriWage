import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from './types';

export const STREAM_DECIMALS = 7;
const STREAM_SCALE = 10n ** BigInt(STREAM_DECIMALS);

export type StreamStatus = 'active' | 'completed' | 'cancelled';
export type StreamTimeInput = Date | number | string;

export interface StreamSnapshot {
  id: string;
  employer: string;
  recipient: string;
  totalAmount: string;
  withdrawnAmount: string;
  startTime: StreamTimeInput;
  endTime: StreamTimeInput;
  status: StreamStatus;
  cancelledAt?: StreamTimeInput;
  assetCode?: string;
  assetIssuer?: string;
}

export interface CreateStreamParams {
  contractId: string;
  rpcUrl: string;
  senderSecret: string;
  recipientPublicKey: string;
  totalAmount: string;
  startTime: StreamTimeInput;
  endTime: StreamTimeInput;
  networkPassphrase?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
}

export interface WithdrawStreamParams {
  contractId: string;
  rpcUrl: string;
  senderSecret: string;
  streamId: string;
  networkPassphrase?: string;
}

export interface CancelStreamParams {
  contractId: string;
  rpcUrl: string;
  senderSecret: string;
  streamId: string;
  networkPassphrase?: string;
}

export interface StreamActionResult {
  hash: string;
  ledger: number;
  successful: boolean;
  streamId?: string;
}

const DEFAULT_STREAM_NETWORK_PASSPHRASE = Networks.TESTNET;

const toSeconds = (input: StreamTimeInput): number => {
  if (input instanceof Date) {
    return Math.floor(input.getTime() / 1000);
  }

  if (typeof input === 'number') {
    return input > 1_000_000_000_000 ? Math.floor(input / 1000) : Math.floor(input);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid stream timestamp: ${String(input)}`);
  }

  return Math.floor(parsed.getTime() / 1000);
};

export const toAtomicAmount = (amount: string): bigint => {
  const normalized = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid USDC amount: ${amount}`);
  }

  const [whole, fraction = ''] = normalized.split('.');
  const fractionPart = fraction.padEnd(STREAM_DECIMALS, '0').slice(0, STREAM_DECIMALS);
  return BigInt(whole) * STREAM_SCALE + BigInt(fractionPart || '0');
};

export const fromAtomicAmount = (amount: bigint): string => {
  if (amount < 0n) {
    throw new Error('Amount cannot be negative');
  }

  const whole = amount / STREAM_SCALE;
  const fraction = amount % STREAM_SCALE;

  if (fraction === 0n) {
    return whole.toString();
  }

  return `${whole.toString()}.${fraction.toString().padStart(STREAM_DECIMALS, '0').replace(/0+$/, '')}`;
};

export const claimableAmount = (
  stream: StreamSnapshot,
  now: StreamTimeInput = new Date()
): string => {
  const totalAtoms = toAtomicAmount(stream.totalAmount);
  const withdrawnAtoms = toAtomicAmount(stream.withdrawnAmount || '0');
  const start = toSeconds(stream.startTime);
  const baseEnd = toSeconds(stream.endTime);
  const effectiveEnd =
    stream.status === 'cancelled' && stream.cancelledAt
      ? Math.min(baseEnd, toSeconds(stream.cancelledAt))
      : baseEnd;
  const current = Math.max(start, Math.min(toSeconds(now), effectiveEnd));
  const duration = BigInt(Math.max(1, baseEnd - start));

  let vestedAtoms = 0n;
  if (current > start) {
    const elapsed = BigInt(current - start);
    vestedAtoms = (totalAtoms * elapsed) / duration;
  }

  if (stream.status === 'completed') {
    vestedAtoms = totalAtoms;
  }

  const claimableAtoms = vestedAtoms > withdrawnAtoms ? vestedAtoms - withdrawnAtoms : 0n;
  return fromAtomicAmount(claimableAtoms);
};

const submitStreamTransaction = async (params: {
  contractId: string;
  rpcUrl: string;
  senderSecret: string;
  networkPassphrase?: string;
  functionName: 'create_stream' | 'withdraw' | 'cancel_stream';
  args: unknown[];
}): Promise<StreamActionResult> => {
  const server = new SorobanRpc.Server(params.rpcUrl);
  const senderKeypair = Keypair.fromSecret(params.senderSecret);
  const sourceAccount = await server.getAccount(senderKeypair.publicKey());
  const contract = new Contract(params.contractId);
  const networkPassphrase = params.networkPassphrase ?? DEFAULT_STREAM_NETWORK_PASSPHRASE;

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation((contract as any).call(params.functionName, ...params.args))
    .setTimeout(180)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (!SorobanRpc.Api.isSimulationSuccess(simulation)) {
    throw new Error(`Soroban simulation failed for ${params.functionName}`);
  }

  const prepared = SorobanRpc.assembleTransaction(transaction, simulation).build();
  prepared.sign(senderKeypair);

  const response = await server.sendTransaction(prepared);
  if (response.status !== 'PENDING') {
    throw new Error(`Soroban transaction failed for ${params.functionName}`);
  }

  const streamId =
    simulation.result?.retval !== undefined ? String(scValToNative(simulation.result.retval)) : undefined;

  return {
    hash: response.hash,
    ledger: Number((response as { ledger?: number }).ledger ?? 0),
    successful: true,
    streamId,
  };
};

/**
 * Creates a new streaming payroll payment on Soroban.
 */
export const createStream = async (params: CreateStreamParams): Promise<StreamActionResult> => {
  const startTime = toSeconds(params.startTime);
  const endTime = toSeconds(params.endTime);

  if (endTime <= startTime) {
    throw new Error('endTime must be greater than startTime');
  }

  const totalAtoms = toAtomicAmount(params.totalAmount);
  const args = [
    nativeToScVal(params.recipientPublicKey, { type: 'string' }),
    nativeToScVal(totalAtoms.toString(), { type: 'i128' }),
    nativeToScVal(startTime, { type: 'u64' }),
    nativeToScVal(endTime, { type: 'u64' }),
    nativeToScVal(params.assetCode ?? USDC_ASSET_CODE, { type: 'symbol' }),
    nativeToScVal(params.assetIssuer ?? USDC_ISSUER_TESTNET, { type: 'string' }),
    nativeToScVal(params.memo ?? '', { type: 'string' }),
  ];

  return submitStreamTransaction({
    contractId: params.contractId,
    rpcUrl: params.rpcUrl,
    senderSecret: params.senderSecret,
    networkPassphrase: params.networkPassphrase,
    functionName: 'create_stream',
    args,
  });
};

/**
 * Withdraws claimable USDC from an existing stream.
 */
export const withdraw = async (params: WithdrawStreamParams): Promise<StreamActionResult> => {
  return submitStreamTransaction({
    contractId: params.contractId,
    rpcUrl: params.rpcUrl,
    senderSecret: params.senderSecret,
    networkPassphrase: params.networkPassphrase,
    functionName: 'withdraw',
    args: [nativeToScVal(params.streamId, { type: 'string' })],
  });
};

/**
 * Cancels a stream and refunds unvested funds to the sender.
 */
export const cancelStream = async (
  params: CancelStreamParams
): Promise<StreamActionResult> => {
  return submitStreamTransaction({
    contractId: params.contractId,
    rpcUrl: params.rpcUrl,
    senderSecret: params.senderSecret,
    networkPassphrase: params.networkPassphrase,
    functionName: 'cancel_stream',
    args: [nativeToScVal(params.streamId, { type: 'string' })],
  });
};
