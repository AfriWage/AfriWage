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
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
          <div className="h-9 w-9 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="h-3 w-40 rounded bg-white/10" />
          </div>
          <div className="h-4 w-20 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Clock className="h-10 w-10 text-slate-600" />
      <p className="font-medium text-slate-400">No transactions yet</p>
      <p className="text-sm text-slate-600">
        Send your first payment to get started with AfriWage
      </p>
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
    <div className={cn('rounded-2xl border border-white/10 bg-white/5 p-6', className)}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Transaction History</h2>
        <button
          type="button"
          onClick={() => loadTransactions(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          aria-label="Refresh transaction history"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <TransactionSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const incoming = isIncoming(tx);
            const isPayment = tx.type === 'payment';
            const isCreateAccount = tx.type === 'create_account';

            return (
              <div
                key={tx.id}
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.06]"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    !tx.successful
                      ? 'bg-red-500/20 text-red-400'
                      : incoming
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                  )}
                >
                  {isPayment && incoming ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium capitalize text-white">
                      {isCreateAccount
                        ? 'Account Created'
                        : isPayment
                          ? incoming
                            ? 'Received'
                            : 'Sent'
                          : 'Transaction'}
                    </p>
                    {!tx.successful && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        Failed
                      </span>
                    )}
                    {tx.memo && (
                      <span className="truncate rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                        {tx.memo}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      !tx.successful ? 'text-red-400' : incoming ? 'text-green-400' : 'text-white'
                    )}
                  >
                    {incoming ? '+' : '-'}
                    {tx.amount} {tx.asset}
                  </p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="View transaction on Stellar Explorer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300" />
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
