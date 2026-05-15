'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { SendPaymentForm } from '@/components/SendPaymentForm';
import { WalletConnect } from '@/components/WalletConnect';

export default function SendPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const handleConnect = useCallback((pk: string) => setPublicKey(pk), []);
  const handleDisconnect = useCallback(() => setPublicKey(null), []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <nav className="sticky top-0 z-50 h-16 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#111111]"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#14A800]" />
              <span className="font-semibold text-[#111111]">
                Send Payment
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden text-sm text-[#6B7280] transition-colors hover:text-[#111111] sm:inline"
            >
              Dashboard
            </Link>
            <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#111111]">Send USDC Payment</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Instantly send USDC to any Stellar address on the testnet.
          </p>
        </div>
        <SendPaymentForm senderPublicKey={publicKey ?? undefined} />
      </main>
    </div>
  );
}
