import { Keypair } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH_FILE_BYTES,
  MAX_BATCH_PAYMENTS,
  isBatchFileTooLarge,
  parseBatchCsv,
  validateBatchFile,
  validateBatchRow,
} from './batch-payment-csv';

function publicKey() {
  return Keypair.random().publicKey();
}

function validCsv(rowCount: number, amount = '10.00') {
  const key = publicKey();
  const rows = Array.from({ length: rowCount }, (_, index) => {
    return `${key},${amount},Memo ${index}`;
  });
  return `address,amount,memo\n${rows.join('\n')}`;
}

describe('batch payment CSV parsing', () => {
  it('parses a valid CSV into the expected row set', () => {
    const first = publicKey();
    const second = publicKey();
    const csv = `address,amount,memo\n${first},25.00,January payroll\n${second},50.00,Contractor fee`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows).toEqual([
      { address: first, amount: '25.00', memo: 'January payroll' },
      { address: second, amount: '50.00', memo: 'Contractor fee' },
    ]);
    expect(parsed.rows.every((row) => row.error === undefined)).toBe(true);
  });

  it('trims whitespace from parsed fields', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n ${address} , 12.34 ,  padded memo `;

    const parsed = parseBatchCsv(csv);

    expect(parsed.rows).toEqual([
      { address: address.trim(), amount: '12.34', memo: 'padded memo' },
    ]);
  });

  it('rejects malformed rows with a per-row invalid address error', () => {
    const address = publicKey();
    const csv = `address,amount,memo\nnot-a-valid-address,25.00,payroll\n${address},10.00,fine`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      address: 'not-a-valid-address',
      error: 'invalidAddress',
    });
    expect(parsed.rows[1]).toMatchObject({ address, error: undefined });
  });

  it('rejects rows with invalid amounts', () => {
    const address = publicKey();
    const amounts = [
      '-5.00',
      'abc',
      '10.5x',
      '1abc',
      '1e2',
      'Infinity',
      '0',
      '0.00',
      '.5',
      '1.00000001',
    ];
    const csv = `address,amount,memo\n${amounts
      .map((amount) => `${address},${amount},memo`)
      .join('\n')}`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows.every((row) => row.error === 'invalidAmount')).toBe(true);
  });

  it('accepts amounts that match the SDK/API rule', () => {
    const address = publicKey();
    const amounts = ['25.00', '0.0000001', '1000000', '99.9999999', '1'];
    const csv = `address,amount,memo\n${amounts
      .map((amount) => `${address},${amount},memo`)
      .join('\n')}`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows.every((row) => row.error === undefined)).toBe(true);
  });

  it('validates positive decimal amounts without relying on floating-point parsing', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},0.0000001,valid\n${address},0.1,valid\n${address},0.3000000,valid\n${address},0,invalid`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows.map((row) => row.error)).toEqual([
      undefined,
      undefined,
      undefined,
      'invalidAmount',
    ]);
  });

  it('rejects rows with missing required columns', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},,missing amount\n,25.00,missing address`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows.every((row) => row.error === 'missingFields')).toBe(true);
  });

  it('rejects fully empty rows', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},10.00,ok\n,,`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toEqual([]);
    expect(parsed.rows[1]).toMatchObject({ error: 'emptyRow' });
  });

  it('rejects a row with an extra column as a parse error', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},25.00,payroll,EXTRA`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toHaveLength(1);
    expect(parsed.parseErrors[0].code).toBe('TooManyFields');
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'parseError' });
  });

  it('rejects a row with a missing field as a parse error', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},25.00`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toHaveLength(1);
    expect(parsed.parseErrors[0].code).toBe('TooFewFields');
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'parseError' });
  });

  it('rejects a row with an unterminated quote as a parse error', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},25.00,"unterminated`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.parseErrors).toHaveLength(1);
    expect(parsed.parseErrors[0].code).toBe('MissingQuotes');
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'parseError' });
  });

  it('handles an empty file without crashing', () => {
    const parsed = parseBatchCsv('');

    expect(parsed.rows).toEqual([]);
    expect(parsed.parseErrors).toEqual([]);
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'emptyFile' });
  });

  it('handles a CSV containing only blank lines without crashing', () => {
    const parsed = parseBatchCsv('\n\n\n');

    expect(parsed.rows).toEqual([]);
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'emptyFile' });
  });

  it('accepts a file with exactly MAX_BATCH_PAYMENTS rows', () => {
    const parsed = parseBatchCsv(validCsv(MAX_BATCH_PAYMENTS));

    expect(parsed.rows).toHaveLength(MAX_BATCH_PAYMENTS);
    expect(parsed.rows.every((row) => row.error === undefined)).toBe(true);
    expect(validateBatchFile(parsed)).toEqual({ valid: true });
  });

  it('rejects a file exceeding MAX_BATCH_PAYMENTS rows', () => {
    const parsed = parseBatchCsv(validCsv(MAX_BATCH_PAYMENTS + 50));

    expect(parsed.rows).toHaveLength(MAX_BATCH_PAYMENTS + 1);
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'tooManyPayments' });
  });

  it('counts invalid rows toward the payment cap', () => {
    const address = publicKey();
    const validRows = Array.from({ length: MAX_BATCH_PAYMENTS }, (_, index) => {
      const key = publicKey();
      return `${key},10.00,Memo ${index}`;
    });
    const csv = `address,amount,memo\n${validRows.join('\n')}\n${address},not-an-amount,invalid`;

    const parsed = parseBatchCsv(csv);

    expect(parsed.rows).toHaveLength(MAX_BATCH_PAYMENTS + 1);
    expect(parsed.rows[parsed.rows.length - 1]).toMatchObject({ error: 'invalidAmount' });
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'tooManyPayments' });
  });

  it('stream-aborts so an oversized file never accumulates unbounded rows', () => {
    const parsed = parseBatchCsv(validCsv(100_000));

    expect(parsed.rows.length).toBeLessThanOrEqual(MAX_BATCH_PAYMENTS + 1);
    expect(validateBatchFile(parsed)).toEqual({ valid: false, reason: 'tooManyPayments' });
  });

  it('flags files larger than the byte-size guard', () => {
    expect(isBatchFileTooLarge(MAX_BATCH_FILE_BYTES)).toBe(false);
    expect(isBatchFileTooLarge(MAX_BATCH_FILE_BYTES + 1)).toBe(true);
  });

  it('does not let a single row pair validate as a batch', () => {
    const address = publicKey();

    expect(validateBatchRow({ address, amount: '1.00', memo: 'ok' }).valid).toBe(true);
    expect(validateBatchRow({ address, amount: '0' }).valid).toBe(false);
    expect(validateBatchRow({ address }).valid).toBe(false);
    expect(validateBatchRow({}).valid).toBe(false);
  });
});
