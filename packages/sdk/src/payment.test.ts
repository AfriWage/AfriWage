import { Account, Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import {
  buildPaymentTransactionXdr,
  BuildPaymentRequestError,
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
      // The amount should now be a decimal string with 7 decimal places for XLM
      // or 2 decimal places for USDC. The test expects it to be in the correct format.
      expect(operation.amount).toMatch(/^(\d+\.\d{2}|\d+\.\d{7})$/);
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

  describe('amount validation', () => {
    it('accepts valid amounts with up to 7 decimal places', () => {
      const senderPublicKey = publicKey();
      const recipientPublicKey = publicKey();

      expect(
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '25.00' })
      ).toBeTruthy();
      expect(
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '0.0000001' })
      ).toBeTruthy();
      expect(
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '1000000' })
      ).toBeTruthy();
      expect(
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '99.9999999' })
      ).toBeTruthy();
    });

    it('rejects negative amounts', () => {
      const senderPublicKey = publicKey();
      const recipientPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '-10.00' })
      ).toThrow(BuildPaymentRequestError);
    });

    it('rejects zero amounts', () => {
      const senderPublicKey = publicKey();
      const recipientPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '0' })
      ).toThrow('must be greater than zero');
      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '0.00' })
      ).toThrow('must be greater than zero');
    });

    it('rejects non-numeric strings', () => {
      const senderPublicKey = publicKey();
      const recipientPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: 'abc' })
      ).toThrow(BuildPaymentRequestError);
      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '10.5x' })
      ).toThrow(BuildPaymentRequestError);
      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '' })
      ).toThrow(BuildPaymentRequestError);
    });

    it('rejects amounts with more than 7 decimal places', () => {
      const senderPublicKey = publicKey();
      const recipientPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '1.00000001' })
      ).toThrow('up to 7 decimal places');
      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '0.00000001' })
      ).toThrow('up to 7 decimal places');
      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '0.123456789' })
      ).toThrow('up to 7 decimal places');
    });
  });

  describe('public key validation', () => {
    it('accepts valid ed25519 public keys for sender and recipient', () => {
      const senderPublicKey = publicKey();
      const recipientPublicKey = publicKey();

      expect(
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey, amount: '10.00' })
      ).toMatchObject({ senderPublicKey, payments: [{ recipientPublicKey }] });
    });

    it('rejects a malformed senderPublicKey', () => {
      const recipientPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({
          senderPublicKey: 'not-a-key',
          recipientPublicKey,
          amount: '10.00',
        })
      ).toThrow('senderPublicKey must be a valid Stellar public key');

      expect(() =>
        parseBuildPaymentRequest({
          senderPublicKey: 'GBADKEY',
          recipientPublicKey,
          amount: '10.00',
        })
      ).toThrow('senderPublicKey must be a valid Stellar public key');

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey: '', recipientPublicKey, amount: '10.00' })
      ).toThrow('senderPublicKey must be a valid Stellar public key');
    });

    it('rejects a malformed recipientPublicKey', () => {
      const senderPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({
          senderPublicKey,
          recipientPublicKey: 'not-a-key',
          amount: '10.00',
        })
      ).toThrow('recipientPublicKey must be a valid Stellar public key');

      expect(() =>
        parseBuildPaymentRequest({
          senderPublicKey,
          recipientPublicKey: 'GBADKEY',
          amount: '10.00',
        })
      ).toThrow('recipientPublicKey must be a valid Stellar public key');

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey, recipientPublicKey: '', amount: '10.00' })
      ).toThrow('recipientPublicKey must be a valid Stellar public key');
    });

    it('rejects a malformed recipientPublicKey inside the payments array', () => {
      const senderPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({
          senderPublicKey,
          payments: [{ recipientPublicKey: 'not-a-key', amount: '10.00' }],
        })
      ).toThrow('payments[0].recipientPublicKey must be a valid Stellar public key');
    });

    it('rejects missing public keys', () => {
      const recipientPublicKey = publicKey();

      expect(() =>
        parseBuildPaymentRequest({ recipientPublicKey, amount: '10.00' })
      ).toThrow('senderPublicKey must be a valid Stellar public key');

      expect(() =>
        parseBuildPaymentRequest({ senderPublicKey: publicKey(), amount: '10.00' })
      ).toThrow('recipientPublicKey must be a valid Stellar public key');
    });
  });
});
