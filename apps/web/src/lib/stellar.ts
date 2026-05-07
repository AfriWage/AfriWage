import { Networks } from '@stellar/stellar-sdk';

export type {
  Balance,
  PaymentResult,
  StellarKeypair,
  TransactionRecord,
} from '@AfriWage/sdk';
// Re-export SDK helpers for use in web app
export {
  accountExists,
  createKeypair,
  establishUsdcTrustline,
  fundTestnetAccount,
  getBalance,
  getTransactionHistory,
  sendPayment,
  USDC_ASSET_CODE,
  USDC_ISSUER_TESTNET,
} from '@AfriWage/sdk';

// Network configuration
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';

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
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return `0 ${asset}`;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${asset}`;
}
