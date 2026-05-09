'use client';

import { BellRing, Building2, LockKeyhole, Wallet2 } from 'lucide-react';
import { useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Logistics Africa');
  const [email, setEmail] = useState('admin@acmelogistics.com');
  const [displayCurrency, setDisplayCurrency] = useState('USD - US Dollar');
  const [offramp, setOfframp] = useState('Corporate Bank Account (...4932)');
  const [twoFa, setTwoFa] = useState(true);

  return (
    <DashboardShell
      title="Settings"
      description="Profile, security, and payout preferences now live inside the same operator framework as the rest of the dashboard."
      actions={<WalletConnect />}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-6">
          <SurfaceCard>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#1f8f55]" />
              <h2 className="font-display text-2xl font-semibold text-[#102033]">Organization profile</h2>
            </div>
            <div className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm text-[#637085]">
                Organization name
                <input
                  type="text"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  className="h-12 rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] px-4 text-[#102033] outline-none focus:border-[#1f8f55]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[#637085]">
                Contact email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] px-4 text-[#102033] outline-none focus:border-[#1f8f55]"
                />
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-[#1f8f55]" />
              <h2 className="font-display text-2xl font-semibold text-[#102033]">Security posture</h2>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-[22px] border border-[#efe3d0] bg-[#fff8ef] p-4">
              <div>
                <p className="font-semibold text-[#102033]">Two-factor authentication</p>
                <p className="mt-1 text-sm text-[#637085]">
                  Protect administrative logins and high-value payout approvals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTwoFa((value) => !value)}
                className={`relative h-7 w-12 rounded-full transition-colors ${twoFa ? 'bg-[#1f8f55]' : 'bg-[#d8cebe]'}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${twoFa ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <SurfaceCard>
            <div className="flex items-center gap-3">
              <Wallet2 className="h-5 w-5 text-[#1f8f55]" />
              <h2 className="font-display text-2xl font-semibold text-[#102033]">Payment preferences</h2>
            </div>
            <div className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm text-[#637085]">
                Display currency
                <select
                  value={displayCurrency}
                  onChange={(event) => setDisplayCurrency(event.target.value)}
                  className="h-12 rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] px-4 text-[#102033] outline-none"
                >
                  <option>USD - US Dollar</option>
                  <option>NGN - Nigerian Naira</option>
                  <option>KES - Kenyan Shilling</option>
                  <option>ZAR - South African Rand</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[#637085]">
                Default offramp destination
                <select
                  value={offramp}
                  onChange={(event) => setOfframp(event.target.value)}
                  className="h-12 rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] px-4 text-[#102033] outline-none"
                >
                  <option>Corporate Bank Account (...4932)</option>
                  <option>Mobile Money</option>
                  <option>Hold in USDC</option>
                </select>
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard className="bg-[#fff8ef]">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-[#1f8f55]" />
              <h2 className="font-display text-2xl font-semibold text-[#102033]">Why this redesign works</h2>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#637085]">
              Settings are no longer visually detached from the operational workflow. The same shell, typography,
              and spacing system keeps orientation intact when an operator moves from payroll execution into configuration.
            </p>
          </SurfaceCard>
        </div>
      </div>
    </DashboardShell>
  );
}
