'use client';

import { useTranslations } from 'next-intl';
import type { PayrollStatus } from '@/lib/payroll-state';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<PayrollStatus, string> = {
  draft: 'bg-[#f3ecdf] text-[#8c7760] dark:bg-[#1a1a3a] dark:text-[#8888aa]',
  pending_approval: 'bg-[#fef3c7] text-[#92400e] dark:bg-[#3a2a0a] dark:text-[#fbbf24]',
  approved: 'bg-[#dbeafe] text-[#1e40af] dark:bg-[#0a1a3a] dark:text-[#60a5fa]',
  executing: 'bg-[#dbeafe] text-[#1e40af] dark:bg-[#0a1a3a] dark:text-[#60a5fa]',
  settled: 'bg-[#dff3e8] text-[#1f8f55] dark:bg-[#1a3a2a] dark:text-[#4ade80]',
  failed: 'bg-red-50 text-red-700 dark:bg-[#3a0a0a] dark:text-[#f87171]',
};

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const t = useTranslations('payroll');

  const labels: Record<PayrollStatus, string> = {
    draft: t('statusDraft'),
    pending_approval: t('statusPendingApproval'),
    approved: t('statusApproved'),
    executing: t('statusExecuting'),
    settled: t('statusSettled'),
    failed: t('statusFailed'),
  };

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
        STATUS_CLASSES[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
