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
 * Sends a USDC payment on the Stellar testnet.
 *
 * The sender must have a funded account (XLM for fees), a USDC trustline, and sufficient balance.
 *
 * @param senderSecret - The S... secret key of the sending account
 * @param recipientPublicKey - The G... public key of the recipient
 * @param amount - The amount of USDC to send (e.g. "10.00")
 * @param memo - Optional text memo (max 28 bytes)
 * @returns {Promise<PaymentResult>} Transaction hash, ledger number, and success flag
 * @example
 * ```ts
 * const result = await sendPayment(
 *   'S...',
 *   'G...',
 *   '25.00',
 *   'June payroll'
 * );
 * console.log(result.hash);
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
 * Retrieves the XLM and USDC balances for a Stellar account.
 *
 * @param publicKey - The G... public key of the account
 * @returns {Promise<Balance>} XLM balance (7 decimal places) and USDC balance (2 decimal places)
 * @example
 * ```ts
 * const balance = await getBalance('G...');
 * console.log(balance.xlm, balance.usdc);
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
 * Returns the last 20 transactions for a Stellar account,
 * parsed into a human-friendly TransactionRecord format.
 *
 * @param publicKey - The G... public key of the account
 * @returns Array of TransactionRecord objects, newest first
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
 * Establishes a USDC trustline for an account.
 * Required before the account can receive or hold USDC.
 *
 * @param accountSecret - The S... secret key of the account
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
