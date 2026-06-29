import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { Balance, PaymentResult, TransactionRecord } from './types';
import { HORIZON_TESTNET_URL, USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from './types';

const server = new Horizon.Server(HORIZON_TESTNET_URL);

const USDC_ASSET = new Asset(USDC_ASSET_CODE, USDC_ISSUER_TESTNET);

/**
 * @description Sends a USDC payment on the Stellar testnet from one account to another.
 * Loads the sender's account, builds a payment operation, optionally attaches a text memo,
 * signs the transaction with the sender's secret key, and submits it to Horizon.
 *
 * The sender must have:
 * - A funded account with enough XLM to cover transaction fees (minimum ~1 XLM recommended)
 * - An active USDC trustline (see {@link establishUsdcTrustline})
 * - Sufficient USDC balance to cover the requested amount
 *
 * @param senderSecret - The Stellar secret key of the sending account (56-character string starting with `S`)
 * @param recipientPublicKey - The Stellar public key of the recipient account (56-character string starting with `G`)
 * @param amount - Payment amount in USDC as a decimal string, e.g. `"250.00"` (up to 7 decimal places)
 * @param memo - Optional text memo attached to the transaction, maximum 28 bytes
 *
 * @returns A `Promise` resolving to a {@link PaymentResult} containing the transaction `hash`,
 * the `ledger` sequence number it was included in, and a `successful` boolean flag
 *
 * @throws {Error} If `senderSecret` is not a valid Stellar secret key format
 * @throws {Error} If `recipientPublicKey` is not a valid Stellar public key format
 * @throws {Error} If the sender's account does not exist on the testnet
 * @throws {Error} If the sender has insufficient USDC balance for the requested amount
 * @throws {Error} If the recipient does not have a USDC trustline established
 * @throws {Error} If the transaction submission fails or times out (Horizon error)
 *
 * @example
 * ```ts
 * import { sendPayment } from '@afriwage/sdk';
 *
 * const result = await sendPayment(
 *   'SCZANGBA5AKIA5JKPKZTA53JLXQHXPFGTQWNV2TH7KXCOBOIFG7CVJJXR',
 *   'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
 *   '250.00',
 *   'Invoice #42'
 * );
 * console.log('Transaction hash:', result.hash);
 * console.log('Ledger:', result.ledger);
 * console.log('Success:', result.successful);
 * ```
 */
export async function sendPayment(
  senderSecret: string,
  recipientPublicKey: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  const senderKeypair = Keypair.fromSecret(senderSecret);
  const senderPublicKey = senderKeypair.publicKey();

  const account = await server.loadAccount(senderPublicKey);

  const txBuilder = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  });

  txBuilder.addOperation(
    Operation.payment({
      destination: recipientPublicKey,
      asset: USDC_ASSET,
      amount,
    })
  );

  if (memo) {
    txBuilder.addMemo(Memo.text(memo));
  }

  // Transaction valid for 30 seconds
  txBuilder.setTimeout(30);

  const transaction = txBuilder.build();
  transaction.sign(senderKeypair);

  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    ledger: result.ledger,
    successful: result.successful,
  };
}

/**
 * @description Retrieves the native XLM and USDC balances for a Stellar testnet account.
 * Loads the account from Horizon and iterates over its balance entries to extract the
 * relevant amounts. If the account has no USDC trustline, the USDC balance is returned as `"0.00"`.
 *
 * @param publicKey - The Stellar public key of the account to query (56-character string starting with `G`)
 *
 * @returns A `Promise` resolving to a {@link Balance} object with:
 * - `xlm` — native XLM balance formatted to 7 decimal places (e.g. `"9999.9999900"`)
 * - `usdc` — USDC balance formatted to 2 decimal places (e.g. `"250.00"`), or `"0.00"` if no trustline
 *
 * @throws {Error} If `publicKey` is not a valid Stellar public key format
 * @throws {Error} If the account does not exist on the testnet (account not funded)
 * @throws {Error} If the Horizon server is unreachable
 *
 * @example
 * ```ts
 * import { getBalance } from '@afriwage/sdk';
 *
 * const balance = await getBalance('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
 * console.log('XLM balance:', balance.xlm);   // e.g. "9999.9999900"
 * console.log('USDC balance:', balance.usdc); // e.g. "250.00"
 * ```
 */
export async function getBalance(publicKey: string): Promise<Balance> {
  const account = await server.loadAccount(publicKey);

  let xlm = '0';
  let usdc = '0';

  for (const balance of account.balances) {
    if (balance.asset_type === 'native') {
      xlm = Number.parseFloat(balance.balance).toFixed(7);
    } else if (
      balance.asset_type === 'credit_alphanum4' &&
      balance.asset_code === USDC_ASSET_CODE &&
      balance.asset_issuer === USDC_ISSUER_TESTNET
    ) {
      usdc = Number.parseFloat(balance.balance).toFixed(2);
    }
  }

  return { xlm, usdc };
}

