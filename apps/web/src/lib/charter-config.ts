import type { CharterConfig } from '@AfriWage/sdk';
import { Keypair } from '@stellar/stellar-sdk';
import { env } from './env';
import { NETWORK_PASSPHRASE } from './stellar';

/**
 * Server-side Charter wiring.
 *
 * Server-only: it reads `CHARTER_FACTORY_DEPLOYER_SECRET_KEY`. Never import
 * this from a client component.
 */

export function charterConfig(): CharterConfig {
  return {
    rpcUrl: env.NEXT_PUBLIC_SOROBAN_RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    // Optional. When unset the SDK reads straight from the contract, so this
    // changes read cost, never correctness.
    indexerUrl: env.CHARTER_INDEXER_API_URL,
  };
}

export function charterFactoryContractId(): string {
  return env.CHARTER_FACTORY_CONTRACT_ID;
}

export function treasuryTokenContractId(): string {
  return env.CHARTER_TREASURY_TOKEN_CONTRACT_ID;
}

/**
 * Keypair of the Charter factory's registered `deployer`.
 *
 * Used for exactly one thing: signing the `deploy_treasury` authorization entry
 * that Charter's permissioned factory requires alongside the org admin's own
 * signature. It is not an approver on any treasury and cannot move funds — see
 * docs/charter-treasury.md.
 */
export function factoryDeployerKeypair(): Keypair {
  return Keypair.fromSecret(env.CHARTER_FACTORY_DEPLOYER_SECRET_KEY);
}
