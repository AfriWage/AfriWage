'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body text-body flex">
      <Sidebar />
      <main className="ml-64 flex-grow p-margin min-h-screen">
        <div className="max-w-container-max mx-auto">
          <header className="mb-8">
            <h2 className="font-h2 text-h2 text-on-surface mb-2">Wallet</h2>
            <p className="font-body-sm text-body-sm text-secondary">
              Manage your connected Stellar wallets and balances.
            </p>
          </header>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-6 py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-primary">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="font-h3 text-h3 text-on-surface mb-2">Connect Your Wallet</h3>
              <p className="font-body-sm text-body-sm text-secondary max-w-sm">
                Connect your Freighter wallet to manage your Stellar balances and initiate payments.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="bg-primary-container text-on-primary rounded-lg py-3 px-6 font-bold transition-transform hover:scale-[0.98]"
              >
                Go to Dashboard
              </Link>
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-outline-variant text-on-surface rounded-lg py-3 px-6 font-bold hover:bg-surface-container transition-colors"
              >
                Get Freighter
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
