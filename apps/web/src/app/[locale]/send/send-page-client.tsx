'use client';

import { useCallback, useMemo, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { SendPaymentForm } from '@/components/SendPaymentForm';
import { WalletConnect } from '@/components/WalletConnect';
import {
  calculateNextPaymentDate,
  createSchedule,
  getScheduleById,
  updateNextPaymentDate,
  type ScheduleFrequency,
} from '@/lib/schedule';
import { cn } from '@/lib/utils';

type SearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

export default function SendPageClient({ searchParams }: { searchParams: SearchParams }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [recurringEnabled, setRecurringEnabled] = useState(firstValue(searchParams.recurring) === '1');
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    firstValue(searchParams.frequency) === 'monthly' ? 'monthly' : 'weekly'
  );
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

  const prefill = useMemo(
    () => ({
      recipient: firstValue(searchParams.recipient),
      amount: firstValue(searchParams.amount),
      memo: firstValue(searchParams.memo),
      scheduleId: firstValue(searchParams.scheduleId),
    }),
    [searchParams]
  );

  const prefillHint = prefill.scheduleId ? 'Recurring schedule loaded from the scheduled list.' : null;

  const handleConnect = useCallback((pk: string) => setPublicKey(pk), []);
  const handleDisconnect = useCallback(() => setPublicKey(null), []);
  const handlePaymentSuccess = useCallback(
    ({
      recipientPublicKey,
      amount,
      memo,
    }: {
      recipientPublicKey: string;
      amount: string;
      memo: string;
    }) => {
      const nextPaymentDate = calculateNextPaymentDate(frequency);
      const existingSchedule = prefill.scheduleId ? getScheduleById(prefill.scheduleId) : null;

      if (recurringEnabled) {
        if (existingSchedule) {
          updateNextPaymentDate(existingSchedule.id, nextPaymentDate);
        } else {
          createSchedule({
            recipientAddress: recipientPublicKey,
            amount,
            memo,
            frequency,
            nextPaymentDate,
          });
        }
        setScheduleMessage(`Recurring schedule saved for the next ${frequency} cycle.`);
      } else if (existingSchedule) {
        setScheduleMessage('Payment sent. Open the scheduled list to review the existing schedule.');
      } else {
        setScheduleMessage(null);
      }
    },
    [frequency, prefill.scheduleId, recurringEnabled]
  );

  return (
    <DashboardShell
      title="Send Payment"
      description="Send USDC instantly to any Stellar address on testnet."
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      <div className="space-y-6">
        <SurfaceCard>
          <SendPaymentForm
            senderPublicKey={publicKey ?? undefined}
            initialRecipientPublicKey={prefill.recipient}
            initialAmount={prefill.amount}
            initialMemo={prefill.memo}
            onSuccess={handlePaymentSuccess}
          />
        </SurfaceCard>

        <SurfaceCard className="border-[#d8cebe] bg-[#fffaf2] dark:border-[#1e1e3a] dark:bg-[#16163a]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]">
                Recurring payments
              </p>
              <h2 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
                Make this recurring
              </h2>
              <p className="text-sm text-[#637085] dark:text-[#8888aa]">
                Turn the current payout into a reusable schedule after a successful payment.
              </p>
              {prefillHint ? (
                <p className="text-sm font-medium text-[#1f8f55] dark:text-[#8fd4ab]">{prefillHint}</p>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.55fr_0.45fr]">
              <label className="flex items-start gap-3 rounded-[22px] border border-[#eadfce] bg-white p-4 text-left shadow-[0_12px_32px_rgba(16,32,51,0.05)] dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
                <input
                  type="checkbox"
                  checked={recurringEnabled}
                  onChange={(event) => setRecurringEnabled(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#d8cebe] text-[#1f8f55] focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f0f24]"
                />
                <span className="space-y-1">
                  <span className="block font-semibold text-[#102033] dark:text-white">
                    Enable recurring schedule
                  </span>
                  <span className="block text-sm text-[#637085] dark:text-[#8888aa]">
                    Save the payout as a reusable weekly or monthly reminder.
                  </span>
                </span>
              </label>

              <fieldset
                className={cn(
                  'rounded-[22px] border border-[#eadfce] bg-white p-4 shadow-[0_12px_32px_rgba(16,32,51,0.05)] dark:border-[#1e1e3a] dark:bg-[#0f0f24]',
                  !recurringEnabled && 'opacity-60'
                )}
                disabled={!recurringEnabled}
              >
                <legend className="px-1 text-xs uppercase tracking-[0.18em] text-[#8c7760] dark:text-[#7777aa]">
                  Frequency
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(['weekly', 'monthly'] as const).map((option) => (
                    <label
                      key={option}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition-colors',
                        frequency === option
                          ? 'border-[#1f8f55] bg-[#eaf8f0] dark:border-[#8fd4ab] dark:bg-[#153624]'
                          : 'border-[#e9dfcf] bg-white dark:border-[#1e1e3a] dark:bg-[#16163a]'
                      )}
                    >
                      <span className="font-medium text-[#102033] dark:text-white">
                        {option === 'weekly' ? 'Weekly' : 'Monthly'}
                      </span>
                      <input
                        type="radio"
                        name="recurring-frequency"
                        value={option}
                        checked={frequency === option}
                        disabled={!recurringEnabled}
                        onChange={() => setFrequency(option)}
                        className="h-4 w-4 text-[#1f8f55] focus-visible:ring-2 focus-visible:ring-[#1f8f55]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f0f24]"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[#637085] dark:text-[#8888aa]">
                  The next payment date is calculated as today + 7 days for weekly or today + 30 days for monthly.
                </p>
              </fieldset>
            </div>

            {scheduleMessage ? (
              <div className="rounded-[20px] border border-[#dbeadf] bg-[#eef8f1] px-4 py-3 text-sm text-[#1f8f55] dark:border-[#234132] dark:bg-[#13261b] dark:text-[#8fd4ab]">
                {scheduleMessage}
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </DashboardShell>
  );
}
