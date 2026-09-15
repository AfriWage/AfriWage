/**
 * Charter treasury integration.
 *
 * Charter (https://github.com/fadesany/charter-contract) is a pair of Soroban
 * contracts: a **factory** that deploys and registers per-organization
 * treasuries from one verified wasm hash, and a **treasury** that holds a
 * single token, groups it into budget categories with lifetime caps, and
 * releases funds through a request-and-approval flow that auto-executes once
 * the approval threshold is met.
 *
 * AfriWage builds these invocations but never signs them. Every function that
 * moves value returns unsigned XDR for an authorised org member to sign in
 * Freighter — the same build-sign-submit shape the existing `/api/build-payment`
 * → `/api/submit-tx` pair already uses.
 *
 * Signatures here follow the deployed contract, verified against the source at
 * `contracts/factory/src/lib.rs` and `contracts/treasury/src/lib.rs`:
 *
 * ```rust
 * // factory
 * fn deploy_treasury(name: String, admin: Address, approvers: Vec<Address>,
 *                    threshold: u32, token: Address) -> u32   // returns org_id
 * fn get_org(org_id: u32) -> OrgRecord
 *
 * // treasury
 * fn create_category(admin: Address, name: String, cap: i128) -> u32
 * fn deposit(from: Address, amount: i128)
 * fn submit_request(requester: Address, category_id: u32, recipient: Address,
 *                   amount: i128, memo: String) -> u32        // returns request_id
 * fn approve_request(approver: Address, request_id: u32)      // auto-executes at threshold
 * fn get_categories() -> Vec<Category>
 * fn get_request(request_id: u32) -> Request
 * fn get_balance() -> i128
 * fn get_approvers() -> Vec<Address>
 * fn get_threshold() -> u32
 * ```
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  type Keypair,
  Operation,
  TransactionBuilder,
  authorizeEntry,
  contract as contractModule,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { Decimal } from 'decimal.js';

/** Raised for a failed simulation or a malformed on-chain response. */
export class CharterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CharterError';
  }
}

export interface CharterConfig {
  /** Soroban RPC endpoint, e.g. https://soroban-testnet.stellar.org. */
  rpcUrl: string;
  networkPassphrase: string;
  /** Permits a plain-http RPC, for a local quickstart only. */
  allowHttp?: boolean;
}

/**
 * Decimal places of the token a treasury holds.
 *
 * Charter takes every amount as an `i128` in the token's smallest unit. USDC
 * reaches Soroban as a Stellar Asset Contract, which carries the classic
 * asset's 7 decimals — the same precision `build-payment.ts` already accepts.
 */
export const TREASURY_TOKEN_DECIMALS = 7;

/** Validity window for an unsigned transaction, matching build-payment.ts. */
const TRANSACTION_TIMEOUT_SECONDS = 120;

/**
 * Ledgers a server-side authorization entry stays valid for — roughly an hour
 * at five seconds a ledger. Long enough for a member to review and sign in
 * Freighter, short enough that an abandoned XDR expires on its own.
 */
const AUTH_ENTRY_VALID_LEDGERS = 720;

/** Placeholder source for read-only simulations; never signs, never pays. */
const READ_ONLY_SOURCE = contractModule.NULL_ACCOUNT;

export type CharterRequestStatus = 'Pending' | 'Executed' | 'Rejected' | 'Cancelled';

export interface CharterCategory {
  /** Charter assigns ids sequentially from 1, in creation order. */
  id: number;
  name: string;
  /** Lifetime cap, as a decimal string in token units. */
  cap: string;
  /** Released so far against the cap, as a decimal string in token units. */
  spent: string;
  active: boolean;
}

export interface CharterRequest {
  id: number;
  categoryId: number;
  recipient: string;
  /** Requested amount, as a decimal string in token units. */
  amount: string;
  memo: string;
  requester: string;
  approvals: string[];
  status: CharterRequestStatus;
  createdLedger: number;
}

export interface CharterOrgRecord {
  name: string;
  /** The deployed treasury contract address. */
  treasury: string;
  admin: string;
  createdLedger: number;
}

