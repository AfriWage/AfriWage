'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Logistics Africa');
  const [email, setEmail] = useState('admin@acmelogistics.com');
  const [twoFa, setTwoFa] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('USD - US Dollar');
  const [offramp, setOfframp] = useState('Corporate Bank Account (...4932)');
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPassword(true);
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setSavedPassword(false), 2500);
  };

  return (
    <div className="font-body text-body text-on-background flex h-screen overflow-hidden antialiased bg-surface">
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden bg-surface/90 backdrop-blur-md h-20 px-8 flex items-center justify-between border-b border-outline-variant z-50 shrink-0">
          <div className="font-h3 text-h3 text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            AfriWage
          </div>
          <button type="button" className="text-on-surface">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-gutter md:p-margin pb-24">
          <div className="max-w-[800px] mx-auto">

            {/* Page header */}
            <div className="mb-8">
              <h1 className="font-h2 text-h2 text-on-surface mb-2">Settings</h1>
              <p className="font-body text-body text-secondary">
                Manage your organization profile, security, and payment preferences.
              </p>
            </div>

            <div className="space-y-8">

              {/* ── Section 1: Organization Profile ── */}
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-gutter shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-outline-variant">
                  <span className="material-symbols-outlined text-secondary">corporate_fare</span>
                  <h2 className="font-h3 text-on-surface text-[20px] font-semibold">Organization Profile</h2>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant">
                        <span className="material-symbols-outlined text-[48px] text-primary">corporate_fare</span>
                      </div>
                      <button type="button" className="text-primary font-body-sm text-body-sm hover:underline font-medium">
                        Update Logo
                      </button>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block font-body-sm text-body-sm text-on-surface-variant font-medium mb-1">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="w-full h-[48px] px-3 border border-outline-variant rounded-lg font-body text-body text-on-surface focus:outline-none focus:border-2 focus:border-primary bg-surface-container-lowest transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-body-sm text-body-sm text-on-surface-variant font-medium mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-[48px] px-3 border border-outline-variant rounded-lg font-body text-body text-on-surface focus:outline-none focus:border-2 focus:border-primary bg-surface-container-lowest transition-colors"
                        />
                      </div>
                      <div className="pt-2 flex items-center gap-4">
                        <button
                          type="submit"
                          className="bg-primary-container text-on-primary font-body text-body py-3 px-6 rounded-lg hover:bg-primary hover:shadow-md transition-all font-medium"
                        >
                          Save Profile
                        </button>
                        {savedProfile && (
                          <span className="font-body-sm text-body-sm text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Saved!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </section>

              {/* ── Section 2: Security ── */}
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-gutter shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-outline-variant">
                  <span className="material-symbols-outlined text-secondary">security</span>
                  <h2 className="font-h3 text-on-surface text-[20px] font-semibold">Security</h2>
                </div>

                <div className="space-y-6">
                  {/* 2FA Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-body text-body font-medium text-on-surface">Two-Factor Authentication</h3>
                      <p className="font-body-sm text-body-sm text-secondary mt-1">
                        Require a secondary code for all administrative logins and high-value payments.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={twoFa}
                      onClick={() => setTwoFa(!twoFa)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFa ? 'bg-primary-container' : 'bg-surface-container-highest'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ease-in-out ${
                          twoFa ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Change Password */}
                  <form onSubmit={handleUpdatePassword} className="pt-4 border-t border-surface-container-highest">
                    <h3 className="font-body text-body font-medium text-on-surface mb-4">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block font-body-sm text-body-sm text-on-surface-variant font-medium mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full h-[48px] px-3 border border-outline-variant rounded-lg font-body text-body text-on-surface focus:outline-none focus:border-2 focus:border-primary bg-surface-container-lowest transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-body-sm text-body-sm text-on-surface-variant font-medium mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-[48px] px-3 border border-outline-variant rounded-lg font-body text-body text-on-surface focus:outline-none focus:border-2 focus:border-primary bg-surface-container-lowest transition-colors"
                        />
                      </div>
                      <div className="pt-2 flex items-center gap-4">
                        <button
                          type="submit"
                          className="bg-transparent border border-outline-variant text-on-surface font-body text-body py-3 px-6 rounded-lg hover:bg-surface-container-low transition-colors font-medium"
                        >
                          Update Password
                        </button>
                        {savedPassword && (
                          <span className="font-body-sm text-body-sm text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Updated!
                          </span>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              {/* ── Section 3: Payment Preferences ── */}
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-gutter shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-outline-variant">
                  <span className="material-symbols-outlined text-secondary">tune</span>
                  <h2 className="font-h3 text-on-surface text-[20px] font-semibold">Payment Preferences</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-body-sm text-body-sm text-on-surface-variant font-medium mb-1">
                      Default Display Currency
                    </label>
                    <div className="relative">
                      <select
                        value={displayCurrency}
                        onChange={(e) => setDisplayCurrency(e.target.value)}
                        className="w-full h-[48px] pl-3 pr-10 border border-outline-variant rounded-lg font-body text-body text-on-surface focus:outline-none focus:border-2 focus:border-primary bg-surface-container-lowest appearance-none cursor-pointer"
                      >
                        <option>USD - US Dollar</option>
                        <option>NGN - Nigerian Naira</option>
                        <option>KES - Kenyan Shilling</option>
                        <option>ZAR - South African Rand</option>
                        <option>GHS - Ghanaian Cedi</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-body-sm text-body-sm text-on-surface-variant font-medium mb-1">
                      Auto-Offramp Destination
                    </label>
                    <div className="relative">
                      <select
                        value={offramp}
                        onChange={(e) => setOfframp(e.target.value)}
                        className="w-full h-[48px] pl-3 pr-10 border border-outline-variant rounded-lg font-body text-body text-on-surface focus:outline-none focus:border-2 focus:border-primary bg-surface-container-lowest appearance-none cursor-pointer"
                      >
                        <option>Corporate Bank Account (...4932)</option>
                        <option>Mobile Money (M-PESA)</option>
                        <option>Hold in USDC</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Section 4: Connected Wallets ── */}
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-gutter shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
                    <h2 className="font-h3 text-on-surface text-[20px] font-semibold">Connected Wallets</h2>
                  </div>
                  <button
                    type="button"
                    className="text-primary font-body-sm text-body-sm font-medium flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Wallet
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Wallet 1 — Active */}
                  <div className="flex items-center justify-between p-4 border border-outline-variant rounded-lg bg-surface hover:border-on-surface-variant transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                      </div>
                      <div>
                        <div className="font-body text-body font-medium text-on-surface">Primary Treasury (Stellar)</div>
                        <div className="font-label-mono text-label-mono text-secondary mt-1">GCO2...X9L4</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Active
                      </span>
                      <button type="button" className="text-secondary hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>

                  {/* Wallet 2 */}
                  <div className="flex items-center justify-between p-4 border border-outline-variant rounded-lg bg-surface hover:border-on-surface-variant transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-[20px]">account_balance</span>
                      </div>
                      <div>
                        <div className="font-body text-body font-medium text-on-surface">Secondary Payout (Stellar)</div>
                        <div className="font-label-mono text-label-mono text-secondary mt-1">GBK4...P2M1</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-secondary hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
