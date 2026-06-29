import {
  Account,
  Asset,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

export const MAX_PAYMENT_OPERATIONS = 100;
const USDC_ASSET_CODE = 'USDC';
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export interface BuildPaymentItem {
  recipientPublicKey: string;
  amount: string;
}

export interface ParsedBuildPaymentRequest {
  senderPublicKey: string;
  payments: BuildPaymentItem[];
  memo?: string;
}

interface BuildPaymentTransactionParams {
  sourceAccount: Account;
  payments: BuildPaymentItem[];
  memo?: string;
}

const USDC_ASSET = new Asset(USDC_ASSET_CODE, USDC_ISSUER_TESTNET);
const AMOUNT_PATTERN = /^\d+(\.\d{1,7})?$/;

export class BuildPaymentRequestError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requirePublicKey(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !StrKey.isValidEd25519PublicKey(value)) {
    throw new BuildPaymentRequestError(`${fieldName} must be a valid Stellar public key`);
  }

  return value;
}

function requireAmount(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !AMOUNT_PATTERN.test(value) || Number.parseFloat(value) <= 0) {
    throw new BuildPaymentRequestError(`${fieldName} must be a positive decimal amount`);
  }

  return value;
}

function parsePaymentItem(value: unknown, index: number): BuildPaymentItem {
  if (!isRecord(value)) {
    throw new BuildPaymentRequestError(`payments[${index}] must be an object`);
  }

  return {
    recipientPublicKey: requirePublicKey(
      value.recipientPublicKey,
      `payments[${index}].recipientPublicKey`
    ),
    amount: requireAmount(value.amount, `payments[${index}].amount`),
  };
}

export function parseBuildPaymentRequest(body: unknown): ParsedBuildPaymentRequest {
  if (!isRecord(body)) {
    throw new BuildPaymentRequestError('Request body must be an object');
  }

  const senderPublicKey = requirePublicKey(body.senderPublicKey, 'senderPublicKey');
  const payments = Array.isArray(body.payments)
    ? body.payments.map(parsePaymentItem)
    : [
        {
          recipientPublicKey: requirePublicKey(body.recipientPublicKey, 'recipientPublicKey'),
          amount: requireAmount(body.amount, 'amount'),
        },
      ];

  if (payments.length === 0) {
    throw new BuildPaymentRequestError('At least one payment is required');
  }

  if (payments.length > MAX_PAYMENT_OPERATIONS) {
    throw new BuildPaymentRequestError(
      `A single transaction can include at most ${MAX_PAYMENT_OPERATIONS} payments`
    );
  }

  const memo = typeof body.memo === 'string' && body.memo.length > 0 ? body.memo : undefined;
  if (memo && new TextEncoder().encode(memo).length > 28) {
    throw new BuildPaymentRequestError('memo must be 28 bytes or fewer');
  }

  return {
    senderPublicKey,
    payments,
    memo,
  };
}

export function buildPaymentTransactionXdr({
  sourceAccount,
  payments,
  memo,
}: BuildPaymentTransactionParams) {
  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  });

  for (const payment of payments) {
    txBuilder.addOperation(
      Operation.payment({
        destination: payment.recipientPublicKey,
        asset: USDC_ASSET,
        amount: payment.amount,
      })
    );
  }

  if (memo) {
    txBuilder.addMemo(Memo.text(memo));
  }

  return txBuilder.setTimeout(120).build().toXDR();
}