export interface TreasuryState {
  contractId: string;
  /** Token balance held by the treasury, as a decimal string. */
  balance: string;
  threshold: number;
  approvers: string[];
  categories: CharterCategory[];
}

/**
 * Converts a decimal amount string to the integer token units Charter expects.
 *
 * Throws rather than rounding when the value carries more precision than the
 * token can represent — silently truncating a wage is the one outcome a payroll
 * system must never produce.
 */
export function toTokenUnits(amount: string, decimals = TREASURY_TOKEN_DECIMALS): bigint {
  let scaled: Decimal;

  try {
    scaled = new Decimal(amount).mul(Decimal.pow(10, decimals));
  } catch {
    throw new CharterError(`Amount "${amount}" is not a valid decimal number`);
  }

  if (!scaled.isFinite()) {
    throw new CharterError(`Amount "${amount}" is not a finite number`);
  }

  if (!scaled.isInteger()) {
    throw new CharterError(
      `Amount "${amount}" has more than ${decimals} decimal places and cannot be represented exactly`
    );
  }

  return BigInt(scaled.toFixed(0));
}

/** Converts integer token units back to a decimal string. */
export function fromTokenUnits(
  units: bigint | string | number,
  decimals = TREASURY_TOKEN_DECIMALS
): string {
  return new Decimal(units.toString()).div(Decimal.pow(10, decimals)).toFixed(decimals);
}

function rpcServer(config: CharterConfig): rpc.Server {
  return new rpc.Server(config.rpcUrl, { allowHttp: config.allowHttp ?? false });
}

function addressArg(value: string): xdr.ScVal {
  return new Address(value).toScVal();
}

function u32Arg(value: number): xdr.ScVal {
  if (!Number.isInteger(value) || value < 0) {
    throw new CharterError(`Expected a non-negative integer, received ${value}`);
  }

  return nativeToScVal(value, { type: 'u32' });
}

function i128Arg(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: 'i128' });
}

function stringArg(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: 'string' });
}

function addressVecArg(values: string[]): xdr.ScVal {
  return xdr.ScVal.scvVec(values.map(addressArg));
}

interface ContractCallParams {
  contractId: string;
  method: string;
  args: xdr.ScVal[];
  /** Account that sources the transaction, pays the fee, and signs client-side. */
  sourcePublicKey: string;
  config: CharterConfig;
  /**
   * Keypairs that must authorise the invocation in addition to the source
   * account. Only the Charter factory's `deployer` ever needs this.
   */
  coSigners?: Keypair[];
}

function simulationErrorMessage(
  simulation: rpc.Api.SimulateTransactionResponse,
  method: string
): string {
  const error = (simulation as rpc.Api.SimulateTransactionErrorResponse).error;
  return `Charter ${method} simulation failed: ${error ?? 'unknown error'}`;
}

/**
 * Builds and simulates a contract invocation, returning unsigned XDR.
 *
 * Simulation is what fills in the Soroban footprint, resource fee and
 * authorization entries, so it is required even though nothing is submitted
 * here. It also surfaces a contract error (an exceeded cap, a non-approver)
 * before the member is ever asked to sign.
 */
async function buildContractCall({
  contractId,
  method,
  args,
  sourcePublicKey,
  config,
  coSigners = [],
}: ContractCallParams): Promise<string> {
  const server = rpcServer(config);
  const account = await server.getAccount(sourcePublicKey);
  const invocation = new Contract(contractId).call(method, ...args);

  const raw = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(invocation)
    .setTimeout(TRANSACTION_TIMEOUT_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(raw);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new CharterError(simulationErrorMessage(simulation, method));
  }

  if (coSigners.length === 0) {
    return rpc.assembleTransaction(raw, simulation).build().toXDR();
  }

  // A co-signed invocation needs its authorization entries signed *before*
  // assembly: assembleTransaction keeps entries already present on the
  // operation and drops the simulation's own, so signing after assembly would
  // be overwritten. Build a second raw transaction carrying the signed
  // entries, then simulate that one to price it.
  const signedAuth = await signAuthEntries({
    entries: simulation.result?.auth ?? [],
    coSigners,
    server,
    config,
  });

  const authorized = new TransactionBuilder(await server.getAccount(sourcePublicKey), {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: invocation.body().invokeHostFunctionOp().hostFunction(),
        auth: signedAuth,
      })
    )
    .setTimeout(TRANSACTION_TIMEOUT_SECONDS)
    .build();

  const authorizedSimulation = await server.simulateTransaction(authorized);

  if (rpc.Api.isSimulationError(authorizedSimulation)) {
    throw new CharterError(simulationErrorMessage(authorizedSimulation, method));
  }

  return rpc.assembleTransaction(authorized, authorizedSimulation).build().toXDR();
}

