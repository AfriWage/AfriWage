'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  Loader2,
  Send,
  Users,
  Wallet2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import type { Balance, TransactionRecord } from '@/lib/stellar';
  formatAmount,
  fundTestnetAccount,
  getBalance,
  getTransactionHistory,
  truncatePublicKey,
} from '@/lib/stellar';
import { cn, copyToClipboard } from '@/lib/utils';

/* ─── SKELETON ─────────────────────────────────────────── */

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/10',
        className
      )}
    />
  );
}

/* ─── PAGE ─────────────────────────────────────────────── */

export default function DashboardPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleConnect = useCallback((pk: string) => {
    setPublicKey(pk);
  }, []);

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── TOP NAVBAR ────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#0A0A0A]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#14A800]" />
              <span className="font-semibold text-white">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/worker"
              className="hidden items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white sm:flex"
            >
              <Users className="h-4 w-4" />
              Worker Portal
            </Link>
            <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!publicKey ? (
          <DisconnectedState
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <ConnectedDashboard
            publicKey={publicKey}
            queryClient={queryClient}
          />
        )}
      </main>
    </div>
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Wallet2 className="mx-auto h-16 w-16 text-[#E5E7EB]" />

      <h2 className="mt-6 text-2xl font-bold text-white">
        Connect your wallet to get started
      </h2>

      <p className="mx-auto mt-3 max-w-sm text-[#6B7280]">
        AfriWage uses Freighter, the official Stellar browser wallet. Connect to
        view your real balances and send payments.
      </p>

      <div className="mt-8">
        <WalletConnect onConnect={onConnect} onDisconnect={onDisconnect} />
      </div>

      <a
        href="https://www.freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-sm text-[#6B7280] underline transition-colors hover:text-white"
      >
        Don&apos;t have Freighter? Download it free →
      </a>
    </div>
  );
}

/* ─── CONNECTED DASHBOARD ──────────────────────────────── */

