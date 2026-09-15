'use client';

import { ArrowLeft, CheckCircle2, Clock, Loader2, RefreshCw, Send, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PayrollStatusBadge } from '@/components/PayrollStatusBadge';
import { SessionBadge, WalletAuthGate } from '@/components/WalletAuthGate';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { ErrorNote } from '@/components/org-ui';
import { useSession } from '@/hooks/use-session';
import {
  useApprovePayrollRun,
  useExecutePayrollRun,
  usePayrollRun,
  useRefreshOfframpStatus,
  useSubmitPayrollRun,
} from '@/hooks/use-payroll';
import { useOrganization } from '@/hooks/use-orgs';
import { useTreasury } from '@/hooks/use-treasury';
import { Link } from '@/i18n/navigation';
import type { PayrollRunItem } from '@/lib/payroll-client';
import { truncatePublicKey } from '@/lib/stellar-format';

export default function PayrollRunPage({ params }: { params: { runId: string } }) {
  const t = useTranslations('payroll');

  return (
    <DashboardShell title={t('title')} description={t('description')} actions={<SessionBadge />}>
      <WalletAuthGate>
        <PayrollRunDetail runId={params.runId} />
      </WalletAuthGate>
    </DashboardShell>
  );
}

function PayrollRunDetail({ runId }: { runId: string }) {
  const t = useTranslations('payroll');
  const run = usePayrollRun(runId);

  if (run.isLoading) {
    return (
      <SurfaceCard>
        <Loader2 className="h-5 w-5 animate-spin text-[#637085]" />
      </SurfaceCard>
    );
  }

  if (run.isError || !run.data) {
    return (
      <SurfaceCard>
        <ErrorNote error={run.error} />
      </SurfaceCard>
    );
  }

  const { payrollRun, items } = run.data;

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <Link
          href="/payroll"
          className="inline-flex items-center gap-1.5 text-sm text-[#637085] transition-colors hover:text-[#1f8f55] dark:text-[#8888aa]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToRuns')}
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
              {payrollRun.totalAmount} USDC
            </h2>
            <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
              {t('runCreated')}:{' '}
              {payrollRun.createdAt ? new Date(payrollRun.createdAt).toLocaleString() : '—'}
            </p>
          </div>
          <PayrollStatusBadge status={payrollRun.status} />
        </div>
      </SurfaceCard>

      <RunActions runId={runId} orgId={payrollRun.orgId} status={payrollRun.status} items={items} />
      <ItemsTable runId={runId} orgId={payrollRun.orgId} items={items} status={payrollRun.status} />
    </div>
  );
}

function RunActions({
  runId,
  orgId,
  status,
  items,
}: {
  runId: string;
  orgId: string;
  status: string;
  items: PayrollRunItem[];
}) {
  const t = useTranslations('payroll');
  const session = useSession();
  const organization = useOrganization(orgId);
  const treasury = useTreasury(orgId, status !== 'settled');
  const submit = useSubmitPayrollRun(runId, orgId);
  const approve = useApprovePayrollRun(runId, orgId);
  const execute = useExecutePayrollRun(runId, orgId);
  const [categoryId, setCategoryId] = useState('');

  const role = organization.data?.role;
  const categories = treasury.data?.treasury?.categories ?? [];

  if (status === 'settled' || status === 'failed') {
    return null;
  }

  return (
    <SurfaceCard>
      {status === 'draft' && (role === 'owner' || role === 'admin') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex min-w-[220px] flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
                {t('categoryLabel')}
              </span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
              >
                <option value="">—</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => submit.mutate(Number(categoryId))}
              disabled={submit.isPending || categoryId === ''}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submit.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submit.isPending ? t('submitting') : t('submit')}
            </button>
          </div>

          <p className="text-xs text-[#637085] dark:text-[#8888aa]">{t('signExplainer')}</p>
          {submit.isError && <ErrorNote error={submit.error} />}
        </div>
      )}

      {status === 'pending_approval' && role === 'payer' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => approve.mutate()}
            disabled={approve.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {approve.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {approve.isPending ? t('approving') : t('approve')}
          </button>

          <p className="text-xs text-[#637085] dark:text-[#8888aa]">{t('signExplainer')}</p>

          {approve.data?.approvalsRemaining && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t('approvalsRemaining')}
            </p>
          )}
          {approve.isError && <ErrorNote error={approve.error} />}
        </div>
      )}

      {status === 'approved' && role === 'payer' && (
        <div className="space-y-4">
          <p className="text-sm text-[#637085] dark:text-[#8888aa]">{t('executeExplainer')}</p>

          <button
            type="button"
            onClick={() => {
              const senderPublicKey = session.data?.walletPublicKey;
              if (!senderPublicKey) return;
              execute.mutate({ senderPublicKey, items });
            }}
            disabled={execute.isPending || !session.data?.walletPublicKey}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {execute.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {execute.isPending ? t('executing') : t('execute')}
          </button>

          {execute.isError && <ErrorNote error={execute.error} />}
        </div>
      )}

      {status === 'executing' && <OfframpRefresh runId={runId} orgId={orgId} />}
    </SurfaceCard>
  );
}

