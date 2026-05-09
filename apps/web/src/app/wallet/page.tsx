'use client';

import { ArrowUpRight, Landmark, ShieldCheck, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import { COMPANY_WALLET } from '@/lib/dashboard-data';

const balances = [
  { asset: 'USDC Treasury', value: '$124,500', detail: 'Primary payroll pool' },
  { asset: 'XLM Gas Buffer', value: '1,245 XLM', detail: 'Network fees and account ops' },
  { asset: 'Pending Inflow', value: '$25,000', detail: 'Awaiting reserve release' },
];

export default function WalletPage() {
  return (
    <DashboardShell
      title="Treasury Wallet"
      description="Keep payroll liquidity healthy, confirm the connected signer, and move to payout from a funded state."
      actions={<WalletConnect />}
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard className="bg-[linear-gradient(135deg,#fffdf8_0%,#fff7ec_100%)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Primary treasury account</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#102033]">$124,500 available</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#637085]">
                  This balance view is optimized for operators: enough context to decide
                  whether you can fund the next run without digging into a separate screen.
                </p>
              </div>
              <div className="rounded-3xl bg-[#102033] p-4 text-white">
                <WalletCards className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-[#eadfce] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Wallet address</p>
              <p className="mt-3 break-all font-mono text-sm text-[#102033]">{COMPANY_WALLET}</p>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Next best actions</p>
            <div className="mt-5 space-y-4">
              <Link
                href="/send"
                className="flex items-center justify-between rounded-[22px] border border-[#e7dccb] bg-[#fffaf2] p-4 transition-colors hover:bg-[#fff4e3]"
              >
                <div>
                  <p className="font-semibold text-[#102033]">Start payout</p>
                  <p className="mt-1 text-sm text-[#637085]">Move directly into a worker payment flow.</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#1f8f55]" />
              </Link>

              <div className="rounded-[22px] border border-[#e7dccb] bg-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#1f8f55]" />
                  <div>
                    <p className="font-semibold text-[#102033]">Signer status</p>
                    <p className="mt-1 text-sm text-[#637085]">
                      Wallet connection lives in the header so funding state and signer state stay visible together.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#e7dccb] bg-white p-4">
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 text-[#8c7760]" />
                  <div>
                    <p className="font-semibold text-[#102033]">Off-ramp readiness</p>
                    <p className="mt-1 text-sm text-[#637085]">
                      Treasury is separate from worker payout preferences, but the screens are now linked through a shared operator shell.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {balances.map((balance) => (
            <SurfaceCard key={balance.asset}>
              <p className="text-sm text-[#637085]">{balance.asset}</p>
              <p className="mt-4 font-display text-3xl font-semibold text-[#102033]">{balance.value}</p>
              <p className="mt-3 text-sm text-[#637085]">{balance.detail}</p>
            </SurfaceCard>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}
