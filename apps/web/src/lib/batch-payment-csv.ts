import { StrKey } from '@stellar/stellar-sdk';
import Papa from 'papaparse';
import { MAX_PAYMENT_OPERATIONS } from '../app/api/build-payment/build-payment';

export type BatchRowErrorCode = 'emptyRow' | 'missingFields' | 'invalidAddress' | 'invalidAmount';

export interface BatchCsvRow {
  address?: string;
  amount?: string;
  memo?: string;
}

export interface ParsedBatchRow {
  address: string;
  amount: string;
  memo: string;
  error?: BatchRowErrorCode;
}

export interface BatchRowValidation {
  valid: boolean;
  error?: BatchRowErrorCode;
  data?: { address: string; amount: string; memo: string };
}

export type BatchFileError = 'emptyFile' | 'tooManyPayments';

export const MAX_BATCH_PAYMENTS = MAX_PAYMENT_OPERATIONS;

export function validateBatchRow(row: BatchCsvRow): BatchRowValidation {
  const address = row.address?.trim() ?? '';
  const amount = row.amount?.trim() ?? '';
  const memo = row.memo?.trim() ?? '';

  if (!address && !amount && !memo) {
    return { valid: false, error: 'emptyRow' };
  }

  if (!address || !amount) {
    return { valid: false, error: 'missingFields' };
  }

  if (!StrKey.isValidEd25519PublicKey(address)) {
    return { valid: false, error: 'invalidAddress' };
  }

  const parsedAmount = Number.parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return { valid: false, error: 'invalidAmount' };
  }

  return {
    valid: true,
    data: { address, amount, memo },
  };
}

export function parseBatchCsv(text: string): ParsedBatchRow[] {
  const result = Papa.parse<BatchCsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row) => {
    const validation = validateBatchRow(row);
    return {
      address: row.address?.trim() ?? '',
      amount: row.amount?.trim() ?? '',
      memo: row.memo?.trim() ?? '',
      error: validation.valid ? undefined : validation.error,
    };
  });
}

export function validateBatchFile(
  rows: ParsedBatchRow[]
): { valid: true } | { valid: false; reason: BatchFileError } {
  if (rows.length === 0) {
    return { valid: false, reason: 'emptyFile' };
  }

  const validCount = rows.filter((row) => !row.error).length;
  if (validCount > MAX_BATCH_PAYMENTS) {
    return { valid: false, reason: 'tooManyPayments' };
  }

  return { valid: true };
}
