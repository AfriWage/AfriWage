import { SendPaymentParamsSchema } from '@AfriWage/sdk';
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

export type BatchFileError = 'emptyFile' | 'tooManyPayments' | 'parseError';

export interface ParsedBatchCsv {
  rows: ParsedBatchRow[];
  parseErrors: Papa.ParseError[];
}

export const MAX_BATCH_PAYMENTS = MAX_PAYMENT_OPERATIONS;
export const MAX_BATCH_FILE_BYTES = 1_000_000;

// Reuse the SDK amount rule (same schema the payment API validates against) so
// the UI never marks a batch valid that the API would reject.
const BATCH_AMOUNT_SCHEMA = SendPaymentParamsSchema.shape.amount;

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

  const amountCheck = BATCH_AMOUNT_SCHEMA.safeParse(amount);
  if (!amountCheck.success || Number.parseFloat(amountCheck.data) <= 0) {
    return { valid: false, error: 'invalidAmount' };
  }

  return {
    valid: true,
    data: { address, amount, memo },
  };
}

export function parseBatchCsv(text: string): ParsedBatchCsv {
  const rows: ParsedBatchRow[] = [];
  const parseErrors: Papa.ParseError[] = [];

  Papa.parse<BatchCsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    step: (stepResult, parser) => {
      if (stepResult.errors.length > 0) {
        parseErrors.push(...stepResult.errors);
        parser.abort();
        return;
      }

      const row = stepResult.data;
      const validation = validateBatchRow(row);
      rows.push({
        address: row.address?.trim() ?? '',
        amount: row.amount?.trim() ?? '',
        memo: row.memo?.trim() ?? '',
        error: validation.valid ? undefined : validation.error,
      });

      // Stream-abort once the cap is exceeded so an oversized CSV cannot
      // accumulate unbounded rows in memory or freeze the review page.
      if (rows.length > MAX_BATCH_PAYMENTS) {
        parser.abort();
      }
    },
  });

  return { rows, parseErrors };
}

export function isBatchFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > MAX_BATCH_FILE_BYTES;
}

export function validateBatchFile(
  parsed: ParsedBatchCsv
): { valid: true } | { valid: false; reason: BatchFileError } {
  if (parsed.parseErrors.length > 0) {
    return { valid: false, reason: 'parseError' };
  }

  if (parsed.rows.length === 0) {
    return { valid: false, reason: 'emptyFile' };
  }

  if (parsed.rows.length > MAX_BATCH_PAYMENTS) {
    return { valid: false, reason: 'tooManyPayments' };
  }

  return { valid: true };
}
