'use client';

import {
  getAddress,
  isConnected as freighterIsConnected,
  requestAccess,
  signTransaction as freighterSignTransaction,
  getNetworkDetails as freighterGetNetworkDetails,
} from '@stellar/freighter-api';

import { NETWORK_PASSPHRASE } from './stellar';

/**
 * Requests wallet access and returns the public key.
 * - On first visit: triggers the Freighter popup to approve the site
 * - On subsequent visits: returns the address directly if already approved
 */
export async function getPublicKey(): Promise<string> {
  // First check: is Freighter running in this browser at all?
  const { isConnected, error: connErr } = await freighterIsConnected();

  if (connErr || !isConnected) {
    throw new Error('NOT_INSTALLED');
  }

  // Ask Freighter to approve this site and return the address
  const { address, error } = await requestAccess();

  if (error) {
    // User rejected the connection
    throw new Error(error.toString());
  }

  if (!address) {
    throw new Error('No Stellar account found. Create or import an account in Freighter first.');
  }

  return address;
}

/**
 * Gets the address that is already connected (no popup).
 * Use this to silently restore an existing session.
 */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const { isConnected } = await freighterIsConnected();
    if (!isConnected) return null;

    const { address, error } = await getAddress();
    if (error || !address) return null;

    return address;
  } catch {
    return null;
  }
}

/**
 * Signs a Stellar transaction XDR string using Freighter.
 */
export async function signTransaction(xdr: string): Promise<string> {
  const { signedTxXdr, error } = await freighterSignTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (error) throw new Error(error.toString());
  if (!signedTxXdr) throw new Error('Transaction signing failed or was rejected.');

  return signedTxXdr;
}

/**
 * Network details reported by Freighter for the wallet's active network.
 */
export interface WalletNetworkDetails {
  network: string;
  networkPassphrase: string;
}

/**
 * A confirmed mismatch between the wallet network and the app's expected network.
 */
export interface NetworkMismatch {
  expectedNetwork: string;
  actualNetwork: string;
}

// Freighter reports the wallet network via a short code (e.g. "PUBLIC").
const FREIGHTER_NETWORK_NAMES: Record<string, string> = {
  PUBLIC: 'Mainnet',
  TESTNET: 'Testnet',
  FUTURENET: 'Futurenet',
};

// Stellar network passphrases mapped to human-friendly names for warnings.
const PASSPHRASE_NETWORK_NAMES: Record<string, string> = {
  'Public Global Stellar Network ; September 2015': 'Mainnet',
  'Test SDF Network ; September 2015': 'Testnet',
  'Test SDF Future Network ; October 2022': 'Futurenet',
};

/**
 * Gets the current network details from Freighter.
 */
export async function getNetworkDetails(): Promise<WalletNetworkDetails> {
  const result = await freighterGetNetworkDetails();
  if (result.error) throw new Error(result.error.toString());
  return { network: result.network, networkPassphrase: result.networkPassphrase };
}

/**
 * Compares a wallet's network against the app's expected network passphrase.
 * Returns null when they match, otherwise a human-readable mismatch naming both networks.
 */
export function detectNetworkMismatch(
  wallet: WalletNetworkDetails,
  expectedPassphrase: string
): NetworkMismatch | null {
  if (wallet.networkPassphrase === expectedPassphrase) {
    return null;
  }

  return {
    expectedNetwork: PASSPHRASE_NETWORK_NAMES[expectedPassphrase] ?? 'Unknown network',
    actualNetwork: FREIGHTER_NETWORK_NAMES[wallet.network] ?? wallet.network,
  };
}

/**
 * Reads the wallet's current network and reports any mismatch with the app.
 * Detection is best-effort: if the network cannot be read, it fails open and
 * returns null so an unexpected error never blocks the connection.
 */
export async function detectWalletNetworkMismatch(
  expectedPassphrase: string
): Promise<NetworkMismatch | null> {
  try {
    const details = await getNetworkDetails();
    return detectNetworkMismatch(details, expectedPassphrase);
  } catch {
    return null;
  }
}
