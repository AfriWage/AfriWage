import { z } from 'zod';

/**
 * @description Zod schema for validating a Stellar keypair object.
 * Ensures both `publicKey` and `secretKey` are exactly 56 characters long,
 * matching the standard Stellar StrKey encoding format.
 *
 * @example
 * ```ts
 * import { StellarKeypairSchema } from '@afriwage/sdk';
 *
 * const result = StellarKeypairSchema.safeParse({
 *   publicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
 *   secretKey: 'SCZANGBA5AKIA5JKPKZTA53JLXQHXPFGTQWNV2TH7KXCOBOIFG7CVJJXR',
 * });
 * console.log(result.success); // true
 * ```
 */
export const StellarKeypairSchema = z.object({
  publicKey: z.string().min(56).max(56),
  secretKey: z.string().min(56).max(56),
});

/**
 * @description Represents a Stellar keypair with a public key and a secret key.
 * Inferred from {@link StellarKeypairSchema}.
 *
 * - `publicKey` — the 56-character account address starting with `G` (safe to share)
 * - `secretKey` — the 56-character signing key starting with `S` (must be kept private)
 */
export type StellarKeypair = z.infer<typeof StellarKeypairSchema>;

/**
 * @description Zod schema for validating an account balance object containing
 * native XLM and USDC amounts as decimal strings.
 *
 * @example
 * ```ts
 * import { BalanceSchema } from '@afriwage/sdk';
 *
 * const result = BalanceSchema.safeParse({ xlm: '9999.9999900', usdc: '250.00' });
 * console.log(result.success); // true
 * ```
 */
export const BalanceSchema = z.object({
  xlm: z.string(),
  usdc: z.string(),
});

/**
 * @description Represents the XLM and USDC balances of a Stellar account.
 * Inferred from {@link BalanceSchema}.
 *
 * - `xlm` — native XLM balance as a string formatted to 7 decimal places (e.g. `"9999.9999900"`)
 * - `usdc` — USDC balance as a string formatted to 2 decimal places (e.g. `"250.00"`),
 *   or `"0.00"` if the account has no USDC trustline
 */
export type Balance = z.infer<typeof BalanceSchema>;

/**
 * @description Zod schema for validating a parsed transaction record returned by
 * {@link getTransactionHistory}. Enforces required fields and restricts `type` to
 * known operation categories.
 */
export const TransactionRecordSchema = z.object({
  id: z.string(),
  hash: z.string(),
  type: z.enum(['payment', 'create_account', 'other']),
  amount: z.string(),
  asset: z.string(),
  from: z.string(),
  to: z.string(),
  memo: z.string().optional(),
  createdAt: z.string(),
  successful: z.boolean(),
});

/**
 * @description Represents a single parsed transaction from a Stellar account's history.
 * Inferred from {@link TransactionRecordSchema}.
 *
 * - `id` — Horizon's internal transaction ID
 * - `hash` — the transaction hash; use this for receipt links or block explorer lookups
 * - `type` — `"payment"` | `"create_account"` | `"other"`
 * - `amount` — transaction amount formatted to 2 decimal places
 * - `asset` — asset code string, e.g. `"USDC"` or `"XLM"`
 * - `from` — sender's Stellar public key
 * - `to` — recipient's Stellar public key
 * - `memo` — decoded text memo, if the transaction included one
 * - `createdAt` — ISO 8601 timestamp string of when the transaction was ledger-confirmed
 * - `successful` — `true` if the transaction was successfully applied to the ledger
 */
export type TransactionRecord = z.infer<typeof TransactionRecordSchema>;

/**
 * @description Zod schema for validating the parameters passed to {@link sendPayment}.
 * Enforces key length constraints and a decimal amount format with up to 7 decimal places.
 */
export const SendPaymentParamsSchema = z.object({
  senderSecret: z.string().min(56).max(56),
  recipientPublicKey: z.string().min(56).max(56),
  amount: z.string().regex(/^\d+(\.\d{1,7})?$/, 'Invalid amount format'),
  memo: z.string().max(28).optional(),
});

/**
 * @description Represents the validated parameters for a USDC payment.
 * Inferred from {@link SendPaymentParamsSchema}.
 *
 * - `senderSecret` — the sender's 56-character Stellar secret key (starts with `S`)
 * - `recipientPublicKey` — the recipient's 56-character Stellar public key (starts with `G`)
 * - `amount` — payment amount in USDC as a decimal string with up to 7 decimal places
 * - `memo` — optional text memo, maximum 28 bytes
 */
export type SendPaymentParams = z.infer<typeof SendPaymentParamsSchema>;

/**
 * @description Represents the result of a submitted Stellar transaction.
 * Returned by {@link sendPayment} and {@link establishUsdcTrustline}.
 *
 * - `hash` — the unique transaction hash; use this to look up the transaction on a block explorer
 * - `ledger` — the ledger sequence number in which the transaction was included
 * - `successful` — `true` if the transaction was successfully applied to the ledger
 */
export interface PaymentResult {
  hash: string;
  ledger: number;
  successful: boolean;
}

/**
 * @description The Horizon testnet REST API base URL.
 * Used to query account balances, submit transactions, and fetch transaction history
 * on the Stellar testnet network.
 */
export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';

/**
 * @description The Stellar Friendbot faucet URL for the testnet.
 * Friendbot funds any unfunded testnet account with 10,000 XLM when called with
 * a valid public key as the `addr` query parameter.
 */
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';

/**
 * @description The asset code for USDC on the Stellar network (`"USDC"`).
 * Used in combination with {@link USDC_ISSUER_TESTNET} to identify the USDC asset.
 */
export const USDC_ASSET_CODE = 'USDC';

/**
 * @description The issuing account address for USDC on the Stellar testnet.
 * This is Circle's official testnet USDC issuer. Used to construct the `Asset` object
 * for USDC payment operations and trustline establishment.
 *
 * @see https://developers.circle.com/docs/usdc-on-stellar
 */
export const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