function OfframpRefresh({ runId, orgId }: { runId: string; orgId: string }) {
  const t = useTranslations('payroll');
  const refresh = useRefreshOfframpStatus(runId, orgId);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => refresh.mutate()}
        disabled={refresh.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-[#d8cebe] bg-transparent px-6 py-2.5 text-sm font-semibold text-[#415065] transition-colors hover:bg-[#f3ecdf] disabled:opacity-50 dark:border-[#1e1e3a] dark:text-[#8888aa]"
      >
        <RefreshCw className={refresh.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        {refresh.isPending ? t('refreshing') : t('refreshOfframp')}
      </button>

      {refresh.isError && <ErrorNote error={refresh.error} />}
    </div>
  );
}

function ItemsTable({
  items,
}: {
  runId: string;
  orgId: string;
  items: PayrollRunItem[];
  status: string;
}) {
  const t = useTranslations('payroll');

  return (
    <SurfaceCard>
      <h3 className="font-display text-lg font-semibold text-[#102033] dark:text-white">
        {t('workers')}
      </h3>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#efe3d0] text-xs uppercase tracking-wider text-[#8c7760] dark:border-[#1e1e3a] dark:text-[#7777aa]">
              <th className="px-3 py-3">{t('worker')}</th>
              <th className="px-3 py-3">{t('amount')}</th>
              <th className="px-3 py-3">{t('onchain')}</th>
              <th className="px-3 py-3">{t('offramp')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#efe3d0] dark:border-[#1e1e3a]">
                <td className="px-3 py-3">
                  <p className="text-[#102033] dark:text-white">{item.employeeName}</p>
                  <p
                    className="font-mono text-xs text-[#637085] dark:text-[#8888aa]"
                    title={item.stellarPublicKey}
                  >
                    {truncatePublicKey(item.stellarPublicKey, 6)}
                  </p>
                </td>
                <td className="px-3 py-3 text-[#102033] dark:text-white">{item.amount}</td>
                <td className="px-3 py-3">
                  {item.onchainTxHash ? (
                    <span className="inline-flex items-center gap-1.5 text-[#1f8f55]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('paid')}
                    </span>
                  ) : (
                    <span className="text-[#637085] dark:text-[#8888aa]">{t('notPaidYet')}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <OfframpCell item={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}

function OfframpCell({ item }: { item: PayrollRunItem }) {
  const t = useTranslations('payroll');

  if (!item.payoutOfframpCurrency) {
    return <span className="text-[#637085] dark:text-[#8888aa]">{t('staysOnchain')}</span>;
  }

  if (item.offrampStatus === 'complete') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#1f8f55]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t('offrampComplete')} ({item.payoutOfframpCurrency})
      </span>
    );
  }

  if (item.offrampStatus === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-600">
        <XCircle className="h-3.5 w-3.5" />
        {t('offrampFailed')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[#637085] dark:text-[#8888aa]">
      <Clock className="h-3.5 w-3.5" />
      {t('offrampPending')} ({item.payoutOfframpCurrency})
    </span>
  );
}
