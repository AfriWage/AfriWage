import { Keypair } from '@stellar/stellar-sdk';
import { vi } from 'vitest';

/**
 * Stubs a complete, valid server environment for tests.
 *
 * `lib/env.ts` validates every required variable at import time, so any test
 * that (even transitively) imports it needs all of them set. Keeping one
 * fixture here means adding a required variable is a one-line change rather
 * than an edit to every suite that happens to reach `env.ts`.
 *
 * Call it before the dynamic `import()` of the module under test.
 */
export interface StubbedEnv {
  authServerKeypair: Keypair;
  factoryDeployerKeypair: Keypair;
  homeDomain: string;
  factoryContractId: string;
  tokenContractId: string;
}

export function stubServerEnv(overrides: Record<string, string> = {}): StubbedEnv {
  const authServerKeypair = Keypair.random();
  const factoryDeployerKeypair = Keypair.random();
  const homeDomain = 'afriwage.test';
  const factoryContractId = 'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4';
  const tokenContractId = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';

  const values: Record<string, string> = {
    POSTGRES_URL: 'postgres://user:password@host:5432/dbname',
    YELLOWCARD_API_KEY: 'sandbox-test-key',
    AUTH_SERVER_SIGNING_KEY: authServerKeypair.secret(),
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters',
    NEXT_PUBLIC_AUTH_HOME_DOMAIN: homeDomain,
    CHARTER_FACTORY_CONTRACT_ID: factoryContractId,
    CHARTER_FACTORY_DEPLOYER_SECRET_KEY: factoryDeployerKeypair.secret(),
    CHARTER_TREASURY_TOKEN_CONTRACT_ID: tokenContractId,
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    vi.stubEnv(key, value);
  }

  return {
    authServerKeypair: overrides.AUTH_SERVER_SIGNING_KEY
      ? Keypair.fromSecret(overrides.AUTH_SERVER_SIGNING_KEY)
      : authServerKeypair,
    factoryDeployerKeypair,
    homeDomain: values.NEXT_PUBLIC_AUTH_HOME_DOMAIN,
    factoryContractId: values.CHARTER_FACTORY_CONTRACT_ID,
    tokenContractId: values.CHARTER_TREASURY_TOKEN_CONTRACT_ID,
  };
}