interface SignAuthEntriesParams {
  entries: xdr.SorobanAuthorizationEntry[];
  coSigners: Keypair[];
  server: rpc.Server;
  config: CharterConfig;
}

/**
 * Signs the authorization entries belonging to the given co-signers.
 *
 * Entries credentialed to the transaction source account are left untouched —
 * the member's envelope signature covers those. Only address-credentialed
 * entries matching a co-signer are signed here.
 */
async function signAuthEntries({
  entries,
  coSigners,
  server,
  config,
}: SignAuthEntriesParams): Promise<xdr.SorobanAuthorizationEntry[]> {
  const signersByAddress = new Map(coSigners.map((signer) => [signer.publicKey(), signer]));
  const { sequence } = await server.getLatestLedger();
  const validUntilLedgerSeq = sequence + AUTH_ENTRY_VALID_LEDGERS;

  return Promise.all(
    entries.map(async (entry) => {
      if (entry.credentials().switch() !== xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
        return entry;
      }

      const entryAddress = Address.fromScAddress(
        entry.credentials().address().address()
      ).toString();
      const signer = signersByAddress.get(entryAddress);

      return signer
        ? authorizeEntry(entry, signer, validUntilLedgerSeq, config.networkPassphrase)
        : entry;
    })
  );
}

/** Runs a read-only view function through simulation. No account, no signing. */
async function simulateView(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  config: CharterConfig
): Promise<unknown> {
  const server = rpcServer(config);

  const transaction = new TransactionBuilder(new Account(READ_ONLY_SOURCE, '0'), {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(TRANSACTION_TIMEOUT_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new CharterError(simulationErrorMessage(simulation, method));
  }

  const returnValue = simulation.result?.retval;

  if (!returnValue) {
    throw new CharterError(`Charter ${method} returned no value`);
  }

  return scValToNative(returnValue);
}

/**
 * Normalises a Charter `RequestStatus`.
 *
 * A unit-variant `#[contracttype]` enum reaches the wire as a single-element
 * vector holding a symbol, so `scValToNative` yields `['Pending']` rather than
 * `'Pending'`. Both shapes are accepted so a future encoding change does not
 * silently produce an undefined status.
 */
function normaliseStatus(value: unknown): CharterRequestStatus {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === 'Pending' || raw === 'Executed' || raw === 'Rejected' || raw === 'Cancelled') {
    return raw;
  }

  throw new CharterError(`Unrecognised Charter request status: ${JSON.stringify(value)}`);
}

interface RawCategory {
  name: string;
  cap: bigint;
  spent: bigint;
  active: boolean;
}

interface RawRequest {
  id: number;
  category_id: number;
  recipient: string;
  amount: bigint;
  memo: string;
  requester: string;
  approvals: string[];
  status: unknown;
  created_ledger: number;
}

function toCategory(raw: RawCategory, id: number, decimals: number): CharterCategory {
  return {
    id,
    name: raw.name,
    cap: fromTokenUnits(raw.cap, decimals),
    spent: fromTokenUnits(raw.spent, decimals),
    active: raw.active,
  };
}

function toRequest(raw: RawRequest, decimals: number): CharterRequest {
  return {
    id: raw.id,
    categoryId: raw.category_id,
    recipient: raw.recipient,
    amount: fromTokenUnits(raw.amount, decimals),
    memo: raw.memo,
    requester: raw.requester,
    approvals: raw.approvals,
    status: normaliseStatus(raw.status),
    createdLedger: raw.created_ledger,
  };
}

export interface ProvisionTreasuryParams {
  factoryContractId: string;
  /** Org name recorded in Charter's public registry. */
  name: string;
  /** Treasury admin — the org owner's wallet. Sources and signs the transaction. */
  admin: string;
  /** Approver addresses; AfriWage maps these to the org's `payer` members. */
  approvers: string[];
  /** Approvals required before a payout executes. */
  threshold: number;
  /** Token the treasury will hold — USDC's Stellar Asset Contract address. */
  tokenContractId: string;
  /**
   * Keypair of the factory's registered `deployer`.
   *
   * Charter's factory is permissioned: `deploy_treasury` calls
   * `deployer.require_auth()` as well as `admin.require_auth()`, so a
   * deployment cannot be authorised by the org alone. This key signs *only*
   * that deployment authorization entry. It is not an approver on any treasury
   * and cannot submit, approve or execute a payout — those require an org
   * member's own signature and are built unsigned by the functions below.
   */
  deployerKeypair: Keypair;
}

/**
 * Builds the unsigned transaction that deploys a treasury for an organization.
 *
 * The org admin is the transaction source, so they pay the fee and their
 * `require_auth` is satisfied by the envelope signature they add in Freighter.
 *
 * `deploy_treasury` returns the new org id, not the treasury address. Submit
 * the signed transaction, then pass its hash to {@link readDeployedOrgId} and
 * the id to {@link getOrgRecord} to resolve the deployed address — Charter
 * assigns ids sequentially, so reading the count instead would race with any
 * other organization provisioning at the same moment.
 */
export async function provisionTreasury(
  params: ProvisionTreasuryParams,
  config: CharterConfig
): Promise<{ xdr: string }> {
  if (params.threshold < 1) {
    throw new CharterError('Approval threshold must be at least 1');
  }

  if (params.approvers.length < params.threshold) {
    throw new CharterError(
      `Approval threshold ${params.threshold} exceeds the ${params.approvers.length} approver(s) provided`
    );
  }

  const xdrString = await buildContractCall({
    contractId: params.factoryContractId,
    method: 'deploy_treasury',
    args: [
      stringArg(params.name),
      addressArg(params.admin),
      addressVecArg(params.approvers),
      u32Arg(params.threshold),
      addressArg(params.tokenContractId),
    ],
    sourcePublicKey: params.admin,
    config,
    coSigners: [params.deployerKeypair],
  });

  return { xdr: xdrString };
}

/**
 * Reads the org id returned by a submitted `deploy_treasury` transaction.
 *
 * Returns null while the transaction is still pending, so a caller can poll.
 */
export async function readDeployedOrgId(
  transactionHash: string,
  config: CharterConfig
): Promise<number | null> {
  const server = rpcServer(config);
  const result = await server.getTransaction(transactionHash);

  if (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    return null;
  }

  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new CharterError(`Treasury deployment did not succeed (status ${result.status})`);
  }

  if (!result.returnValue) {
    throw new CharterError('Treasury deployment returned no org id');
  }

  return Number(scValToNative(result.returnValue));
}

