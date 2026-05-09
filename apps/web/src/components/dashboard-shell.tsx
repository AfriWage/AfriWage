'use client';

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Copy,
  LayoutDashboard,
  Settings,
  Wallet,
  Waves,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import { COMPANY_WALLET } from '@/lib/dashboard-data';
import { copyToClipboard, cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Waves },
  { href: '/worker', label: 'Workers', icon: BriefcaseBusiness },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface DashboardShellProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function DashboardShell({
  title,
  description,
  children,
  actions,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const currentSection = useMemo(
    () =>
      navItems.find(
        (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
      )?.label ?? 'Overview',
    [pathname]
  );

  const handleCopy = async () => {
    const success = await copyToClipboard(COMPANY_WALLET);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f6efe6] text-[#102033]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-[#f2b94b]/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-96 w-96 rounded-full bg-[#1f8f55]/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#e97b63]/10 blur-3xl" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 border-r border-[#d8cebe] bg-[#fffaf2]/90 px-6 py-6 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/dashboard" className="rounded-[28px] border border-[#eadfce] bg-white px-5 py-5 shadow-[0_20px_50px_rgba(16,32,51,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#102033] text-white">
              <span className="font-display text-lg font-bold">A</span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold">AfriWage</p>
              <p className="text-sm text-[#637085]">Payroll operations cockpit</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-[linear-gradient(135deg,#102033_0%,#1c3550_100%)] p-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Current focus</p>
            <p className="mt-2 font-display text-xl">{currentSection}</p>
            <p className="mt-2 text-sm text-white/72">
              Fast payout control across treasury, workers, and transaction review.
            </p>
          </div>
        </Link>

        <nav className="mt-6 space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all',
                  isActive
                    ? 'bg-[#102033] text-white shadow-[0_18px_40px_rgba(16,32,51,0.16)]'
                    : 'text-[#415065] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,32,51,0.07)]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ArrowUpRight className={cn('h-4 w-4', !isActive && 'opacity-40')} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <Link
            href="/send"
            className="flex items-center justify-center gap-2 rounded-[20px] bg-[#1f8f55] px-4 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(31,143,85,0.28)] transition-transform hover:scale-[0.99] active:scale-[0.97]"
          >
            <ArrowUpRight className="h-4 w-4" />
            Send payout
          </Link>

          <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_18px_36px_rgba(16,32,51,0.06)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Treasury wallet</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-[#102033]">{COMPANY_WALLET}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6efe6] text-[#415065] transition-colors hover:bg-[#efe3d0]"
                aria-label="Copy treasury wallet"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#637085]">
              {copied ? 'Wallet copied' : 'Use this account to fund payroll batches.'}
            </p>
          </div>
        </div>
      </aside>

      <main className="pb-24 lg:ml-80 lg:pb-10">
        <div className="sticky top-0 z-20 border-b border-[#e7dccb] bg-[#f6efe6]/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760] lg:hidden">
                AfriWage dashboard
              </p>
              <h1 className="font-display text-[1.9rem] font-semibold leading-tight text-[#102033]">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#637085]">{description}</p>
            </div>

            <div className="hidden shrink-0 items-center gap-3 lg:flex">{actions}</div>
            <Link
              href="/send"
              className="shrink-0 rounded-full border border-[#d8cebe] bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] shadow-[0_8px_24px_rgba(16,32,51,0.06)] lg:hidden"
            >
              Send
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7dccb] bg-[#fffaf2]/94 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium',
                  isActive ? 'bg-[#102033] text-white' : 'text-[#637085]'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_22px_50px_rgba(16,32,51,0.06)] sm:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
