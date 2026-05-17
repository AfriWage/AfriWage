'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock3, MoveUpRight, Wallet2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import { Skeleton } from '@/components/ui/skeleton';
import { fundTestnet, getAccount } from '@/lib/api';
import { dashboardMetrics, payoutQueues, recentTransactions } from '@/lib/dashboard-data';

export default function DashboardPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);

  const accountQuery = useQuery({
    queryKey: ['dashboard-account', address],
    queryFn: () => getAccount(address ?? ''),
    enabled: Boolean(address),
    refetchInterval: 30000,
  });

  const handleConnect = useCallback((publicKey: string) => {
    setAddress(publicKey);
  }, []);

  const handleDisconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const balanceCards = useMemo(
    () => [
      {
        asset: 'USDC Treasury',
        value: accountQuery.data ? `${accountQuery.data.usdcBalance} USDC` : '--',
        detail: 'Primary payroll pool',
      },
      {
        asset: 'XLM Gas Buffer',
        value: accountQuery.data ? `${accountQuery.data.xlmBalance} XLM` : '--',
        detail: 'Network fees and account ops',
      },
    ],
    [accountQuery.data]
  );
  const accountNotFound =
    address &&
    !accountQuery.isLoading &&
    !accountQuery.data &&
    accountQuery.error !== null &&
    accountQuery.error instanceof Error &&
    accountQuery.error.message.includes('404');

  return (
    <DashboardShell
      title="Operations Overview"
      description="Get a high-level view of your African payroll operations. Fund your treasury in seconds, approve pending payouts, and review recent on-chain settlements all from one unified command center."
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <SurfaceCard className="overflow-hidden bg-[linear-gradient(135deg,#102033_0%,#18324c_54%,#1f8f55_160%)] text-white">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                  Today&apos;s command view
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl lg:text-4xl">
                  Keep every payout lane visible, funded, and trusted.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/74">
                  The redesigned AfriWage dashboard centers the actual operator workflow: fund
                  treasury, review workers, send payroll, and confirm delivery.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
                <Link
                  href="/send"
                  className="rounded-[20px] bg-white px-6 py-4 text-center font-semibold text-[#102033] transition-transform hover:scale-[0.99] active:scale-[0.97]"
                >
                  Send payroll
                </Link>
                <Link
                  href="/transactions"
                  className="rounded-[20px] border border-white/20 px-6 py-4 text-center font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Review activity
                </Link>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="bg-[#fff8ef]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Payroll runway</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">
                  {address ? 'Connected treasury' : 'Connect treasury wallet'}
                </h3>
              </div>
              <div className="rounded-2xl bg-[#dff3e8] p-3 text-[#1f8f55]">
                <Wallet2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 h-3 rounded-full bg-[#efe3d0]">
              <div
                className="h-3 rounded-full bg-[linear-gradient(90deg,#1f8f55_0%,#8dca62_100%)]"
                style={{
                  width:
                    accountQuery.data && Number.parseFloat(accountQuery.data.usdcBalance) > 0
                      ? '72%'
                      : '18%',
                }}
              />
            </div>
            <div className="mt-5 space-y-3 text-sm text-[#637085]">
              {accountQuery.isLoading ? (
                <>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </>
              ) : accountQuery.data?.isActive ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>USDC treasury available</span>
                    <span className="font-mono text-[#102033]">
                      {accountQuery.data.usdcBalance} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>XLM available</span>
                    <span className="font-medium text-[#102033]">
                      {accountQuery.data.xlmBalance} XLM
                    </span>
                  </div>
                </>
              ) : accountNotFound ? (
                <div className="space-y-4">
                  <p className="font-medium text-[#102033]">Account not found on testnet</p>
                  <button
                    type="button"
                    disabled={funding}
                    onClick={async () => {
                      if (!address) return;
                      setFunding(true);
                      try {
                        await fundTestnet(address);
                        await accountQuery.refetch();
                      } finally {
                        setFunding(false);
                      }
                    }}
                    className="rounded-[18px] bg-[#1f8f55] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {funding ? 'Funding...' : 'Fund Testnet Account'}
                  </button>
                </div>
              ) : accountQuery.isError ? (
                <p className="font-medium text-[#c45a43]">
                  {accountQuery.error instanceof Error
                    ? accountQuery.error.message
                    : 'Failed to load account balances'}
                </p>
              ) : address ? (
                <div className="space-y-4">
                  <p className="font-medium text-[#102033]">Account not found on testnet</p>
                  <button
                    type="button"
                    disabled={funding}
                    onClick={async () => {
                      if (!address) return;
                      setFunding(true);
                      try {
                        await fundTestnet(address);
                        await accountQuery.refetch();
                      } finally {
                        setFunding(false);
                      }
                    }}
                    className="rounded-[18px] bg-[#1f8f55] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {funding ? 'Funding...' : 'Fund Testnet Account'}
                  </button>
                </div>
              ) : (
                <p className="font-medium text-[#102033]">
                  Connect a wallet to load live balances.
                </p>
              )}
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {accountQuery.isLoading
            ? Array.from({ length: 2 }).map((_, index) => (
                <SurfaceCard key={index} className="bg-white/95">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-10 w-40" />
                  <Skeleton className="mt-3 h-4 w-48" />
                </SurfaceCard>
              ))
            : balanceCards.map((metric) => (
                <SurfaceCard key={metric.asset} className="bg-white/95">
                  <p className="text-sm text-[#637085]">{metric.asset}</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="font-display text-3xl font-semibold text-[#102033]">
                      {metric.value}
                    </p>
                    <span className="rounded-full bg-[#f3ecdf] px-3 py-1 text-xs font-semibold text-[#8c7760]">
                      Live
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#637085]">{metric.detail}</p>
                </SurfaceCard>
              ))}
          {dashboardMetrics.map((metric) => (
            <SurfaceCard key={metric.label} className="bg-white/95">
              <p className="text-sm text-[#637085]">{metric.label}</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <p className="font-display text-3xl font-semibold text-[#102033]">{metric.value}</p>
                <span className="rounded-full bg-[#f3ecdf] px-3 py-1 text-xs font-semibold text-[#8c7760]">
                  {metric.change}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#637085]">{metric.detail}</p>
            </SurfaceCard>
          ))}
        </section>

        <section>
          <SurfaceCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Queue status</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">
                  What needs attention next
                </h3>
              </div>
              <Clock3 className="h-5 w-5 text-[#8c7760]" />
            </div>
            <div className="mt-6 space-y-4">
              {payoutQueues.map((queue) => (
                <div
                  key={queue.title}
                  className="rounded-[22px] border border-[#efe3d0] bg-[#fffaf2] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-display text-lg font-semibold text-[#102033]">
                      {queue.title}
                    </p>
                    <span className="font-mono text-sm text-[#1f8f55]">{queue.amount}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#637085]">{queue.detail}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </section>

        <section>
          <SurfaceCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">
                  Recent activity
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">
                  Payment confidence feed
                </h3>
              </div>
              <Link
                href="/transactions"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f8f55]"
              >
                All transactions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 rounded-[22px] border border-[#efe3d0] bg-[#fffaf2] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-[#dff3e8] p-3 text-[#1f8f55]">
                      <MoveUpRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#102033]">{transaction.title}</p>
                      <p className="mt-1 text-sm text-[#637085]">
                        {transaction.counterparty} • {transaction.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <p className="font-mono text-sm text-[#102033]">{transaction.amount}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8c7760]">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </section>
      </div>
    </DashboardShell>
  );
}
