'use client';

import { ArrowRight, CheckCircle2, Clock3, MoveUpRight, Users2, Wallet2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import {
  dashboardMetrics,
  payoutQueues,
  recentTransactions,
  workerHighlights,
} from '@/lib/dashboard-data';

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Operations Overview"
      description="Monitor treasury health, move payroll faster, and catch payout blockers before workers feel them."
      actions={<WalletConnect />}
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <SurfaceCard className="overflow-hidden bg-[linear-gradient(135deg,#102033_0%,#18324c_54%,#1f8f55_160%)] text-white">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Today&apos;s command view</p>
                <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                  Keep every payout lane visible, funded, and trusted.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/74">
                  The redesigned AfriWage dashboard centers the actual operator workflow:
                  fund treasury, review workers, send payroll, and confirm delivery.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/send"
                  className="rounded-[20px] bg-white px-5 py-4 text-center font-semibold text-[#102033] transition-transform hover:scale-[0.99] active:scale-[0.97]"
                >
                  Send payroll
                </Link>
                <Link
                  href="/transactions"
                  className="rounded-[20px] border border-white/15 px-5 py-4 text-center font-semibold text-white transition-colors hover:bg-white/8"
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
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">17 days funded</h3>
              </div>
              <div className="rounded-2xl bg-[#dff3e8] p-3 text-[#1f8f55]">
                <Wallet2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 h-3 rounded-full bg-[#efe3d0]">
              <div className="h-3 w-[72%] rounded-full bg-[linear-gradient(90deg,#1f8f55_0%,#8dca62_100%)]" />
            </div>
            <div className="mt-5 space-y-3 text-sm text-[#637085]">
              <div className="flex items-center justify-between">
                <span>USDC treasury available</span>
                <span className="font-mono text-[#102033]">$124,500</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next scheduled batch</span>
                <span className="font-medium text-[#102033]">Tuesday, 11:00 WAT</span>
              </div>
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <SurfaceCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Queue status</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">What needs attention next</h3>
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
                    <p className="font-display text-lg font-semibold text-[#102033]">{queue.title}</p>
                    <span className="font-mono text-sm text-[#1f8f55]">{queue.amount}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#637085]">{queue.detail}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Worker readiness</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">Who can be paid right now</h3>
              </div>
              <Link href="/worker" className="text-sm font-semibold text-[#1f8f55]">
                Open worker view
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {workerHighlights.map((worker) => (
                <div
                  key={worker.name}
                  className="flex flex-col gap-3 rounded-[22px] border border-[#efe3d0] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#102033] text-sm font-semibold text-white">
                      {worker.name
                        .split(' ')
                        .map((name) => name[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#102033]">{worker.name}</p>
                      <p className="text-sm text-[#637085]">{worker.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="font-mono text-sm text-[#102033]">{worker.amount}</span>
                    <span className="rounded-full bg-[#dff3e8] px-3 py-1 text-xs font-semibold text-[#1f8f55]">
                      {worker.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Recent activity</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">Payment confidence feed</h3>
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

          <div className="space-y-6">
            <SurfaceCard className="bg-[#fff8ef]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Primary path</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">Ship payroll in 3 steps</h3>
                </div>
                <Users2 className="h-5 w-5 text-[#8c7760]" />
              </div>
              <div className="mt-6 space-y-4">
                {[
                  'Review which workers are ready and which profiles still need offramp details.',
                  'Use Send payout to move USDC from treasury to the selected worker wallet.',
                  'Confirm delivery from transaction history and share the worker passport when needed.',
                ].map((step, index) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#102033] text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <p className="text-sm leading-6 text-[#637085]">{step}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#dff3e8] p-3 text-[#1f8f55]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[#102033]">Mobile-first operator flow</p>
                  <p className="mt-2 text-sm leading-6 text-[#637085]">
                    The bottom navigation keeps the core routes reachable on small screens,
                    while the sticky header preserves the main payout action.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
