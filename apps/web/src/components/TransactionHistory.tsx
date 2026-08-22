'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTransactions } from '@/lib/api';
import type { TransactionRecord } from '@/lib/stellar';
import { cn, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionHistoryProps {
  publicKey: string;
  className?: string;
}

type TransactionFilter = 'all' | 'sent' | 'received';

function TransactionSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-xl p-2">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-surface">
        <Clock className="h-8 w-8 text-brand-secondary/30" />
      </div>
      <div>
        <p className="font-bold text-brand-navy">No transactions yet</p>
        <p className="mt-1 text-sm text-brand-secondary">Your payroll activity will appear here.</p>
      </div>
    </div>
  );
}

export function TransactionHistory({ publicKey, className }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [pages, setPages] = useState<TransactionRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageCursor, setPageCursor] = useState<string | undefined>(undefined);

  const query = useQuery({
    queryKey: ['transactions', publicKey, filter, pageCursor ?? 'initial'],
    queryFn: () =>
      getTransactions(publicKey, {
        limit: 10,
      }),
    enabled: Boolean(publicKey),
  });

  useEffect(() => {
    setPages([]);
    setNextCursor(null);
    setPageCursor(undefined);
  }, [publicKey, filter]);

  useEffect(() => {
    if (!query.data) return;

    setPages((current) => (pageCursor ? [...current, ...query.data] : query.data));
    setNextCursor(null);
  }, [query.data, pageCursor]);

  const isIncoming = (tx: TransactionRecord) => tx.to === publicKey;
  const isInitialLoading = query.isLoading && pages.length === 0;
  const hasError = query.isError && pages.length === 0;
  const isLoadingMore = query.isFetching && pages.length > 0;

  return (
    <div className={cn('tonal-card rounded-2xl p-8', className)}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Activity</h2>
          <p className="mt-1 text-sm text-brand-secondary">Live payout history for this wallet.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPages([]);
            setPageCursor(undefined);
            void query.refetch();
          }}
          disabled={query.isFetching}
          className="flex items-center gap-2 rounded-xl border border-brand-outline-variant px-4 py-2 text-xs font-bold text-brand-secondary transition-all hover:bg-brand-surface"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', query.isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        {(['all', 'sent', 'received'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all',
              filter === tab
                ? 'bg-brand-navy text-white'
                : 'border border-brand-outline-variant text-brand-secondary hover:bg-brand-surface'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isInitialLoading ? (
        <TransactionSkeleton />
      ) : hasError ? (
        <div className="space-y-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">
            {query.error instanceof Error
              ? query.error.message
              : 'Failed to load transaction history'}
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-red-600"
          >
            Retry
          </button>
        </div>
      ) : pages.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {pages.map((tx) => {
            const incoming = isIncoming(tx);
            const isPayment = tx.type === 'payment';

            return (
              <div
                key={tx.id}
                className="group flex items-center gap-4 rounded-xl border border-transparent p-2 transition-all hover:border-brand-outline-variant hover:bg-brand-surface"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                    !tx.successful
                      ? 'bg-red-50 text-red-500'
                      : incoming
                        ? 'bg-green-50 text-brand-primary'
                        : 'bg-blue-50 text-blue-600'
                  )}
                >
                  {isPayment && incoming ? (
                    <ArrowDownLeft className="h-6 w-6" />
                  ) : (
                    <ArrowUpRight className="h-6 w-6" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-brand-navy">
                      {tx.type === 'create_account'
                        ? 'Account Setup'
                        : isPayment
                          ? incoming
                            ? 'Received'
                            : 'Sent Payment'
                          : 'Transaction'}
                    </p>
                    {!tx.successful && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        Failed
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-brand-secondary">
                    {formatDate(tx.createdAt)}
                    {tx.memo && <span className="mx-1.5 opacity-30">·</span>}
                    {tx.memo && <span className="italic">{tx.memo}</span>}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p
                    className={cn(
                      'font-mono text-sm font-bold',
                      !tx.successful
                        ? 'text-red-500'
                        : incoming
                          ? 'text-brand-primary'
                          : 'text-brand-navy'
                    )}
                  >
                    {incoming ? '+' : '-'}
                    {tx.amount} {tx.asset}
                  </p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary opacity-0 transition-opacity hover:text-brand-primary group-hover:opacity-100"
                  >
                    Explorer <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            );
          })}

          {nextCursor && (
            <button
              type="button"
              onClick={() => setPageCursor(nextCursor)}
              disabled={isLoadingMore}
              className="w-full rounded-xl border border-brand-outline-variant py-3 text-sm font-semibold text-brand-secondary transition-all hover:bg-brand-surface disabled:opacity-60"
            >
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
