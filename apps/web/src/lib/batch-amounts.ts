import { Decimal } from 'decimal.js';

export function sumUsdcAmounts(amounts: string[]): string {
  return amounts
    .reduce((sum, amount) => sum.plus(new Decimal(amount)), new Decimal(0))
    .toFixed(2);
}

export function isValidPositiveAmount(amount: string): boolean {
  try {
    const value = new Decimal(amount);
    return value.isFinite() && value.gt(0);
  } catch {
    return false;
  }
}
