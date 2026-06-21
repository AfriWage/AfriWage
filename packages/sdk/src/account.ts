import { Keypair } from '@stellar/stellar-sdk';
import type { StellarKeypair } from './types';
import { FRIENDBOT_URL, HORIZON_TESTNET_URL } from './types';

/**
 * Generates a new random Stellar keypair for account creation or signing.
 *
 * @returns {StellarKeypair} Public key (G... address) and secret key (S... seed)
 * @example
 * ```ts
 * const { publicKey, secretKey } = createKeypair();
 * await fundTestnetAccount(publicKey);
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
 * Funds a Stellar testnet account using the Friendbot faucet.
 * This only works on testnet — each account gets 10,000 XLM.
 *
 * @param publicKey - The G... public key of the account to fund
 * @returns The Friendbot response data
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
 * Checks whether a Stellar account exists on the testnet.
 *
 * @param publicKey - The G... public key to check
 * @returns true if the account exists and is funded
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${HORIZON_TESTNET_URL}/accounts/${publicKey}`);
    return response.ok;
  } catch {
    return false;
  }
}
