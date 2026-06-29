import { Keypair } from '@stellar/stellar-sdk';
import type { StellarKeypair } from './types';
import { FRIENDBOT_URL, HORIZON_TESTNET_URL } from './types';

/**
 * @description Generates a new cryptographically random Stellar keypair consisting of a
 * public key and a secret key. The keypair can be used to create a new Stellar account
 * or as a signing key for transactions.
 *
 * The returned secret key must be stored securely — it cannot be recovered if lost.
 * After generating a keypair, call {@link fundTestnetAccount} with the public key to
 * activate the account on the Stellar testnet.
 *
 * @returns A {@link StellarKeypair} object with:
 * - `publicKey` — the account's 56-character address starting with `G` (safe to share)
 * - `secretKey` — the account's 56-character signing key starting with `S` (keep private)
 *
 * @example
 * ```ts
 * import { createKeypair } from '@afriwage/sdk';
 *
 * const { publicKey, secretKey } = createKeypair();
 * console.log('Public key:', publicKey);  // e.g. "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
 * console.log('Secret key:', secretKey); // e.g. "SCZANGBA5AKIA5JKPKZTA53JLXQHXPFGTQWNV2TH7KXCOBOIFG7CVJJXR"
 * // Store secretKey securely — never log or expose it in production
 * ```
 */
export function createKeypair(): StellarKeypair {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

/**
 * @description Funds a new Stellar testnet account using the Friendbot faucet service.
 * Friendbot is a testnet-only utility provided by the Stellar Development Foundation that
 * deposits 10,000 XLM into any unfunded account, activating it on the ledger.
 *
 * This function only works on the Stellar testnet — it will not work on mainnet.
 * An account must be funded before it can send transactions or establish trustlines.
 * Calling this on an already-funded account will fail with a Friendbot error.
 *
 * @param publicKey - The Stellar public key of the account to fund (56-character string starting with `G`)
 *
 * @returns A `Promise` resolving to an object with:
 * - `funded` — always `true` on success
 * - `publicKey` — the public key that was funded (echoed back for convenience)
 *
 * @throws {Error} If `publicKey` is not a valid Stellar public key format
 * @throws {Error} If the account has already been funded (Friendbot rejects duplicate requests)
 * @throws {Error} If the Friendbot service is unreachable or returns a non-OK HTTP status
 *
 * @example
 * ```ts
 * import { createKeypair, fundTestnetAccount } from '@afriwage/sdk';
 *
 * const { publicKey, secretKey } = createKeypair();
 * const result = await fundTestnetAccount(publicKey);
 * console.log('Funded:', result.funded);       // true
 * console.log('Account:', result.publicKey);   // the G... address
 * // Account now has 10,000 XLM and can send transactions
 * ```
 */
export async function fundTestnetAccount(
  publicKey: string
): Promise<{ funded: boolean; publicKey: string }> {
  const url = `${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot funding failed for ${publicKey}: HTTP ${response.status} — ${body}`);
  }

  await response.json();

  return {
    funded: true,
    publicKey,
  };
}

/**
 * @description Checks whether a Stellar account exists and is activated on the testnet
 * by making a lightweight HTTP request to the Horizon accounts endpoint. An account
 * exists once it has been funded with the minimum XLM reserve (currently 1 XLM).
 *
 * This is useful for validating a recipient address before attempting to send a payment,
 * or for polling until a newly created account has been funded.
 *
 * @param publicKey - The Stellar public key to check (56-character string starting with `G`)
 *
 * @returns A `Promise` resolving to:
 * - `true` — the account exists on the testnet and is activated
 * - `false` — the account does not exist, has not been funded, or the request failed
 *
 * @throws Never — all errors are caught internally and result in `false` being returned
 *
 * @example
 * ```ts
 * import { createKeypair, fundTestnetAccount, accountExists } from '@afriwage/sdk';
 *
 * const { publicKey, secretKey } = createKeypair();
 *
 * // Check before funding — should be false
 * console.log(await accountExists(publicKey)); // false
 *
 * await fundTestnetAccount(publicKey);
 *
 * // Check after funding — should be true
 * console.log(await accountExists(publicKey)); // true
 * ```
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${HORIZON_TESTNET_URL}/accounts/${publicKey}`);
    return response.ok;
  } catch {
    return false;
  }
}
