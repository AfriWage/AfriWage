import { Decimal } from 'decimal.js';

/**
 * Parse an amount string to a Decimal, ensuring proper precision handling
 */
export function parseAmount(amount: string): Decimal {
  // Handle empty or whitespace-only strings
  if (!amount || amount.trim() === '') {
    return new Decimal('0');
  }
  
  // Use Decimal constructor which safely handles decimal strings
  return new Decimal(amount);
}

/**
 * Format a Decimal to the exact number of decimal places for a given asset
 */
export function formatAmountForDisplay(amount: Decimal, asset: string): string {
  // XLM needs 7 decimal places, USDC needs 2 decimal places
  const decimalPlaces = asset === 'XLM' ? 7 : 2;
  return amount.toFixed(decimalPlaces);
}

/**
 * Parse an amount for Stellar SDK operations
 * Returns a string with the exact representation needed for the SDK
 */
export function prepareAmountForStellar(amount: Decimal, asset: string): string {
  // For Stellar SDK, we need to ensure the exact representation
  // Based on the code I've seen, amounts are passed as strings directly
  // but we need to ensure precision is maintained
  
  // Format to the appropriate number of decimal places for the asset
  const decimalPlaces = asset === 'XLM' ? 7 : 2;
  return amount.toFixed(decimalPlaces);
}

/**
 * Validate that an amount is valid for the given asset
 */
export function validateAmount(amount: Decimal, asset: string): boolean {
  if (!amount.isFinite()) {
    return false;
  }
  
  // Check if amount is negative (negative amounts should not be allowed)
  if (amount.isNegative()) {
    return false;
  }
  
  // For USDC, check that we have exactly 2 decimal places when displayed
  if (asset === 'USDC') {
    // This is more of a display validation - the actual input
    // should already be validated by Zod schema
    const formatted = amount.toFixed(2);
    return amount.toString() === formatted || parseFloat(formatted) === amount.toNumber();
  }
  
  return true;
}

/**
 * Perform safe arithmetic operations on decimal amounts
 */
export function addAmounts(a: Decimal, b: Decimal): Decimal {
  return a.plus(b);
}

export function subtractAmounts(a: Decimal, b: Decimal): Decimal {
  return a.minus(b);
}

/**
 * Parse and validate an amount string, returning a Decimal
 * @throws {Error} if the amount is invalid
 */
export function parseAndValidateAmount(amount: string, asset: string, fieldName: string): Decimal {
  // First parse as Decimal
  const decimalAmount = parseAmount(amount);
  
  // Validate
  if (!validateAmount(decimalAmount, asset)) {
    throw new Error(`${fieldName} must be a valid positive number`);
  }
  
  // Additional validation for USDC decimal places
  if (asset === 'USDC') {
    // Ensure we have at most 2 decimal places for display
    const decimalPlaces = decimalAmount.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      throw new Error(`${fieldName} must have at most 2 decimal places for USDC`);
    }
  }
  
  // For XLM, check that we have at most 7 decimal places
  if (asset === 'XLM') {
    const decimalPlaces = decimalAmount.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > 7) {
      throw new Error(`${fieldName} must have at most 7 decimal places for XLM`);
    }
  }
  
  return decimalAmount;
}