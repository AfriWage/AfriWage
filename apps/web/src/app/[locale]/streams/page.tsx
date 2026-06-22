'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Ban, Clock3, Coins, RefreshCcw, TimerReset } from 'lucide-react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { Link } from '@/i18n/navigation';
import { claimableAmount, fromAtomicAmount, toAtomicAmount, type StreamSnapshot } from '@AfriWage/sdk';
import { cn } from '@/lib/utils';

type StatusFilter = 'active' | 'completed' | 'cancelled';

const demoStreams: StreamSnapshot[] = [
  {
    id: 'stream-amber-moon',
    employer: 'AfriWage Payroll Desk',
    recipient: 'Amina Yusuf',
    totalAmount: '1200',
    withdrawnAmount: '360',
    startTime: '2026-06-20T09:00:00Z',
    endTime: '2026-07-04T09:00:00Z',
    status: 'active',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
  {
    id: 'stream-cliff-rose',
    employer: 'Creative Ops Guild',
    recipient: 'Tunde Bello',
    totalAmount: '800',
    withdrawnAmount: '800',
    startTime: '2026-06-12T09:00:00Z',
    endTime: '2026-06-22T09:00:00Z',
    status: 'completed',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
  {
    id: 'stream-saffron-river',
    employer: 'Product Studio One',
    recipient: 'Lerato Mbeki',
    totalAmount: '950',
    withdrawnAmount: '270',
    startTime: '2026-06-18T09:00:00Z',
    endTime: '2026-07-02T09:00:00Z',
    status: 'cancelled',
    cancelledAt: '2026-06-24T12:00:00Z',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
  {
    id: 'stream-emerald-dawn',
    employer: 'AfriWage Labs',
    recipient: 'Chinwe Okafor',
    totalAmount: '560',
    withdrawnAmount: '140',
    startTime: '2026-06-21T09:00:00Z',
    endTime: '2026-07-11T09:00:00Z',
    status: 'active',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
];

function statusConfig(status: StatusFilter) {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        icon: Clock3,
        className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
      };
    case 'completed':
      return {
        label: 'Completed',
        icon: Coins,
        className: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        icon: Ban,
        className: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
      };
  }
}

function getEffectiveEnd(stream: StreamSnapshot) {
  const endTime = new Date(stream.endTime).getTime();
  if (stream.status !== 'cancelled' || !stream.cancelledAt) {
    return endTime;
  }
  return Math.min(endTime, new Date(stream.cancelledAt).getTime());
}

function getProgress(stream: StreamSnapshot, now: Date) {
  const start = new Date(stream.startTime).getTime();
  const effectiveEnd = getEffectiveEnd(stream);
  const current = Math.max(start, Math.min(now.getTime(), effectiveEnd));
  const span = Math.max(1, effectiveEnd - start);
  return Math.min(100, Math.max(0, ((current - start) / span) * 100));
}

function StreamCard({
  stream,
  now,
}: {
  stream: StreamSnapshot;
  now: Date;
}) {
  const claimable = claimableAmount(stream, now);
  const withdrawn = toAtomicAmount(stream.withdrawnAmount);
  const totalAtoms = toAtomicAmount(stream.totalAmount);
  const progress = getProgress(stream, now);
  const config = statusConfig(stream.status);
  const StatusIcon = config.icon;

  return (
    <SurfaceCard className="h-full border-[#e7dccb] bg-white/95 shadow-[0_20px_50px_rgba(16,32,51,0.06)] dark:border-[#1e1e3a] dark:bg-[#16163a]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8c7760] dark:text-[#7777aa]">
              {stream.assetCode ?? 'USDC'} stream
            </p>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', config.className)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </span>
          </div>
          <h3 className="mt-3 font-display text-2xl font-semibold text-[#102033] dark:text-white">
            {stream.recipient}
          </h3>
          <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
            Funded by {stream.employer}
          </p>
        </div>

        <div className="rounded-2xl bg-[#f6efe6] p-3 text-[#1f8f55] dark:bg-[#1a1a3a] dark:text-[#8fd4ab]">
          <RefreshCcw className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Total" value={`${fromAtomicAmount(totalAtoms)} USDC`} />
          <Metric label="Withdrawn" value={`${fromAtomicAmount(withdrawn)} USDC`} />
          <Metric label="Claimable now" value={`${claimable} USDC`} emphasis />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]">
            <span>Live vesting</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#efe3d0] dark:bg-[#1a1a3a]">
            <div
              className="h-3 rounded-full bg-[linear-gradient(90deg,#1f8f55_0%,#8dca62_100%)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#637085] dark:text-[#8888aa]">
            {stream.status === 'active'
              ? 'Accrual updates every second from the stream schedule.'
              : stream.status === 'completed'
                ? 'Stream fully vested and ready for reconciliation.'
                : 'Cancelled streams freeze at the cancellation timestamp.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Window" value={`${new Date(stream.startTime).toLocaleDateString()} → ${new Date(stream.endTime).toLocaleDateString()}`} />
          <Detail label="Stream ID" value={stream.id} mono />
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] bg-[#f6efe6] p-4 dark:bg-[#1a1a3a] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#102033] dark:text-white">
              Claimable amount is computed live from elapsed time.
            </p>
            <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
              This page uses the SDK helper directly so the displayed amount stays deterministic.
            </p>
          </div>

          <Link
            href="/send"
            className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#102033] px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[0.99] active:scale-[0.97] dark:bg-[#2a2a5a]"
          >
            Open payout creator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

function Metric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn('rounded-2xl border border-[#eadfce] p-4 dark:border-[#1e1e3a]', emphasis && 'bg-[#102033] text-white dark:bg-[#2a2a5a]')}>
      <p className={cn('text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]', emphasis && 'text-white/65 dark:text-white/65')}>
        {label}
      </p>
      <p className={cn('mt-2 font-display text-xl font-semibold text-[#102033] dark:text-white', emphasis && 'text-white')}>
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#f6efe6] p-4 dark:bg-[#1a1a3a]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]">{label}</p>
      <p className={cn('mt-2 text-sm font-medium text-[#102033] dark:text-white', mono && 'font-mono text-xs break-all')}>
        {value}
      </p>
    </div>
  );
}

export default function StreamsPage() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStreams = useMemo(
    () => demoStreams.filter((stream) => stream.status === 'active'),
    []
  );
  const completedStreams = useMemo(
    () => demoStreams.filter((stream) => stream.status === 'completed'),
    []
  );
  const cancelledStreams = useMemo(
    () => demoStreams.filter((stream) => stream.status === 'cancelled'),
    []
  );

  const activeClaimable = useMemo(() => {
    const totalAtoms = activeStreams.reduce(
      (sum, stream) => sum + toAtomicAmount(claimableAmount(stream, now)),
      0n
    );
    return fromAtomicAmount(totalAtoms);
  }, [activeStreams, now]);

  const nextRelease = useMemo(() => {
    const upcoming = activeStreams
      .map((stream) => ({
        stream,
        remaining: new Date(stream.endTime).getTime() - now.getTime(),
      }))
      .sort((a, b) => a.remaining - b.remaining)[0];

    return upcoming ? upcoming.stream.endTime : null;
  }, [activeStreams, now]);

  return (
    <DashboardShell
      title="Streamed payroll"
      description="Track live USDC streams, monitor claimable balances in real time, and review active, completed, and cancelled payroll schedules."
    >
      <div className="space-y-6">
        <SurfaceCard className="overflow-hidden border-[#dfe8e3] bg-[linear-gradient(135deg,#102033_0%,#18324c_54%,#1f8f55_150%)] text-white shadow-[0_22px_50px_rgba(16,32,51,0.12)]">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/65">Streaming payroll cockpit</p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Trustless payroll streams, visible to workers and operators.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/76">
                This view mirrors the contract state you would wire into Soroban: create a stream,
                watch claimable value accumulate second by second, then withdraw or cancel without
                relying on manual reconciliation.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Active" value={String(activeStreams.length)} />
              <MiniStat label="Completed" value={String(completedStreams.length)} />
              <MiniStat label="Cancelled" value={String(cancelledStreams.length)} />
            </div>
          </div>
        </SurfaceCard>

        <section className="grid gap-4 md:grid-cols-3">
          <SurfaceCard className="bg-white/95">
            <p className="text-sm text-[#637085]">Claimable across active streams</p>
            <p className="mt-3 font-display text-4xl font-semibold text-[#102033] dark:text-white">
              {activeClaimable} USDC
            </p>
            <p className="mt-2 text-sm text-[#637085]">
              Updated live using the SDK&apos;s linear vesting helper.
            </p>
          </SurfaceCard>
          <SurfaceCard className="bg-white/95">
            <p className="text-sm text-[#637085]">Next release</p>
            <p className="mt-3 font-display text-4xl font-semibold text-[#102033] dark:text-white">
              {nextRelease ? new Date(nextRelease).toLocaleDateString() : '--'}
            </p>
            <p className="mt-2 text-sm text-[#637085]">Earliest active stream end timestamp.</p>
          </SurfaceCard>
          <SurfaceCard className="bg-white/95">
            <p className="text-sm text-[#637085]">Current clock</p>
            <p className="mt-3 font-display text-4xl font-semibold text-[#102033] dark:text-white">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="mt-2 text-sm text-[#637085]">Refreshes every second.</p>
          </SurfaceCard>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
                Active streams
              </h3>
              <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
                Each card shows vesting progress and the current claimable amount.
              </p>
            </div>
            <Link
              href="/send"
              className="hidden items-center gap-2 rounded-full bg-[#102033] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[0.99] active:scale-[0.97] md:inline-flex dark:bg-[#2a2a5a]"
            >
              Create stream-ready payout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {activeStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} now={now} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TimerReset className="h-5 w-5 text-[#1f8f55]" />
              <h3 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
                Completed streams
              </h3>
            </div>
            <div className="space-y-4">
              {completedStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} now={now} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-600" />
              <h3 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
                Cancelled streams
              </h3>
            </div>
            <div className="space-y-4">
              {cancelledStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} now={now} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
