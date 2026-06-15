'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCallback, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import type { TransactionRecord } from '@/lib/stellar';
import { getTransactionHistory } from '@/lib/stellar';
import { truncatePublicKey } from '@/lib/stellar-format';
import { cn } from '@/lib/utils';

/* ─── TYPES ────────────────────────────────────────────── */

type DirectionFilter = 'all' | 'sent' | 'received';
type AssetFilter = 'all' | 'USDC' | 'XLM';

/* ─── SKELETON ─────────────────────────────────────────── */

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/10', className)} />;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-white/10 py-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="ml-auto h-4 w-24" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
    </div>
  );
}

/* ─── PAGE ─────────────────────────────────────────────── */

export default function TransactionsPage() {
  const t = useTranslations('transactions');
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const handleConnect = useCallback((pk: string) => {
    setPublicKey(pk);
  }, []);

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
  }, []);

  return (
    <DashboardShell
      title={t('title')}
      description={t('description')}
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      <div className="space-y-6">
        {!publicKey ? (
          <DisconnectedState onConnect={handleConnect} onDisconnect={handleDisconnect} />
        ) : (
          <ConnectedTransactions publicKey={publicKey} />
        )}
      </div>
    </DashboardShell>
  );
}

/* ─── DISCONNECTED STATE ───────────────────────────────── */

function DisconnectedState({
  onConnect,
  onDisconnect,
}: {
  onConnect: (pk: string) => void;
  onDisconnect: () => void;
}) {
  return (
    <SurfaceCard>
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-[#f3ecdf] p-6">
          <ArrowLeftRight className="h-12 w-12 text-[#8c7760]" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-[#102033]">
          Connect your wallet to view transactions
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-[#637085]">
          Your full Stellar payment history will appear here once your Freighter wallet is
          connected.
        </p>

        <div className="mt-8">
          <WalletConnect onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </div>
    </SurfaceCard>
  );
}

/* ─── CONNECTED STATE ──────────────────────────────────── */

function ConnectedTransactions({ publicKey }: { publicKey: string }) {
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('all');

  const { data: transactions, isLoading } = useQuery<TransactionRecord[]>({
    queryKey: ['transactions', publicKey],
    queryFn: () => getTransactionHistory(publicKey),
    enabled: !!publicKey,
  });

  /* ── Client-side filtering ── */
  const filtered = (transactions ?? []).filter((tx) => {
    const incoming = tx.to === publicKey;

    if (dirFilter === 'sent' && incoming) return false;
    if (dirFilter === 'received' && !incoming) return false;
    if (assetFilter !== 'all' && tx.asset !== assetFilter) return false;

    return true;
  });

  const directionTabs: { key: DirectionFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'sent', label: 'Sent' },
    { key: 'received', label: 'Received' },
  ];

  return (
    <SurfaceCard>
      {/* ── FILTER ROW ────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Direction tabs */}
        <div className="flex gap-2">
          {directionTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setDirFilter(tab.key)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                dirFilter === tab.key
                  ? 'bg-[#1f8f55] text-white'
                  : 'border border-[#d8cebe] bg-white text-[#637085] hover:border-[#1f8f55]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Asset filter */}
        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value as AssetFilter)}
          className="ml-auto rounded-lg border border-[#d8cebe] bg-white px-3 py-2 text-sm text-[#102033] outline-none focus:border-[#1f8f55]"
        >
          <option value="all">All assets</option>
          <option value="USDC">USDC only</option>
          <option value="XLM">XLM only</option>
        </select>
      </div>

      {/* ── TRANSACTIONS LIST ─────────────────────── */}
      <div className="mt-6">
        {isLoading ? (
          <div>
            {[...Array(8)].map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasTransactions={(transactions ?? []).length > 0} />
        ) : (
          <div>
            {filtered.map((tx) => {
              const incoming = tx.to === publicKey;
              return <TransactionRow key={tx.id} tx={tx} incoming={incoming} />;
            })}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

/* ─── TRANSACTION ROW ────────────────────────────── */

function TransactionRow({ tx, incoming }: { tx: TransactionRecord; incoming: boolean }) {
  const formattedDate = new Date(tx.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = new Date(tx.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex cursor-pointer items-center justify-between rounded-lg border-b border-[#efe3d0] px-4 py-4 transition-colors last:border-0 hover:bg-[#fffaf2]"
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            incoming ? 'bg-[#14A800]/10' : 'bg-[#E24B4A]/10'
          )}
        >
          {incoming ? (
            <ArrowDownLeft className="h-5 w-5 text-[#14A800]" />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-[#E24B4A]" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#102033]">{tx.memo || 'Payment'}</p>
          <p className="text-xs text-[#8c7760]">
            {formattedDate} · {formattedTime}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p
            className={cn('text-sm font-semibold', incoming ? 'text-[#14A800]' : 'text-[#E24B4A]')}
          >
            {incoming ? '+' : '-'}
            {tx.amount} {tx.asset}
          </p>
          <p className="font-mono text-xs text-[#8c7760]">
            {truncatePublicKey(incoming ? tx.from : tx.to, 4)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#8c7760]/40" />
      </div>
    </a>
  );
}

/* ─── EMPTY STATE ──────────────────────────────────────── */

function EmptyState({ hasTransactions }: { hasTransactions: boolean }) {
  return (
    <div className="mt-6 rounded-xl border border-[#efe3d0] bg-[#fffaf2] p-12 text-center">
      <div className="mx-auto w-fit rounded-full bg-[#f3ecdf] p-4">
        <ArrowLeftRight className="h-12 w-12 text-[#8c7760]" />
      </div>
      <p className="mt-4 text-base font-semibold text-[#102033]">No transactions found</p>
      <p className="mt-2 text-sm text-[#637085]">
        {hasTransactions
          ? 'Try a different filter.'
          : 'Try a different filter or send your first payment.'}
      </p>
      {!hasTransactions && (
        <Link
          href="/send"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#14A800] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#108A00]"
        >
          Send Payment →
        </Link>
      )}
    </div>
  );
}
