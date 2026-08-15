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
import { parseAndValidateAmount, prepareAmountForStellar } from './amount-utils';

const server = new Horizon.Server(HORIZON_TESTNET_URL);

const USDC_ASSET = new Asset(USDC_ASSET_CODE, USDC_ISSUER_TESTNET);

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

export async function getBalance(publicKey: string): Promise<Balance> {
  const account = await server.loadAccount(publicKey);

  let xlm = '0';
  let usdc = '0';

  for (const balance of account.balances) {
    if (balance.asset_type === 'native') {
      const amount = parseAndValidateAmount(balance.balance, 'XLM', 'XLM balance');
      xlm = prepareAmountForStellar(amount, 'XLM');
    } else if (
      balance.asset_type === 'credit_alphanum4' &&
      balance.asset_code === USDC_ASSET_CODE &&
      balance.asset_issuer === USDC_ISSUER_TESTNET
    ) {
      const amount = parseAndValidateAmount(balance.balance, 'USDC', 'USDC balance');
      usdc = prepareAmountForStellar(amount, 'USDC');
    }
  }

  return { xlm, usdc };
}

export async function getTransactionHistory(publicKey: string): Promise<TransactionRecord[]> {
  const transactions = await server
    .transactions()
    .forAccount(publicKey)
    .order('desc')
    .limit(20)
    .call();

  const records: TransactionRecord[] = [];

  for (const tx of transactions.records) {
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
        const amountDecimal = parseAndValidateAmount(payOp.amount, 'USDC', 'payment amount');
        amount = prepareAmountForStellar(amountDecimal, 'USDC');
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
        const amountDecimal = parseAndValidateAmount(createOp.starting_balance, 'XLM', 'create account amount');
        amount = prepareAmountForStellar(amountDecimal, 'XLM');
        asset = 'XLM';
        to = createOp.account;
        break;
      }
    }

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
