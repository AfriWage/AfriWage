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
export async function verifyPayment(hash: string) {
  // Placeholder implementation for type checking
  // In a real implementation, we would fetch the transaction details from Stellar
  return {
    verified: true,
    sender: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    recipient: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    amount: '0.00',
    asset: 'USDC',
    createdAt: new Date().toISOString(),
    memo: 'AfriWage Payment',
    hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
  };
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