/** Reads one org record from the factory's public registry. */
export async function getOrgRecord(
  factoryContractId: string,
  orgId: number,
  config: CharterConfig
): Promise<CharterOrgRecord> {
  const raw = (await simulateView(factoryContractId, 'get_org', [u32Arg(orgId)], config)) as {
    name: string;
    treasury: string;
    admin: string;
    created_ledger: number;
  };

  return {
    name: raw.name,
    treasury: raw.treasury,
    admin: raw.admin,
    createdLedger: raw.created_ledger,
  };
}

export interface CreateSpendCategoryParams {
  treasuryContractId: string;
  /** Treasury admin; sources and signs the transaction. */
  admin: string;
  name: string;
  /** Lifetime cap as a decimal string, e.g. "25000.00". */
  capAmount: string;
  decimals?: number;
}

/** Builds the unsigned transaction creating a budget category with a lifetime cap. */
export async function createSpendCategory(
  params: CreateSpendCategoryParams,
  config: CharterConfig
): Promise<string> {
  return buildContractCall({
    contractId: params.treasuryContractId,
    method: 'create_category',
    args: [
      addressArg(params.admin),
      stringArg(params.name),
      i128Arg(toTokenUnits(params.capAmount, params.decimals)),
    ],
    sourcePublicKey: params.admin,
    config,
  });
}