function ConnectedDashboard({
  publicKey,
  queryClient,
}: {
  publicKey: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  /* ── Data fetching ── */
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useQuery<Balance>({
    queryKey: ['account', publicKey],
    queryFn: () => getBalance(publicKey),
    enabled: !!publicKey,
    refetchInterval: 30000,
  });

  const {
    data: transactions,
    isLoading: txLoading,
  } = useQuery<TransactionRecord[]>({
    queryKey: ['transactions', publicKey],
    queryFn: () => getTransactionHistory(publicKey),
    enabled: !!publicKey,
  });

  /* ── Fund testnet account ── */
  const fundMutation = useMutation({
    mutationFn: () => fundTestnetAccount(publicKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', publicKey] });
    },
  });

  const accountActive = balance && balance.xlm !== '0' && balance.xlm !== '0.0000000';

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Your Stellar wallet overview
        </p>
      </div>

      {/* ── STAT CARDS ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balanceLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : balanceError ? (
          <div className="col-span-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load account data. The account may not exist on testnet.
            </div>
          </div>
        ) : balance ? (
          <>
            {/* XLM Balance */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                XLM Balance
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {formatAmount(balance.xlm, '')}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">Stellar Lumens</p>
            </div>

            {/* USDC Balance */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                USDC Balance
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {formatAmount(balance.usdc, '')}
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14A800]/10 px-3 py-1 text-xs text-[#14A800]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14A800]" />
                  Live on testnet
                </span>
              </div>
            </div>

            {/* Account Status */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Account
              </p>
              <p
                className={cn(
                  'mt-2 text-3xl font-bold',
                  accountActive ? 'text-[#14A800]' : 'text-[#E24B4A]'
                )}
              >
                {accountActive ? 'Active' : 'Not funded'}
              </p>
              <p className="mt-1 font-mono text-sm text-[#6B7280]">
                {truncatePublicKey(publicKey, 6)}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* ── UNFUNDED WARNING ──────────────────────── */}
      {balance && !accountActive && (
        <div className="flex items-center justify-between rounded-xl border border-[#FED7AA] bg-[#FFF7ED]/10 p-4">
          <p className="text-sm text-[#FED7AA]">
            ⚠️ Account not funded on testnet
          </p>
          <button
            type="button"
            onClick={() => fundMutation.mutate()}
            disabled={fundMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-[#14A800] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#108A00] disabled:opacity-50"
          >
            {fundMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Fund with Friendbot
          </button>
        </div>
      )}

      {fundMutation.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          Funding failed: {fundMutation.error instanceof Error ? fundMutation.error.message : 'Unknown error'}
        </div>
      )}

      {fundMutation.isSuccess && (
        <div className="rounded-xl border border-[#BBF7D0]/30 bg-[#14A800]/10 p-4 text-sm text-[#14A800]">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Account funded successfully! Balances will refresh shortly.
        </div>
      )}

      {/* ── SEND PAYMENT ──────────────────────────── */}
      <SendPaymentCard publicKey={publicKey} />

      {/* ── RECENT TRANSACTIONS ───────────────────── */}
      <RecentTransactions
        publicKey={publicKey}
        transactions={transactions ?? []}
        isLoading={txLoading}
      />
    </div>
  );
}

/* ─── SEND PAYMENT CARD ────────────────────────────────── */

function SendPaymentCard({ publicKey: _publicKey }: { publicKey: string }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isValidAddress = recipient.startsWith('G') && recipient.length === 56;

  const handleReset = () => {
    setRecipient('');
    setAmount('');
    setMemo('');
    setTxHash(null);
    setSendError(null);
  };

  if (txHash) {
    return (
      <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4]/5 p-6">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#14A800]" />
        <p className="mt-4 text-center text-lg font-semibold text-white">
          Payment sent successfully!
        </p>
        <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-lg bg-white/5 p-3">
          <p className="flex-1 truncate font-mono text-xs text-[#6B7280]">
            {txHash}
          </p>
          <button
            type="button"
            onClick={async () => {
              await copyToClipboard(txHash);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="shrink-0 text-[#6B7280] hover:text-white"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-[#14A800]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#14A800] hover:underline"
          >
            View on Stellar Explorer →
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mx-auto mt-4 block rounded-lg border border-white/10 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-6 text-lg font-semibold text-white">Send Payment</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Recipient */}
        <div>
          <label
            htmlFor="dash-recipient"
            className="mb-1.5 block text-sm font-medium text-[#6B7280]"
          >
            Recipient Stellar Address
          </label>
          <div className="relative">
            <input
              id="dash-recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="G... Stellar address"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 pr-10 font-mono text-sm text-white placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50"
            />
            {isValidAddress && (
              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14A800]" />
            )}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="dash-amount"
            className="mb-1.5 block text-sm font-medium text-[#6B7280]"
          >
            Amount (USDC)
          </label>
          <div className="relative">
            <input
              id="dash-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 pr-16 text-sm text-white placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
              USDC
            </span>
          </div>
        </div>
      </div>

      {/* Memo */}
      <div className="mt-4">
        <label
          htmlFor="dash-memo"
          className="mb-1.5 block text-sm font-medium text-[#6B7280]"
        >
          Memo (optional)
        </label>
        <input
          id="dash-memo"
          type="text"
          maxLength={28}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Payment for design work"
          className="h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50"
        />
      </div>

      {/* Fee row */}
      <p className="mt-3 text-xs text-[#6B7280]">
        Network fee: ~0.00001 XLM · Settlement: &lt; 5s
      </p>

      {/* Error */}
      {sendError && (
        <div className="mt-4 rounded-xl border border-[#FECDD3]/30 bg-[#FFF1F2]/10 p-4 text-sm text-[#E24B4A]">
          Payment failed: {sendError}
        </div>
      )}

      {/* Submit */}
      <Link
        href="/send"
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#14A800] font-semibold text-white transition-colors hover:bg-[#108A00]"
      >
        <Send className="h-4 w-4" />
        Send Payment →
      </Link>
    </div>
  );
}

/* ─── RECENT TRANSACTIONS ──────────────────────────────── */

function RecentTransactions({
  publicKey,
  transactions,
  isLoading,
}: {
  publicKey: string;
  transactions: TransactionRecord[];
  isLoading: boolean;
}) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Recent Transactions
        </h3>
        <Link
          href="/transactions"
          className="text-sm text-[#14A800] transition-colors hover:underline"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-3 w-20" />
                <Skeleton className="ml-auto h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl bg-white/5">
          <p className="text-center text-sm text-[#6B7280]">
            No transactions yet. Send your first payment above.
          </p>
        </div>
      ) : (
        <div>
          {recent.map((tx, idx) => {
            const incoming = tx.to === publicKey;
            return (
              <div
                key={tx.id}
                className={cn(
                  'flex items-center justify-between py-4',
                  idx < recent.length - 1 && 'border-b border-white/10'
                )}
              >
                {/* Left */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full bg-white/5',
                    )}
                  >
                    {incoming ? (
                      <ArrowDownLeft className="h-4 w-4 text-[#14A800]" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-[#E24B4A]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {tx.memo || 'Payment'}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
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
                  <p className="font-mono text-xs text-[#6B7280]">
                    {truncatePublicKey(incoming ? tx.from : tx.to, 6)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── STAT CARD SKELETON ───────────────────────────────── */

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}
