'use client';

import { useQuery } from '@tanstack/react-query';
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  UserSearch,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { getAccount, getTransactions } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getPublicKey as freighterGetPublicKey } from '@/lib/freighter';

/* ─── SKELETON ─────────────────────────────────────────── */

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-[#E5E7EB]', className)} />
  );
}

function truncateAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* ─── PAGE ─────────────────────────────────────────────── */

export default function WorkerPage() {
  const [searchAddress, setSearchAddress] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [freighterError, setFreighterError] = useState<string | null>(null);

  const isValidKey = inputKey.startsWith('G') && inputKey.length === 56;

  const handleSubmit = useCallback(() => {
    if (isValidKey) {
      setSearchAddress(inputKey.trim());
    }
  }, [inputKey, isValidKey]);

  const handleFreighterConnect = useCallback(async () => {
    setFreighterError(null);

    try {
      const pk = await freighterGetPublicKey();
      setInputKey(pk);
      setSearchAddress(pk);
    } catch (err) {
      setFreighterError(
        err instanceof Error ? err.message : 'Failed to connect Freighter'
      );
    }
  }, []);

  const handleClear = useCallback(() => {
    setSearchAddress(null);
    setInputKey('');
    setFreighterError(null);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAVBAR ────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-16 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#111111]"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#14A800]" />
              <span className="font-semibold text-[#111111]">
                Worker Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-sm text-[#6B7280] transition-colors hover:text-[#111111] sm:inline"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {!searchAddress ? (
          <EntryState
            inputKey={inputKey}
            setInputKey={setInputKey}
            isValidKey={isValidKey}
            onSubmit={handleSubmit}
            onFreighterConnect={handleFreighterConnect}
            freighterError={freighterError}
          />
        ) : (
          <WorkerPassport
            searchAddress={searchAddress}
            onClear={handleClear}
          />
        )}
      </main>
    </div>
  );
}

/* ─── STATE A: ENTRY ───────────────────────────────────── */

function EntryState({
  inputKey,
  setInputKey,
  isValidKey,
  onSubmit,
  onFreighterConnect,
  freighterError,
}: {
  inputKey: string;
  setInputKey: (v: string) => void;
  isValidKey: boolean;
  onSubmit: () => void;
  onFreighterConnect: () => void;
  freighterError: string | null;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <UserSearch className="mx-auto h-16 w-16 text-[#E5E7EB]" />

      <h2 className="mt-6 text-2xl font-bold text-[#111111]">
        Worker Passport
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[#6B7280]">
        Enter a worker's Stellar public key to view their on-chain payment history, or connect your Freighter wallet to view your own passport.
      </p>

      {/* Address input */}
      <div className="mt-8 w-full max-w-md mx-auto">
        <input
          type="text"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="G... Stellar Address"
          className="h-12 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-center font-mono text-sm text-[#111111] placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50"
        />

        <div className="mt-4 flex max-w-md mx-auto justify-center gap-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValidKey}
            className="w-full rounded-lg bg-[#111111] px-6 py-3 font-semibold text-white transition-colors hover:bg-black disabled:opacity-40"
          >
            Verify Key
          </button>
          
          <button
            type="button"
            onClick={onFreighterConnect}
            className="w-full rounded-lg bg-[#14A800] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#108A00]"
          >
            Connect Freighter
          </button>
        </div>

        {freighterError && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {freighterError}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── STATE B: WORKER PASSPORT ─────────────────────────── */

function WorkerPassport({
  searchAddress,
  onClear,
}: {
  searchAddress: string;
  onClear: () => void;
}) {
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', searchAddress],
    queryFn: () => getAccount(searchAddress!),
    enabled: !!searchAddress,
    refetchInterval: 30000,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', searchAddress],
    queryFn: () => getTransactions(searchAddress!, { limit: 10 }),
    enabled: !!searchAddress,
  });

  return (
    <div className="space-y-8">
      {/* ── PASSPORT HEADER ───────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">
            Worker Passport
          </h1>
          <p className="mt-1 font-mono text-sm text-[#6B7280]">
            Public key: {truncateAddress(searchAddress)}
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-4 py-2 font-medium text-sm text-[#E24B4A] transition-colors hover:bg-[#FFF1F2]"
        >
          Clear Search
        </button>
      </div>

      {/* ── BALANCE CARDS ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
        {/* USDC Balance Card */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
            USDC Balance
          </p>
          {accountLoading ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <div className="mt-2 flex flex-col items-start gap-2">
              <p className="text-3xl font-bold text-[#111111]">
                {account?.usdcBalance || '0.00'}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#14A800]">
                ● Verified on testnet
              </span>
            </div>
          )}
        </div>

        {/* Account Status Card */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
            Account Status
          </p>
          {accountLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <div className="mt-2">
              {account?.isActive ? (
                <p className="text-3xl font-bold text-[#14A800]">Active</p>
              ) : (
                <p className="text-3xl font-bold text-[#E24B4A]">Not funded</p>
              )}
              <p className="mt-1 text-sm text-[#6B7280]">
                {account?.xlmBalance || '0.00'} XLM reserve
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── PAYMENT HISTORY ───────────────────────── */}
      <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h3 className="mb-6 text-lg font-semibold text-[#111111]">
          On-Chain Payment History
        </h3>

        {txLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-[#E5E7EB] py-4 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                  <Skeleton className="ml-auto h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (transactions ?? []).length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-[#F9FAFB]">
            <p className="text-sm text-[#6B7280]">
              No payment history found for this address.
            </p>
          </div>
        ) : (
          <div>
            {(transactions ?? []).map((tx) => {
              const incoming = tx.to === searchAddress;
              const dateObj = new Date(tx.createdAt);
              const date = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b border-[#E5E7EB] py-4 last:border-0"
                >
                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F9FAFB]">
                      {incoming ? (
                        <ArrowDownLeft className="h-5 w-5 text-[#14A800]" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-[#E24B4A]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        {tx.memo || 'Payroll Deposit'}
                      </p>
                      <p className="text-xs text-[#6B7280]">{date}</p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        incoming ? 'text-[#14A800]' : 'text-[#E24B4A]'
                      )}
                    >
                      {incoming ? '+' : '-'}
                      {tx.amount} {tx.asset}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      From: {truncateAddress(incoming ? tx.from : tx.to)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
