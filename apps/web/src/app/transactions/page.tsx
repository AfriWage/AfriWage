'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

type TxStatus = 'Sent' | 'Received' | 'Pending';
type TxType = 'Out' | 'In';

interface Transaction {
  id: string;
  date: string;
  type: TxType;
  name: string;
  initials: string;
  address: string;
  amount: string;
  isIncoming: boolean;
  memo: string;
  status: TxStatus;
  hash: string;
}

const ALL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: 'Oct 24, 2024',
    type: 'Out',
    name: 'John Doe',
    initials: 'JD',
    address: 'GABC...X7Y9',
    amount: '250.00 USDC',
    isIncoming: false,
    memo: 'Weekly Retainer',
    status: 'Sent',
    hash: 'tx1',
  },
  {
    id: '2',
    date: 'Oct 23, 2024',
    type: 'In',
    name: 'External Wallet',
    initials: '',
    address: 'G9K2...P4M1',
    amount: '+1,500.00 USDC',
    isIncoming: true,
    memo: 'Fund Account',
    status: 'Received',
    hash: 'tx2',
  },
  {
    id: '3',
    date: 'Oct 21, 2024',
    type: 'Out',
    name: 'Alice Mwangi',
    initials: 'AM',
    address: 'GZ5T...L9Q3',
    amount: '1,250.00 XLM',
    isIncoming: false,
    memo: 'Project Milestone 2',
    status: 'Sent',
    hash: 'tx3',
  },
  {
    id: '4',
    date: 'Oct 18, 2024',
    type: 'Out',
    name: 'David Kimani',
    initials: 'DK',
    address: 'GB7R...W2E8',
    amount: '450.00 USDC',
    isIncoming: false,
    memo: 'Design Services',
    status: 'Pending',
    hash: 'tx4',
  },
  {
    id: '5',
    date: 'Oct 15, 2024',
    type: 'In',
    name: 'Corporate Account',
    initials: '',
    address: 'GC3A...V8N4',
    amount: '+5,000.00 USDC',
    isIncoming: true,
    memo: 'Monthly Top-up',
    status: 'Received',
    hash: 'tx5',
  },
];

function StatusBadge({ status }: { status: TxStatus }) {
  if (status === 'Sent') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-label-mono bg-primary-container/10 text-primary border border-primary-container/20">
        Sent
      </span>
    );
  }
  if (status === 'Received') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-label-mono bg-surface-container-high text-secondary border border-outline-variant">
        Received
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-label-mono bg-surface-container text-secondary border border-outline-variant">
      Pending
    </span>
  );
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currencyFilter, setCurrencyFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const filtered = ALL_TRANSACTIONS.filter((tx) => {
    const matchSearch =
      search === '' ||
      tx.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.memo.toLowerCase().includes(search.toLowerCase()) ||
      tx.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || tx.status === statusFilter;
    const matchCurrency =
      currencyFilter === 'All' ||
      tx.amount.includes(currencyFilter);
    return matchSearch && matchStatus && matchCurrency;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleClear = () => {
    setSearch('');
    setStatusFilter('All');
    setCurrencyFilter('All');
    setPage(1);
  };

  return (
    <div className="bg-background text-on-surface font-body text-body antialiased flex min-h-screen">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <div className="p-gutter max-w-container-max mx-auto w-full flex-1 flex flex-col gap-8 pt-8">

          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="font-h2 text-h2 text-on-surface">Transaction History</h1>
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by recipient or memo..."
                className="w-full h-12 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-body font-body focus:outline-none focus:border-primary-container focus:border-2 transition-all"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">filter_list</span>
              <span className="font-body-sm text-body-sm text-secondary">Filters:</span>
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="flex items-center gap-2 pl-4 pr-8 py-2 border border-outline-variant rounded-lg text-body-sm font-body-sm hover:border-secondary transition-colors bg-surface-container-lowest appearance-none outline-none cursor-pointer"
              >
                <option>All</option>
                <option>Sent</option>
                <option>Received</option>
                <option>Pending</option>
              </select>
              <span className="material-symbols-outlined text-sm absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
            </div>

            {/* Currency filter */}
            <div className="relative">
              <select
                value={currencyFilter}
                onChange={(e) => { setCurrencyFilter(e.target.value); setPage(1); }}
                className="flex items-center gap-2 pl-4 pr-8 py-2 border border-outline-variant rounded-lg text-body-sm font-body-sm hover:border-secondary transition-colors bg-surface-container-lowest appearance-none outline-none cursor-pointer"
              >
                <option value="All">Currency: All</option>
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
              <span className="material-symbols-outlined text-sm absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
            </div>

            <button
              type="button"
              className="ml-auto text-secondary hover:text-primary transition-colors font-body-sm text-body-sm"
              onClick={handleClear}
            >
              Clear All
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-body-sm text-body-sm">
                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Date</th>
                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Type</th>
                    <th className="py-4 px-6 font-semibold min-w-[200px]">Recipient/Sender</th>
                    <th className="py-4 px-6 font-semibold whitespace-nowrap text-right">Amount</th>
                    <th className="py-4 px-6 font-semibold min-w-[150px]">Memo</th>
                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Status</th>
                    <th className="py-4 px-6 font-semibold whitespace-nowrap text-center">Explorer</th>
                  </tr>
                </thead>
                <tbody className="font-body text-body divide-y divide-outline-variant">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-secondary font-body-sm text-body-sm">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 px-6 text-on-surface whitespace-nowrap font-body-sm text-body-sm">{tx.date}</td>
                        <td className="py-4 px-6">
                          <div className={`flex items-center gap-2 ${tx.type === 'Out' ? 'text-error' : 'text-primary-container'}`}>
                            <span className="material-symbols-outlined fill text-xl">
                              {tx.type === 'Out' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                            <span className="text-sm">{tx.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary-container font-semibold text-xs shrink-0">
                              {tx.initials ? (
                                tx.initials
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">account_balance</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-on-surface">{tx.name}</div>
                              <div className="text-xs text-secondary font-label-mono text-label-mono">{tx.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 px-6 text-right font-label-mono text-label-mono font-semibold ${tx.isIncoming ? 'text-primary-container' : 'text-on-surface'}`}>
                          {tx.amount}
                        </td>
                        <td className="py-4 px-6 text-secondary text-sm">{tx.memo}</td>
                        <td className="py-4 px-6">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:text-primary transition-colors inline-flex opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-outline-variant px-6 py-4 flex items-center justify-between bg-surface-container-lowest">
              <div className="text-sm text-secondary font-body-sm">
                Showing{' '}
                <span className="font-semibold text-on-surface">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}</span>
                {' '}to{' '}
                <span className="font-semibold text-on-surface">{Math.min(page * PER_PAGE, filtered.length)}</span>
                {' '}of{' '}
                <span className="font-semibold text-on-surface">{filtered.length}</span>
                {' '}results
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-outline-variant text-secondary hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded flex items-center justify-center font-semibold transition-colors ${
                      p === page
                        ? 'bg-primary-container text-on-primary-container'
                        : 'hover:bg-surface-container text-secondary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-outline-variant text-secondary hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="h-12" />
        </div>
      </main>
    </div>
  );
}
