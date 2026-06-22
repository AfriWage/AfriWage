'use client';

import { ArrowUpRight, Clock3, Copy, LayoutDashboard, Settings, Upload, Wallet, Waves } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link, usePathname } from '@/i18n/navigation';
import { COMPANY_WALLET } from '@/lib/dashboard-data';
import { copyToClipboard, cn } from '@/lib/utils';

interface DashboardShellProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function DashboardShell({ title, description, children, actions }: DashboardShellProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const navItems = [
    { href: '/dashboard' as const, label: t('overview'), icon: LayoutDashboard },
    { href: '/send' as const, label: t('sendPayment'), icon: ArrowUpRight },
    { href: '/batch' as const, label: t('batchPayments'), icon: Upload },
    { href: '/transactions' as const, label: t('transactions'), icon: Waves },
    { href: '/scheduled' as const, label: 'Scheduled', icon: Clock3 },
    { href: '/wallet' as const, label: t('wallet'), icon: Wallet },
    { href: '/settings' as const, label: t('settings'), icon: Settings },
  ];

  const handleCopy = async () => {
    const success = await copyToClipboard(COMPANY_WALLET);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f6efe6] text-[#102033] dark:bg-[#0a0a1a] dark:text-[#e2e8f0]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-[#f2b94b]/20 blur-3xl dark:bg-[#f2b94b]/5" />
        <div className="absolute right-[-6rem] top-24 h-96 w-96 rounded-full bg-[#1f8f55]/12 blur-3xl dark:bg-[#1f8f55]/5" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#e97b63]/10 blur-3xl dark:bg-[#e97b63]/5" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 border-r border-[#d8cebe] bg-[#fffaf2] px-6 py-6 lg:flex lg:flex-col dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
        <Link
          href="/dashboard"
          className="rounded-[28px] border border-[#eadfce] bg-white px-5 py-5 shadow-[0_20px_50px_rgba(16,32,51,0.08)] dark:border-[#1e1e3a] dark:bg-[#16163a] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#102033] text-white dark:bg-[#2a2a5a]">
              <span className="font-display text-lg font-bold">A</span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold dark:text-white">AfriWage</p>
              <p className="text-sm text-[#637085] dark:text-[#8888aa]">{t('payrollCockpit')}</p>
            </div>
          </div>
        </Link>

        <nav className="mt-6 space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf2] dark:focus-visible:ring-offset-[#0f0f24]',
                  isActive
                    ? 'bg-[#102033] text-white shadow-[0_18px_40px_rgba(16,32,51,0.16)] dark:bg-[#2a2a5a] dark:shadow-[0_18px_40px_rgba(0,0,0,0.3)]'
                    : 'text-[#415065] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,32,51,0.07)] dark:text-[#8888aa] dark:hover:bg-[#16163a] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]'
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
            className="flex items-center justify-center gap-2 rounded-[20px] bg-[#1f8f55] px-4 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(31,143,85,0.28)] transition-transform hover:scale-[0.99] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf2] dark:bg-[#1a6b40] dark:focus-visible:ring-offset-[#0f0f24] dark:shadow-[0_18px_36px_rgba(0,0,0,0.3)]"
          >
            <ArrowUpRight className="h-4 w-4" />
            {t('sendPayout')}
          </Link>

          <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_18px_36px_rgba(16,32,51,0.06)] dark:border-[#1e1e3a] dark:bg-[#16163a] dark:shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]">{t('treasuryWallet')}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-[#102033] dark:text-[#c0c0e0]">{COMPANY_WALLET}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6efe6] text-[#415065] transition-colors hover:bg-[#efe3d0] dark:bg-[#1a1a3a] dark:text-[#8888aa] dark:hover:bg-[#2a2a5a]"
                aria-label={t('copyTreasuryWallet')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#637085] dark:text-[#7777aa]">
              {copied ? t('walletCopied') : t('fundPayrollBatches')}
            </p>
          </div>
        </div>
      </aside>

      <main className="pb-24 lg:ml-80 lg:pb-10">
        <div className="sticky top-0 z-20 border-b border-[#e7dccb] bg-white dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-[1.9rem] font-semibold leading-tight text-[#102033] dark:text-white">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#637085] hidden sm:block dark:text-[#8888aa]">{description}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle className="h-10 w-10 rounded-2xl bg-[#f6efe6] text-[#415065] hover:bg-[#efe3d0] dark:bg-[#1a1a3a] dark:text-[#8888aa] dark:hover:bg-[#2a2a5a]" />
              <LanguageSwitcher />
              {actions}
              <Link
                href="/send"
                className="shrink-0 rounded-full border border-[#d8cebe] bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold text-[#102033] shadow-[0_8px_24px_rgba(16,32,51,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden dark:border-[#1e1e3a] dark:bg-[#16163a] dark:text-[#e2e8f0] dark:focus-visible:ring-offset-[#0f0f24] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              >
                {t('send')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e7dccb] bg-[#fffaf2] pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl min-w-[4rem] py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf2] dark:focus-visible:ring-offset-[#0f0f24]',
                  isActive ? 'text-[#102033] dark:text-white' : 'text-[#637085] dark:text-[#8888aa]'
                )}
              >
                <div className={cn("p-1.5 rounded-xl transition-colors", isActive ? "bg-[#102033] text-white dark:bg-[#2a2a5a]" : "text-[#637085] bg-transparent dark:text-[#8888aa]")}>
                  <Icon className="h-5 w-5" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_22px_50px_rgba(16,32,51,0.06)] sm:p-6 dark:border-[#1e1e3a] dark:bg-[#16163a] dark:shadow-[0_22px_50px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {children}
    </div>
  );
}
