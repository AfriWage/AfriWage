'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';

type TxStatus = 'Delivered' | 'Received' | 'Pending review';

interface Transaction {
  id: string;
  date: string;
  counterpart: string;
  address: string;
  amount: string;
  currency: 'USDC' | 'XLM';
  status: TxStatus;
  memo: string;
}

const ALL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: 'May 9, 2026',
    counterpart: 'Amina Yusuf',
    address: 'GABC...X7Y9',
    amount: '-1,850.00',
    currency: 'USDC',
    status: 'Delivered',
    memo: 'Weekly payroll',
  },
  {
    id: '2',
    date: 'May 8, 2026',
    counterpart: 'Corporate reserve',
    address: 'G9K2...P4M1',
    amount: '+25,000.00',
    currency: 'USDC',
    status: 'Received',
    memo: 'Treasury top-up',
  },
  {
    id: '3',
    date: 'May 8, 2026',
    counterpart: 'Lerato Mbeki',
    address: 'GZ5T...L9Q3',
    amount: '-2,400.00',
    currency: 'USDC',
    status: 'Pending review',
    memo: 'Sprint payroll',
  },
  {
    id: '4',
    date: 'May 7, 2026',
    counterpart: 'Kwame Owusu',
    address: 'GB7R...W2E8',
    amount: '-980.00',
    currency: 'USDC',
    status: 'Delivered',
    memo: 'Design retainer',
  },
  {
    id: '5',
    date: 'May 7, 2026',
    counterpart: 'Treasury sweep',
    address: 'GC3A...V8N4',
    amount: '-140.00',
    currency: 'XLM',
    status: 'Delivered',
    memo: 'Fees reserve',
  },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');

  const filtered = useMemo(
    () =>
      ALL_TRANSACTIONS.filter((tx) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !query ||
          tx.counterpart.toLowerCase().includes(query) ||
          tx.memo.toLowerCase().includes(query) ||
          tx.address.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
        const matchesCurrency = currencyFilter === 'All' || tx.currency === currencyFilter;
        return matchesSearch && matchesStatus && matchesCurrency;
      }),
    [currencyFilter, search, statusFilter]
  );

  return (
    <DashboardShell
      title="Transaction History"
      description="Track treasury inflows, worker payouts, and anything that needs human review before delivery."
      actions={<WalletConnect />}
    >
      <div className="space-y-6">
        <SurfaceCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7760]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by worker, memo, or wallet"
                className="h-12 w-full rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] pl-11 pr-4 text-sm text-[#102033] outline-none transition-colors focus:border-[#1f8f55]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex items-center gap-2 rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] px-4">
                <SlidersHorizontal className="h-4 w-4 text-[#8c7760]" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-12 bg-transparent text-sm text-[#102033] outline-none"
                >
                  <option>All</option>
                  <option>Delivered</option>
                  <option>Received</option>
                  <option>Pending review</option>
                </select>
              </div>

              <div className="inline-flex items-center rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] px-4">
                <select
                  value={currencyFilter}
                  onChange={(event) => setCurrencyFilter(event.target.value)}
                  className="h-12 bg-transparent text-sm text-[#102033] outline-none"
                >
                  <option>All</option>
                  <option>USDC</option>
                  <option>XLM</option>
                </select>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="hidden overflow-hidden lg:block">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-[#efe3d0] text-sm text-[#8c7760]">
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">Counterparty</th>
                <th className="pb-4 font-medium">Wallet</th>
                <th className="pb-4 font-medium">Memo</th>
                <th className="pb-4 text-right font-medium">Amount</th>
                <th className="pb-4 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-[#f3ecdf] last:border-b-0">
                  <td className="py-5 text-sm text-[#637085]">{tx.date}</td>
                  <td className="py-5 font-medium text-[#102033]">{tx.counterpart}</td>
                  <td className="py-5 font-mono text-sm text-[#637085]">{tx.address}</td>
                  <td className="py-5 text-sm text-[#637085]">{tx.memo}</td>
                  <td className="py-5 text-right font-mono text-sm text-[#102033]">
                    {tx.amount} {tx.currency}
                  </td>
                  <td className="py-5 text-right">
                    <span className="rounded-full bg-[#fff8ef] px-3 py-1 text-xs font-semibold text-[#8c7760]">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfaceCard>

        <div className="space-y-4 lg:hidden">
          {filtered.map((tx) => (
            <SurfaceCard key={tx.id} className="bg-white/96">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#102033]">{tx.counterpart}</p>
                  <p className="mt-1 text-sm text-[#637085]">{tx.memo}</p>
                </div>
                <span className="rounded-full bg-[#fff8ef] px-3 py-1 text-xs font-semibold text-[#8c7760]">
                  {tx.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#8c7760]">Date</p>
                  <p className="mt-1 text-[#102033]">{tx.date}</p>
                </div>
                <div>
                  <p className="text-[#8c7760]">Amount</p>
                  <p className="mt-1 font-mono text-[#102033]">
                    {tx.amount} {tx.currency}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#8c7760]">Wallet</p>
                  <p className="mt-1 font-mono text-sm text-[#637085]">{tx.address}</p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
