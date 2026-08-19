import { StrKey } from '@stellar/stellar-sdk';

export const dashboardMetrics = [
  {
    label: 'Avg Settlement',
    value: '< 5s',
    change: 'Stellar',
    detail: 'From treasury approval to network confirmation',
  },
  {
    label: 'Success Rate',
    value: '99.2%',
    change: 'Testnet',
    detail: 'Last 30 days of payout attempts on testnet',
  },
];

/**
 * Returns the configured treasury wallet public key when it is present and a
 * valid Stellar (Ed25519) public key, otherwise null. A missing, malformed, or
 * placeholder value never reaches the dashboard as a copyable address.
 */
export function getTreasuryWallet(): string | null {
  const configured = process.env.NEXT_PUBLIC_TREASURY_WALLET?.trim();

  if (!configured) {
    return null;
  }

  return StrKey.isValidEd25519PublicKey(configured) ? configured : null;
}
