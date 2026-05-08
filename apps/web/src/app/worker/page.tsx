'use client';

import { Clock, MapPin, TrendingUp, Users, Wallet, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WalletConnect } from '@/components/WalletConnect';
import { truncatePublicKey } from '@/lib/stellar';
import { SUPPORTED_COUNTRIES } from '@/types';

// Worker page — a public payment history passport for a given Stellar address.
// Workers can share their public key to show their payment history to employers.

export default function WorkerPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [lookupKey, setLookupKey] = useState('');
  const [viewingKey, setViewingKey] = useState<string | null>(null);

  const handleConnect = useCallback((pk: string) => {
    setPublicKey(pk);
    setViewingKey(pk);
  }, []);

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
    setViewingKey(null);
  }, []);

  const handleLookup = useCallback(() => {
    if (lookupKey.trim().length >= 56) {
      setViewingKey(lookupKey.trim());
    }
  }, [lookupKey]);

  return (
    <div className="min-h-screen bg-brand-surface selection:bg-brand-primary/10 selection:text-brand-primary">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-brand-outline-variant bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-brand-secondary transition-colors hover:text-brand-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy">
                <span className="font-mono text-xs font-black text-white">A</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-brand-navy">Worker Portal</span>
            </div>
          </div>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary shadow-2xl shadow-brand-primary/30">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-brand-navy">Professional Passport</h1>
          <p className="mt-4 text-lg font-medium text-brand-secondary">
            Your on-chain verified payment history and proof of international work.
          </p>
        </div>

        {/* Connect or lookup */}
        {!viewingKey ? (
          <div className="space-y-8">
            <div className="tonal-card rounded-[32px] p-10 text-center border-2 border-dashed border-brand-outline-variant bg-white">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface">
                <Wallet className="h-8 w-8 text-brand-primary" />
              </div>
              <h2 className="mb-3 text-2xl font-black text-brand-navy">Connect Identity</h2>
              <p className="mb-8 font-medium text-brand-secondary max-w-sm mx-auto">
                Securely connect your wallet to view your personal payment history and generate your shareable passport.
              </p>
              <div className="flex justify-center">
                <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
              </div>
            </div>

            <div className="relative flex items-center gap-6">
              <div className="flex-1 border-t border-brand-outline-variant" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary opacity-40">Verification Lookup</span>
              <div className="flex-1 border-t border-brand-outline-variant" />
            </div>

            <div className="tonal-card rounded-[32px] p-10">
              <label
                htmlFor="lookup-address"
                className="mb-4 block text-xs font-black uppercase tracking-widest text-brand-secondary"
              >
                Stellar Public Key
              </label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-secondary opacity-40" />
                  <input
                    id="lookup-address"
                    type="text"
                    placeholder="G... Stellar address"
                    value={lookupKey}
                    onChange={(e) => setLookupKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    className="w-full rounded-2xl border border-brand-outline-variant bg-brand-surface pl-12 pr-4 py-4 font-mono text-sm font-bold text-brand-navy placeholder-brand-secondary/40 outline-none transition-all focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookupKey.trim().length < 56}
                  className="rounded-2xl bg-brand-navy px-8 py-4 text-sm font-black text-white shadow-xl shadow-brand-navy/20 transition-all hover:scale-105 disabled:opacity-30 active:scale-95"
                >
                  Verify Key
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-8">
            {/* Passport Identity Card */}
            <div className="tonal-card relative overflow-hidden rounded-[32px] bg-brand-navy p-10 text-white">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-primary/20 blur-[80px]" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                      Verified Professional
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-white/90 leading-none">
                          {truncatePublicKey(viewingKey, 16)}
                        </p>
                        {publicKey === viewingKey && (
                          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/40">Owner Identity Connected</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                      <TrendingUp className="h-4 w-4 text-brand-primary" />
                      <span className="text-xs font-black uppercase tracking-widest">Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewingKey(null);
                        setLookupKey('');
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Settlement Network</p>
                    <p className="mt-2 font-mono text-sm font-bold text-white">Stellar Mainnet</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Primary Asset</p>
                    <p className="mt-2 font-mono text-sm font-bold text-white">USDC</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Off-Ramp Speed</p>
                    <p className="mt-2 font-mono text-sm font-bold text-white">&lt; 5 Seconds</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Regions */}
            <div className="tonal-card rounded-[32px] p-10">
              <h2 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-brand-navy">
                <MapPin className="h-5 w-5 text-brand-primary" />
                Active Off-Ramp Corridors
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {SUPPORTED_COUNTRIES.map((country) => (
                  <div
                    key={country.code}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-brand-outline-variant bg-brand-surface p-6 text-center transition-all hover:border-brand-primary/20 hover:bg-white"
                  >
                    <span className="text-4xl grayscale hover:grayscale-0 transition-all">{country.flag}</span>
                    <div>
                      <p className="text-xs font-black text-brand-navy">{country.name}</p>
                      <p className="mt-1 font-mono text-[10px] font-bold text-brand-primary uppercase">{country.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-xs font-medium text-brand-secondary leading-relaxed italic text-center">
                Automated local currency delivery is live in these regions via Stellar protocol SEP-24 anchors.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="tonal-card rounded-[32px] p-10 bg-white">
              <h2 className="mb-8 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-brand-navy">
                <Clock className="h-5 w-5 text-brand-primary" />
                Settlement Lifecycle
              </h2>
              <div className="space-y-6">
                {[
                  'Global employer initiates USDC payroll via AfriWage platform.',
                  'Funds settle instantly on the Stellar immutable ledger.',
                  'Integrated SEP-24 anchors detect inbound liquidity for your key.',
                  'Funds are dispatched to your bank or mobile money via local rails.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-6">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-xs font-black text-white">
                      0{i + 1}
                    </div>
                    <p className="text-sm font-bold text-brand-navy leading-relaxed pt-1.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction history section */}
            <div className="animate-fade-in-up">
              <TransactionHistory publicKey={viewingKey} className="bg-white border-2 border-brand-outline-variant shadow-2xl shadow-brand-navy/5" />
            </div>
          </div>
        )}
      </main>

      {/* Simplified Footer */}
      <footer className="border-t border-brand-outline-variant bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-navy">
              <span className="font-mono text-[10px] font-black text-white">A</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-brand-navy uppercase">AfriWage Protocol</span>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-brand-secondary">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-brand-primary transition-colors">Dashboard</Link>
            <a href="https://github.com/AfriWage/AfriWage" target="_blank" className="hover:text-brand-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
