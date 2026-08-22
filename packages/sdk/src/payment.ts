import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  formatTransactionHistoryAmount,
  parseHorizonAmount,
  prepareAmountForStellar,
} from './amount-utils';
import type { Balance, PaymentResult, TransactionRecord } from './types';
import { HORIZON_TESTNET_URL, USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from './types';

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
      const amount = parseHorizonAmount(balance.balance, 'XLM balance');
      xlm = prepareAmountForStellar(amount, 'XLM');
    } else if (
      balance.asset_type === 'credit_alphanum4' &&
      balance.asset_code === USDC_ASSET_CODE &&
      balance.asset_issuer === USDC_ISSUER_TESTNET
    ) {
      const amount = parseHorizonAmount(balance.balance, 'USDC balance');
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

  if (transactions.records.length === 0) {
    return [];
  }

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
        asset =
          payOp.asset_type === 'native'
            ? 'XLM'
            : `${(payOp as { asset_code?: string }).asset_code ?? 'UNKNOWN'}`;
        amount = formatTransactionHistoryAmount(payOp.amount);
        from = payOp.from;
        to = payOp.to;
        break;
      }
      if (op.type === 'create_account') {
        type = 'create_account';
        const createOp = op as Horizon.HorizonApi.CreateAccountOperationResponse;
        asset = 'XLM';
        amount = formatTransactionHistoryAmount(createOp.starting_balance);
        to = createOp.account;
        break;
      }
    }

    let memo: string | undefined;
    if (tx.memo_type === 'text' && tx.memo) {
      memo = tx.memo;
    }

      let memo: string | undefined;
      if (tx.memo_type === 'text' && tx.memo) {
        memo = tx.memo;
      }

      return {
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
      };
    })
  );
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
