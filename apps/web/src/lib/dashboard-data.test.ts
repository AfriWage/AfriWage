import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTreasuryWallet } from './dashboard-data';

const validKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getTreasuryWallet', () => {
  it('returns null when no treasury wallet is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', '');

    expect(getTreasuryWallet()).toBeNull();
  });

  it('returns null for the legacy placeholder value', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', 'GA4FWQ7RZ6K2...H9X2');

    expect(getTreasuryWallet()).toBeNull();
  });

  it('returns null for a malformed Stellar key', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', 'not-a-stellar-key');

    expect(getTreasuryWallet()).toBeNull();
  });

  it('returns the configured key when it is a valid Ed25519 public key', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', validKey);

    expect(getTreasuryWallet()).toBe(validKey);
  });

  it('trims surrounding whitespace before validating', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', `  ${validKey}  `);

    expect(getTreasuryWallet()).toBe(validKey);
  });
});
