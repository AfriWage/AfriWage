'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Clock3, Trash2, ArrowRight } from 'lucide-react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { Link } from '@/i18n/navigation';
import {
  deleteSchedule,
  getDueSchedules,
  getSchedules,
  type Schedule,
} from '@/lib/schedule';
import { cn, formatDate, truncate } from '@/lib/utils';

function useScheduleList() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const refresh = useCallback(() => {
    setSchedules(getSchedules());
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('afriwage:schedules-updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('afriwage:schedules-updated', handleUpdate);
    };
  }, [refresh]);

  return { schedules, refresh };
}

export default function ScheduledPaymentsPage() {
  const { schedules, refresh } = useScheduleList();
  const dueSchedules = useMemo(() => getDueSchedules(), [schedules]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteSchedule(id);
      refresh();
    },
    [refresh]
  );

  return (
    <DashboardShell
      title="Scheduled Payments"
      description="Review active recurring payroll schedules, launch a payment now, or remove a schedule when the work is done."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <SurfaceCard className="bg-white/95">
            <p className="text-sm text-[#637085]">Active schedules</p>
            <p className="mt-3 font-display text-4xl font-semibold text-[#102033] dark:text-white">
              {schedules.length}
            </p>
          </SurfaceCard>
          <SurfaceCard className="bg-white/95">
            <p className="text-sm text-[#637085]">Due today or overdue</p>
            <p className="mt-3 font-display text-4xl font-semibold text-[#102033] dark:text-white">
              {dueSchedules.length}
            </p>
          </SurfaceCard>
          <SurfaceCard className="bg-white/95">
            <p className="text-sm text-[#637085]">Reminder cadence</p>
            <p className="mt-3 font-display text-4xl font-semibold text-[#102033] dark:text-white">
              Weekly / Monthly
            </p>
          </SurfaceCard>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#1f8f55]" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
                Active payment schedules
              </h2>
              <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
                Each schedule persists in localStorage and survives browser refreshes.
              </p>
            </div>
          </div>

          {schedules.length === 0 ? (
            <SurfaceCard className="border-dashed border-[#d8cebe] bg-[#fffaf2] dark:border-[#1e1e3a] dark:bg-[#16163a]">
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="rounded-full bg-[#dff3e8] p-4 text-[#1f8f55] dark:bg-[#12311f] dark:text-[#8fd4ab]">
                  <Clock3 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
                    No scheduled payments yet
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-[#637085] dark:text-[#8888aa]">
                    Create a recurring payout from the send page and it will appear here automatically.
                  </p>
                </div>
                <Link
                  href="/send"
                  className="inline-flex items-center gap-2 rounded-[18px] bg-[#102033] px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[0.99] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf2] dark:bg-[#2a2a5a] dark:focus-visible:ring-offset-[#16163a]"
                >
                  Create a recurring payment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </SurfaceCard>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => {
                const due = new Date(schedule.nextPaymentDate).getTime() <= Date.now();
                return (
                  <SurfaceCard key={schedule.id} className="bg-white/95">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm text-[#102033] dark:text-white">
                            {truncate(schedule.recipientAddress, 12)}
                          </p>
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-semibold',
                              due
                                ? 'bg-[#fff1e6] text-[#c45a43]'
                                : 'bg-[#eaf8f0] text-[#1f8f55]'
                            )}
                          >
                            {due ? 'Due now' : 'On track'}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <Detail label="Amount" value={`${schedule.amount} USDC`} />
                          <Detail label="Frequency" value={schedule.frequency} />
                          <Detail label="Next payment" value={formatDate(schedule.nextPaymentDate)} />
                          <Detail label="Memo" value={schedule.memo || '—'} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                        <Link
                          href={{
                            pathname: '/send',
                            query: {
                              recipient: schedule.recipientAddress,
                              amount: schedule.amount,
                              memo: schedule.memo,
                              recurring: '1',
                              frequency: schedule.frequency,
                              scheduleId: schedule.id,
                            },
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#1f8f55] px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[0.99] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#16163a]"
                        >
                          Pay now
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(schedule.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#e9dfcf] bg-white px-4 py-3 text-sm font-semibold text-[#c45a43] transition-colors hover:bg-[#fff7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c45a43]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[#1e1e3a] dark:bg-[#16163a] dark:focus-visible:ring-offset-[#16163a]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f6efe6] p-4 dark:bg-[#1a1a3a]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#102033] dark:text-white">{value}</p>
    </div>
  );
}
