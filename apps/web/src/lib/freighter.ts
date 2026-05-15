'use client';

import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  requestAccess as freighterRequestAccess,
  signTransaction as freighterSignTransaction,
  getNetworkDetails as freighterGetNetworkDetails,
} from '@stellar/freighter-api';

declare global {
  interface Window {
    freighter?: unknown;
  }
}

/**
 * Checks whether the Freighter wallet extension is installed in the browser.
 */
export function isFreighterInstalled(): boolean {
  // In v6+, we can check window.freighter directly for synchronous checks
  // to avoid async flashes, or use the async isConnected() method.
  if (typeof window === 'undefined') return false;
  return typeof window.freighter !== 'undefined';
}

/**
 * Retrieves the connected wallet's public key from Freighter.
 * Will prompt the user to connect if not already connected.
 *
 * @returns The G... public key of the connected account
 * @throws Error if Freighter is not installed or user rejects
 */
export async function getPublicKey(): Promise<string> {
  const { isConnected } = await freighterIsConnected();
  if (!isConnected) {
    throw new Error(
      'Freighter wallet is not installed. Please install it from https://freighter.app'
    );
  }

  // Request access prompts the user to connect and returns the address
  const { address, error } = await freighterRequestAccess();
  if (error) {
    throw new Error(error.toString());
  }
  if (!address) {
    throw new Error('No account found in Freighter. Please create or import a Stellar account.');
  }
  return address;
}

/**
 * Signs a Stellar transaction XDR string using Freighter.
 *
 * @param xdr - The base64-encoded transaction XDR to sign
 * @returns The signed transaction XDR
 * @throws Error if Freighter is not installed or user rejects
 */
export async function signTransaction(xdr: string): Promise<string> {
  const { isConnected } = await freighterIsConnected();
  if (!isConnected) {
    throw new Error('Freighter wallet is not installed.');
  }

  const { signedTxXdr, error } = await freighterSignTransaction(xdr, {
    networkPassphrase: 'Test SDF Network ; September 2015',
  });

  if (error) {
    throw new Error(error.toString());
  }
  if (!signedTxXdr) {
    throw new Error('Transaction signing failed or was rejected.');
  }

  return signedTxXdr;
}

/**
 * Checks if the user has already connected Freighter to this app.
 *
 * @returns true if Freighter is installed and connected
 */
export async function isConnected(): Promise<boolean> {
  try {
    const { isConnected: installed } = await freighterIsConnected();
    if (!installed) return false;

    const { isAllowed } = await freighterIsAllowed();
    return !!isAllowed;
  } catch {
    return false;
  }
}

/**
 * Gets the current network details from Freighter.
 * Used to verify the user is on the correct network.
 */
export async function getNetworkDetails(): Promise<{
  network: string;
  networkPassphrase: string;
}> {
  const { isConnected } = await freighterIsConnected();
  if (!isConnected) {
    throw new Error('Freighter wallet is not installed.');
  }

  const result = await freighterGetNetworkDetails();
  if (result.error) {
    throw new Error(result.error.toString());
  }

  return {
    network: result.network,
    networkPassphrase: result.networkPassphrase,
  };
}
