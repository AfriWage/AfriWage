'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { copyToClipboard } from '@/lib/utils';

const navItems = [
  { icon: 'dashboard', label: 'Overview', href: '/dashboard' },
  { icon: 'payments', label: 'Payments', href: '/transactions' },
  { icon: 'account_balance_wallet', label: 'Wallet', href: '/wallet' },
  { icon: 'settings', label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard('GA4F...H9X2');
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <nav className="hidden h-screen w-64 fixed left-0 top-0 overflow-y-auto border-r border-outline-variant bg-surface-container-low p-gutter md:flex md:flex-col md:gap-4 md:z-40 dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(14,29,38,0.08)] dark:bg-[#16163a]">
          <div className="relative h-5 w-5 rotate-[18deg]">
            <span className="absolute left-[1px] top-[2px] h-2 w-1.5 rounded-sm bg-primary" />
            <span className="absolute left-[7px] top-0 h-3 w-1.5 rounded-sm bg-primary-container" />
            <span className="absolute left-[13px] top-[4px] h-2 w-1.5 rounded-sm bg-on-surface dark:bg-white" />
            <span className="absolute left-[4px] top-[10px] h-2 w-1.5 rounded-sm bg-on-surface dark:bg-white" />
            <span className="absolute left-[10px] top-[8px] h-3 w-1.5 rounded-sm bg-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-h3 font-h3 text-primary leading-tight">AfriWage</h1>
          <p className="text-body-sm font-body-sm text-secondary dark:text-[#8888aa]">Enterprise Payroll</p>
        </div>
      </div>

      <ul className="flex-grow flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold dark:bg-[#2a2a5a] dark:text-white'
                    : 'text-secondary hover:bg-surface-container-high hover:opacity-80 dark:text-[#8888aa] dark:hover:bg-[#16163a]'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* CTA + Wallet address */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push('/send')}
          className="bg-primary-container text-on-primary rounded-lg py-3 px-6 font-bold text-center w-full transition-transform hover:scale-[0.98] active:scale-95 dark:bg-[#1a6b40]"
        >
          Send Payment
        </button>

        <div className="bg-surface-container-highest rounded-lg p-3 flex items-center justify-between dark:bg-[#16163a]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
            <span className="font-label-mono text-label-mono text-on-surface dark:text-[#c0c0e0]">GA4F...H9X2</span>
          </div>
          <button
            type="button"
            title="Copy address"
            onClick={handleCopy}
            className="text-secondary hover:text-primary transition-colors dark:text-[#8888aa]"
          >
            <span className="material-symbols-outlined text-[20px]">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
