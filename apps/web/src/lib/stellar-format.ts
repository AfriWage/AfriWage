import { Decimal } from 'decimal.js';

/**
 * Truncates a Stellar public key for display.
 * Example: GABCD...WXYZ
 */
export function truncatePublicKey(publicKey: string, chars = 4): string {
  if (publicKey.length <= chars * 2 + 3) return publicKey;
  return `${publicKey.slice(0, chars)}...${publicKey.slice(-chars)}`;
}

/**
 * Formats a Stellar amount to a human-readable string.
 */
export function formatAmount(amount: string, asset: string): string {
  let num: Decimal;

  try {
    num = new Decimal(amount);
  } catch {
    return `0 ${asset}`;
  }

  if (!num.isFinite() || num.isNaN()) return `0 ${asset}`;
  // XLM needs 7 decimal places, USDC needs 2 decimal places
  const decimalPlaces = asset === 'XLM' ? 7 : 2;
  return `${num.toFixed(decimalPlaces)} ${asset}`;
}