import { getBalance, getTransactionHistory } from './stellar';

export async function getAccount(address: string) {
  // We wrap the stellar balance getter to return an object matching the expected UI
  const balance = await getBalance(address);
  return {
    usdcBalance: balance.usdc,
    xlmBalance: balance.xlm,
    isActive: balance.xlm !== '0' && balance.xlm !== '0.0000000',
  };
}

export async function getTransactions(address: string, options?: { limit?: number }) {
  // Wrap the stellar transaction history getter
  const txs = await getTransactionHistory(address);
  if (options?.limit) {
    return txs.slice(0, options.limit);
  }
  return txs;
}
export interface PaymentReceipt {
  verified: boolean;
  hash: string;
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
  memo?: string;
  createdAt: string;
  explorerUrl: string;
}

/**
 * Verifies a payment against the Stellar network by looking up the transaction
 * on Horizon via the /api/payment/verify route. Throws if the transaction
 * cannot be found or the network request fails, so callers can surface an
 * error state rather than a fabricated "verified" result.
 */
export async function verifyPayment(hash: string): Promise<PaymentReceipt> {
  const response = await fetch(`/api/payment/verify?hash=${encodeURIComponent(hash)}`);

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(errorBody.message ?? 'Transaction not found');
  }

  return (await response.json()) as PaymentReceipt;
}

export async function fundTestnet(address: string): Promise<void> {
  const response = await fetch('/api/fund-testnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fund testnet account: ${response.statusText}`);
  }
}
