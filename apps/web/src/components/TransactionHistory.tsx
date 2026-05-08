'use client';

import { ArrowDownLeft, ArrowUpRight, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { TransactionRecord } from '@/lib/stellar';
import { getTransactionHistory } from '@/lib/stellar';
import { cn, formatDate } from '@/lib/utils';

interface TransactionHistoryProps {
  publicKey: string;
  className?: string;
}

function TransactionSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-brand-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-brand-surface" />
            <div className="h-3 w-40 rounded bg-brand-surface" />
          </div>
          <div className="h-4 w-20 rounded bg-brand-surface" />
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
        <p className="font-bold text-brand-navy">No transactions found</p>
        <p className="mt-1 text-sm text-brand-secondary">
          Your payroll activity will appear here.
        </p>
      </div>
    </div>
  );
}

export function TransactionHistory({ publicKey, className }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const txs = await getTransactionHistory(publicKey);
        setTransactions(txs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transaction history';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [publicKey]
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const isIncoming = (tx: TransactionRecord) => tx.to === publicKey;

  return (
    <div className={cn('tonal-card rounded-2xl p-8', className)}>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-navy">Activity</h2>
        <button
          type="button"
          onClick={() => loadTransactions(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-brand-outline-variant px-4 py-2 text-xs font-bold text-brand-secondary transition-all hover:bg-brand-surface"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <TransactionSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const incoming = isIncoming(tx);
            const isPayment = tx.type === 'payment';

            return (
              <div
                key={tx.id}
                className="group flex items-center gap-4 rounded-xl border border-transparent p-2 transition-all hover:border-brand-outline-variant hover:bg-brand-surface"
              >
                {/* Icon */}
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

                {/* Details */}
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

                {/* Amount */}
                <div className="flex flex-col items-end gap-1">
                  <p
                    className={cn(
                      'font-mono text-sm font-bold',
                      !tx.successful ? 'text-red-500' : incoming ? 'text-brand-primary' : 'text-brand-navy'
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
        </div>
      )}
    </div>
  );
}