export interface DepositParams {
  treasuryContractId: string;
  /** Account funding the treasury; sources and signs the transaction. */
  from: string;
  amount: string;
  decimals?: number;
}

/** Builds the unsigned transaction moving tokens into the treasury's balance. */
export async function depositToTreasury(
  params: DepositParams,
  config: CharterConfig
): Promise<string> {
  return buildContractCall({
    contractId: params.treasuryContractId,
    method: 'deposit',
    args: [addressArg(params.from), i128Arg(toTokenUnits(params.amount, params.decimals))],
    sourcePublicKey: params.from,
    config,
  });
}

export interface RequestPayoutParams {
  treasuryContractId: string;
  /** Member submitting the request; sources and signs the transaction. */
  requester: string;
  categoryId: number;
  recipient: string;
  amount: string;
  /** Free-form memo recorded on-chain with the request. */
  memo: string;
  decimals?: number;
}

/**
 * Builds the unsigned transaction submitting a spend request against a category.
 *
 * Unlike a raw `build-payment` transfer this releases nothing on its own: the
 * payout executes inside Charter only once `approve_request` has been called by
 * enough approvers to meet the treasury's threshold.
 */
export async function requestPayout(
  params: RequestPayoutParams,
  config: CharterConfig
): Promise<string> {
  return buildContractCall({
    contractId: params.treasuryContractId,
    method: 'submit_request',
    args: [
      addressArg(params.requester),
      u32Arg(params.categoryId),
      addressArg(params.recipient),
      i128Arg(toTokenUnits(params.amount, params.decimals)),
      stringArg(params.memo),
    ],
    sourcePublicKey: params.requester,
    config,
  });
}

export interface ApprovePayoutParams {
  treasuryContractId: string;
  /** Approver's wallet; sources and signs the transaction. */
  approver: string;
  requestId: number;
}

/**
 * Builds the unsigned transaction approving a pending request.
 *
 * Charter executes the payout automatically inside this same call once the
 * approval count reaches the threshold, so the approval that tips the balance
 * is also the transaction that moves the funds.
 */
export async function approvePayout(
  params: ApprovePayoutParams,
  config: CharterConfig
): Promise<string> {
  return buildContractCall({
    contractId: params.treasuryContractId,
    method: 'approve_request',
    args: [addressArg(params.approver), u32Arg(params.requestId)],
    sourcePublicKey: params.approver,
    config,
  });
}

/** Reads one request, including its approvals and lifecycle status. */
export async function getPayoutRequest(
  treasuryContractId: string,
  requestId: number,
  config: CharterConfig,
  decimals = TREASURY_TOKEN_DECIMALS
): Promise<CharterRequest> {
  const raw = (await simulateView(
    treasuryContractId,
    'get_request',
    [u32Arg(requestId)],
    config
  )) as RawRequest;

  return toRequest(raw, decimals);
}

/**
 * Reads a treasury's balance, approver set, threshold and categories.
 *
 * Every call is a read-only simulation — nothing is signed and nothing is
 * submitted.
 *
 * Category ids are derived from position because Charter's `Category` struct
 * carries no id and `get_categories` returns them in creation order starting at
 * 1. That mapping holds because categories are deactivated, never deleted.
 */
export async function getTreasuryState(
  treasuryContractId: string,
  config: CharterConfig,
  decimals = TREASURY_TOKEN_DECIMALS
): Promise<TreasuryState> {
  const [balance, threshold, approvers, categories] = await Promise.all([
    simulateView(treasuryContractId, 'get_balance', [], config) as Promise<bigint>,
    simulateView(treasuryContractId, 'get_threshold', [], config) as Promise<number>,
    simulateView(treasuryContractId, 'get_approvers', [], config) as Promise<string[]>,
    simulateView(treasuryContractId, 'get_categories', [], config) as Promise<RawCategory[]>,
  ]);

  return {
    contractId: treasuryContractId,
    balance: fromTokenUnits(balance, decimals),
    threshold,
    approvers,
    categories: categories.map((category, index) => toCategory(category, index + 1, decimals)),
  };
}
