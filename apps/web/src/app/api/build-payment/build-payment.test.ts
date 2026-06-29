import { Account, Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import {
  buildPaymentTransactionXdr,
  MAX_PAYMENT_OPERATIONS,
  parseBuildPaymentRequest,
} from './build-payment';

function publicKey() {
  return Keypair.random().publicKey();
}

describe('build payment transactions', () => {
  it('builds one transaction XDR containing every requested payment operation', () => {
    const senderPublicKey = publicKey();
    const payments = [
      { recipientPublicKey: publicKey(), amount: '10.50' },
      { recipientPublicKey: publicKey(), amount: '20.25' },
    ];

    const xdr = buildPaymentTransactionXdr({
      sourceAccount: new Account(senderPublicKey, '1'),
      payments,
    });
    const transaction = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);

    expect(transaction.operations).toHaveLength(payments.length);

    for (let index = 0; index < transaction.operations.length; index++) {
      const operation = transaction.operations[index];
      expect(operation.type).toBe('payment');
      if (operation.type !== 'payment') {
        throw new Error('Expected a payment operation');
      }
      expect(operation.destination).toBe(payments[index].recipientPublicKey);
      expect(operation.amount).toBe(Number.parseFloat(payments[index].amount).toFixed(7));
      expect(operation.asset.getCode()).toBe('USDC');
    }
  });

  it('accepts array payloads with up to 100 payment items', () => {
    const senderPublicKey = publicKey();
    const payments = Array.from({ length: MAX_PAYMENT_OPERATIONS }, () => ({
      recipientPublicKey: publicKey(),
      amount: '1.00',
    }));

    expect(parseBuildPaymentRequest({ senderPublicKey, payments }).payments).toHaveLength(
      MAX_PAYMENT_OPERATIONS
    );
  });

  it('rejects payloads larger than one Stellar transaction chunk', () => {
    const senderPublicKey = publicKey();
    const payments = Array.from({ length: MAX_PAYMENT_OPERATIONS + 1 }, () => ({
      recipientPublicKey: publicKey(),
      amount: '1.00',
    }));

    expect(() => parseBuildPaymentRequest({ senderPublicKey, payments })).toThrow(
      `at most ${MAX_PAYMENT_OPERATIONS} payments`
    );
  });
});
