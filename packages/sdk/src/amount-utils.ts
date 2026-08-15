import { Decimal } from 'decimal.js';

/**
 * Parse an amount string to a Decimal.
 */
export function parseAmount(amount: string): Decimal {
  if (!amount || amount.trim() === '') {
    return new Decimal('0');
  }

  return new Decimal(amount);
}

/**
 * Parse a Horizon-reported balance or operation amount without rejecting
 * valid fractional precision (e.g. USDC balances with more than 2 decimals).
 */
export function parseHorizonAmount(amount: string, fieldName: string): Decimal {
  let decimalAmount: Decimal;

  try {
    decimalAmount = parseAmount(amount);
  } catch {
    throw new Error(`${fieldName} must be a valid positive number`);
  }

  if (!decimalAmount.isFinite() || decimalAmount.isNegative()) {
    throw new Error(`${fieldName} must be a valid positive number`);
  }

  return decimalAmount;
}

/**
 * Format a Decimal to the display precision for a given asset.
 */
export function formatAmountForDisplay(amount: Decimal, asset: string): string {
  const decimalPlaces = asset === 'XLM' ? 7 : 2;
  return amount.toFixed(decimalPlaces);
}

/**
 * Prepare an amount string for Stellar SDK operations or balance responses.
 */
export function prepareAmountForStellar(amount: Decimal, asset: string): string {
  return formatAmountForDisplay(amount, asset);
}

/**
 * Validate that a user-supplied amount is valid for the given asset.
 */
export function validateAmount(amount: Decimal, asset: string): boolean {
  if (!amount.isFinite() || amount.isNegative()) {
    return false;
  }

  const decimalPlaces = amount.decimalPlaces();

  if (asset === 'USDC') {
    return decimalPlaces <= 2;
  }

  if (asset === 'XLM') {
    return decimalPlaces <= 7;
  }

  return true;
}

export function addAmounts(a: Decimal, b: Decimal): Decimal {
  return a.plus(b);
}

export function subtractAmounts(a: Decimal, b: Decimal): Decimal {
  return a.minus(b);
}

/**
 * Parse and validate a user-supplied amount string.
 * @throws {Error} if the amount is invalid for the asset
 */
export function parseAndValidateAmount(amount: string, asset: string, fieldName: string): Decimal {
  const decimalAmount = parseHorizonAmount(amount, fieldName);

  if (!validateAmount(decimalAmount, asset)) {
    if (asset === 'USDC') {
      throw new Error(`${fieldName} must have at most 2 decimal places for USDC`);
    }
    if (asset === 'XLM') {
      throw new Error(`${fieldName} must have at most 7 decimal places for XLM`);
    }
    throw new Error(`${fieldName} must be a valid positive number`);
  }

  return decimalAmount;
}

/**
 * Format a Horizon amount for transaction history display (2 decimal places).
 */
export function formatTransactionHistoryAmount(amount: string): string {
  return parseHorizonAmount(amount, 'amount').toFixed(2);
}
