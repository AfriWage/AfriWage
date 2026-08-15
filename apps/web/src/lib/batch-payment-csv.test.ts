import { Keypair } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH_PAYMENTS,
  parseBatchCsv,
  validateBatchFile,
  validateBatchRow,
} from './batch-payment-csv';

function publicKey() {
  return Keypair.random().publicKey();
}

function validCsv(rowCount: number, amount = '10.00') {
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const key = publicKey();
    return `${key},${amount},Memo ${index}`;
  });
  return `address,amount,memo\n${rows.join('\n')}`;
}

describe('batch payment CSV parsing', () => {
  it('parses a valid CSV into the expected row set', () => {
    const first = publicKey();
    const second = publicKey();
    const csv = `address,amount,memo\n${first},25.00,January payroll\n${second},50.00,Contractor fee`;

    const rows = parseBatchCsv(csv);

    expect(rows).toEqual([
      { address: first, amount: '25.00', memo: 'January payroll' },
      { address: second, amount: '50.00', memo: 'Contractor fee' },
    ]);
    expect(rows.every((row) => row.error === undefined)).toBe(true);
  });

  it('trims whitespace from parsed fields', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n ${address} , 12.34 ,  padded memo `;

    const rows = parseBatchCsv(csv);

    expect(rows).toEqual([{ address: address.trim(), amount: '12.34', memo: 'padded memo' }]);
  });

  it('rejects malformed rows with a per-row invalid address error', () => {
    const address = publicKey();
    const csv = `address,amount,memo\nnot-a-valid-address,25.00,payroll\n${address},10.00,fine`;

    const rows = parseBatchCsv(csv);

    expect(rows[0]).toMatchObject({ address: 'not-a-valid-address', error: 'invalidAddress' });
    expect(rows[1]).toMatchObject({ address, error: undefined });
  });

  it('rejects rows with invalid amounts', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},-5.00,negative\n${address},abc,not numeric\n${address},0,zero`;

    const rows = parseBatchCsv(csv);

    expect(rows.map((row) => row.error)).toEqual([
      'invalidAmount',
      'invalidAmount',
      'invalidAmount',
    ]);
  });

  it('rejects rows with missing required columns', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},,missing amount\n,25.00,missing address`;

    const rows = parseBatchCsv(csv);

    expect(rows.every((row) => row.error === 'missingFields')).toBe(true);
  });

  it('rejects fully empty rows', () => {
    const address = publicKey();
    const csv = `address,amount,memo\n${address},10.00,ok\n,,`;

    const rows = parseBatchCsv(csv);

    expect(rows[1]).toMatchObject({ error: 'emptyRow' });
  });

  it('handles an empty file without crashing', () => {
    expect(parseBatchCsv('')).toEqual([]);

    const result = validateBatchFile(parseBatchCsv(''));
    expect(result).toEqual({ valid: false, reason: 'emptyFile' });
  });

  it('handles a CSV containing only blank lines without crashing', () => {
    const rows = parseBatchCsv('\n\n\n');

    expect(rows).toEqual([]);
    expect(validateBatchFile(rows)).toEqual({ valid: false, reason: 'emptyFile' });
  });

  it('accepts a file with exactly MAX_BATCH_PAYMENTS valid rows', () => {
    const rows = parseBatchCsv(validCsv(MAX_BATCH_PAYMENTS));

    expect(rows).toHaveLength(MAX_BATCH_PAYMENTS);
    expect(rows.every((row) => row.error === undefined)).toBe(true);
    expect(validateBatchFile(rows)).toEqual({ valid: true });
  });

  it('rejects a file exceeding MAX_BATCH_PAYMENTS valid rows', () => {
    const rows = parseBatchCsv(validCsv(MAX_BATCH_PAYMENTS + 1));

    expect(rows).toHaveLength(MAX_BATCH_PAYMENTS + 1);
    expect(validateBatchFile(rows)).toEqual({ valid: false, reason: 'tooManyPayments' });
  });

  it('does not let a single row pair validate as a batch', () => {
    const address = publicKey();

    expect(validateBatchRow({ address, amount: '1.00', memo: 'ok' }).valid).toBe(true);
    expect(validateBatchRow({ address, amount: '0' }).valid).toBe(false);
    expect(validateBatchRow({ address }).valid).toBe(false);
    expect(validateBatchRow({}).valid).toBe(false);
  });
});