/**
 * @description Retrieves the 20 most recent transactions for a Stellar testnet account,
 * ordered newest-first. For each transaction, the associated operations are fetched to
 * extract payment details (amount, asset, sender, recipient). Text memos are decoded and
 * included when present.
 *
 * Only `payment` and `create_account` operation types are parsed in detail; all other
 * operation types are classified as `"other"` with a zero amount.
 *
 * @param publicKey - The Stellar public key of the account to query (56-character string starting with `G`)
 *
 * @returns A `Promise` resolving to an array of up to 20 {@link TransactionRecord} objects,
 * ordered from most recent to oldest. Each record includes:
 * - `id` — Horizon's internal transaction ID
 * - `hash` — the transaction hash (used for receipts and block explorer links)
 * - `type` — `"payment"`, `"create_account"`, or `"other"`
 * - `amount` — formatted to 2 decimal places
 * - `asset` — asset code string, e.g. `"USDC"` or `"XLM"`
 * - `from` — sender's public key
 * - `to` — recipient's public key
 * - `memo` — decoded text memo, if present
 * - `createdAt` — ISO 8601 timestamp string
 * - `successful` — whether the transaction was successfully applied to the ledger
 *
 * @throws {Error} If `publicKey` is not a valid Stellar public key format
 * @throws {Error} If the account does not exist on the testnet
 * @throws {Error} If the Horizon server is unreachable
 *
 * @example
 * ```ts
 * import { getTransactionHistory } from '@afriwage/sdk';
 *
 * const history = await getTransactionHistory('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
 * for (const tx of history) {
 *   console.log(`[${tx.createdAt}] ${tx.type} — ${tx.amount} ${tx.asset}`);
 *   if (tx.memo) console.log('  Memo:', tx.memo);
 * }
 * ```
 */
export async function getTransactionHistory(publicKey: string): Promise<TransactionRecord[]> {
  const transactions = await server
    .transactions()
    .forAccount(publicKey)
    .order('desc')
    .limit(20)
    .call();

  const records: TransactionRecord[] = [];

  for (const tx of transactions.records) {
    // Fetch operations for this transaction to extract payment details
    const opsPage = await server.operations().forTransaction(tx.hash).call();
    const ops = opsPage.records;

    let type: TransactionRecord['type'] = 'other';
    let amount = '0';
    let asset = 'XLM';
    let from = tx.source_account;
    let to = '';

    for (const op of ops) {
      if (op.type === 'payment') {
        type = 'payment';
        const payOp = op as Horizon.HorizonApi.PaymentOperationResponse;
        amount = Number.parseFloat(payOp.amount).toFixed(2);
        asset =
          payOp.asset_type === 'native'
            ? 'XLM'
            : `${(payOp as { asset_code?: string }).asset_code ?? 'UNKNOWN'}`;
        from = payOp.from;
        to = payOp.to;
        break;
      }
      if (op.type === 'create_account') {
        type = 'create_account';
        const createOp = op as Horizon.HorizonApi.CreateAccountOperationResponse;
        amount = Number.parseFloat(createOp.starting_balance).toFixed(2);
        asset = 'XLM';
        to = createOp.account;
        break;
      }
    }

    // Decode memo if text type
    let memo: string | undefined;
    if (tx.memo_type === 'text' && tx.memo) {
      memo = tx.memo;
    }

    records.push({
      id: tx.id,
      hash: tx.hash,
      type,
      amount,
      asset,
      from,
      to,
      memo,
      createdAt: tx.created_at,
      successful: tx.successful,
    });
  }

  return records;
}

/**
 * @description Establishes a USDC trustline for a Stellar testnet account by submitting a
 * `changeTrust` operation. A trustline must be created before an account can receive or hold
 * USDC. This operation costs a small XLM fee and slightly increases the account's minimum
 * balance reserve.
 *
 * This only needs to be called once per account. If the trustline already exists, the
 * operation is a no-op on the ledger (it succeeds without changing state).
 *
 * @param accountSecret - The Stellar secret key of the account to add the trustline to
 * (56-character string starting with `S`)
 *
 * @returns A `Promise` resolving to a {@link PaymentResult} containing the transaction `hash`,
 * the `ledger` sequence number, and a `successful` boolean flag
 *
 * @throws {Error} If `accountSecret` is not a valid Stellar secret key format
 * @throws {Error} If the account does not exist on the testnet (not yet funded)
 * @throws {Error} If the account has insufficient XLM to cover the transaction fee and reserve
 * @throws {Error} If the transaction submission fails or times out (Horizon error)
 *
 * @example
 * ```ts
 * import { createKeypair, fundTestnetAccount, establishUsdcTrustline } from '@afriwage/sdk';
 *
 * // Create and fund a fresh testnet account
 * const { publicKey, secretKey } = createKeypair();
 * await fundTestnetAccount(publicKey);
 *
 * // Establish the USDC trustline so the account can receive USDC payments
 * const result = await establishUsdcTrustline(secretKey);
 * console.log('Trustline tx hash:', result.hash);
 * console.log('Success:', result.successful);
 * ```
 */
export async function establishUsdcTrustline(accountSecret: string): Promise<PaymentResult> {
  const keypair = Keypair.fromSecret(accountSecret);
  const account = await server.loadAccount(keypair.publicKey());

  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: USDC_ASSET,
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(keypair);

  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    ledger: result.ledger,
    successful: result.successful,
  };
}
