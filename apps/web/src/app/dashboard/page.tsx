'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    date: 'Oct 24, 2024',
    recipient: 'GBX4...L9P2',
    amount: '50.00 USDC',
    status: 'Sent',
    statusType: 'sent',
    hash: 'abc123',
  },
  {
    id: '2',
    date: 'Oct 22, 2024',
    recipient: 'GAY7...M2N1',
    amount: '120.00 USDC',
    status: 'Sent',
    statusType: 'sent',
    hash: 'def456',
  },
  {
    id: '3',
    date: 'Oct 20, 2024',
    recipient: 'External Sender',
    amount: '+250.00 USDC',
    status: 'Received',
    statusType: 'received',
    hash: 'ghi789',
  },
  {
    id: '4',
    date: 'Oct 18, 2024',
    recipient: 'GCZ9...R4Q8',
    amount: '15.50 XLM',
    status: 'Sent',
    statusType: 'sent',
    hash: 'jkl012',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState('GBX4...L9P2');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body text-body">
      <Sidebar />

      <main className="min-h-screen px-4 py-6 md:ml-64 md:px-margin md:py-margin">
        <div className="mx-auto max-w-container-max space-y-6 md:space-y-gutter">
          <header className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(14,29,38,0.08)]">
                <div className="relative h-5 w-5 rotate-[18deg]">
                  <span className="absolute left-[1px] top-[2px] h-2 w-1.5 rounded-sm bg-primary" />
                  <span className="absolute left-[7px] top-0 h-3 w-1.5 rounded-sm bg-primary-container" />
                  <span className="absolute left-[13px] top-[4px] h-2 w-1.5 rounded-sm bg-on-surface" />
                  <span className="absolute left-[4px] top-[10px] h-2 w-1.5 rounded-sm bg-on-surface" />
                  <span className="absolute left-[10px] top-[8px] h-3 w-1.5 rounded-sm bg-primary" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">AfriWage</p>
                <p className="text-sm text-secondary">Enterprise Payroll</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/send')}
              className="rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-on-primary"
            >
              Send
            </button>
          </header>

          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="font-h2 text-h2 text-on-surface mb-2">Dashboard</h2>
              <p className="font-body-sm text-body-sm text-secondary">
                Manage your enterprise payroll and connected wallet.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-surface-container-high p-3 text-primary">
                  <span className="material-symbols-outlined">currency_exchange</span>
                </div>
                <h3 className="font-body-sm text-body-sm text-secondary">XLM Balance</h3>
              </div>
              <div className="font-label-mono text-[32px] font-medium leading-none text-on-surface md:text-[44px]">
                124.50 <span className="text-body text-secondary ml-1">XLM</span>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-surface-container-high p-3 text-primary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <h3 className="font-body-sm text-body-sm text-secondary">USDC Balance</h3>
              </div>
              <div className="font-label-mono text-[32px] font-medium leading-none text-on-surface md:text-[44px]">
                250.00 <span className="text-body text-secondary ml-1">USDC</span>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-surface-container-high p-3 text-primary">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <h3 className="font-body-sm text-body-sm text-secondary">Payments Sent</h3>
              </div>
              <div className="font-label-mono text-[32px] font-medium leading-none text-on-surface md:text-[44px]">
                12
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] xl:col-span-4">
              <h3 className="mb-8 text-h3 font-h3 text-on-surface">Quick Send</h3>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push('/send');
                }}
              >
                <div>
                  <label className="block font-body-sm text-body-sm text-secondary mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="G..."
                    className="h-[60px] w-full rounded-lg border border-outline-variant bg-surface px-5 font-label-mono text-label-mono text-on-surface outline-none transition-all focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-secondary mb-2">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-[60px] w-full rounded-lg border border-outline-variant bg-surface px-5 pr-24 font-label-mono text-label-mono text-on-surface outline-none transition-all focus:border-primary"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="font-body-sm text-body-sm text-secondary">USDC</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-secondary mb-2">
                    Memo (Optional)
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Payment reference"
                    className="h-[60px] w-full rounded-lg border border-outline-variant bg-surface px-5 font-body text-body text-on-surface outline-none transition-all focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-primary-container px-6 py-4 text-center font-bold text-on-primary transition-transform hover:scale-[0.98] active:scale-95"
                >
                  Send Payment
                </button>
              </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.08)] xl:col-span-8">
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest p-8">
                <h3 className="font-h3 text-h3 text-on-surface">Recent Transactions</h3>
                <Link
                  href="/transactions"
                  className="font-body-sm text-body-sm text-primary font-medium hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant">
                      <th className="px-5 py-5 font-body-sm text-body-sm font-medium text-secondary whitespace-nowrap">Date</th>
                      <th className="px-5 py-5 font-body-sm text-body-sm font-medium text-secondary whitespace-nowrap">Recipient</th>
                      <th className="px-5 py-5 font-body-sm text-body-sm font-medium text-secondary whitespace-nowrap">Amount</th>
                      <th className="px-5 py-5 font-body-sm text-body-sm font-medium text-secondary whitespace-nowrap">Status</th>
                      <th className="px-5 py-5 text-right font-body-sm text-body-sm font-medium text-secondary whitespace-nowrap">Explorer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TRANSACTIONS.map((tx, idx) => (
                      <tr
                        key={tx.id}
                        className={`min-h-[56px] border-b border-surface-container-highest transition-colors ${
                          idx % 2 === 1
                            ? 'bg-surface hover:bg-surface-container-highest'
                            : 'hover:bg-surface'
                        }`}
                      >
                        <td className="px-5 py-5 font-body-sm text-body-sm text-on-surface">{tx.date}</td>
                        <td className="px-5 py-5 font-label-mono text-label-mono text-on-surface">{tx.recipient}</td>
                        <td className="px-5 py-5 font-label-mono text-label-mono text-on-surface">{tx.amount}</td>
                        <td className="px-5 py-5">
                          {tx.statusType === 'sent' ? (
                            <span className="inline-flex items-center rounded bg-primary-container/10 px-2.5 py-1 text-label-mono font-label-mono text-primary">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-surface-container-highest px-2.5 py-1 text-label-mono font-label-mono text-on-surface">
                              Received
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-5 text-right">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:text-primary transition-colors inline-flex"
                          >
                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
