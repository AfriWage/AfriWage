'use client';

import { Loader2, Plus, Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PayrollStatusBadge } from '@/components/PayrollStatusBadge';
import { SessionBadge, WalletAuthGate } from '@/components/WalletAuthGate';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { ErrorNote } from '@/components/org-ui';
import { useOrganizations } from '@/hooks/use-orgs';
import { useCreatePayrollRun, usePayrollRuns } from '@/hooks/use-payroll';
import { Link } from '@/i18n/navigation';

export default function PayrollPage() {
  const t = useTranslations('payroll');

  return (
    <DashboardShell title={t('title')} description={t('description')} actions={<SessionBadge />}>
      <WalletAuthGate>
        <PayrollRuns />
      </WalletAuthGate>
    </DashboardShell>
  );
}

function PayrollRuns() {
  const t = useTranslations('payroll');
  const tOrgs = useTranslations('organizations');
  const organizations = useOrganizations();
  const [orgId, setOrgId] = useState('');

  // Default to the first organization once the list arrives, without clobbering
  // a choice the operator has already made.
  useEffect(() => {
    if (orgId === '' && organizations.data && organizations.data.length > 0) {
      setOrgId(organizations.data[0].id);
    }
  }, [orgId, organizations.data]);

  const runs = usePayrollRuns(orgId);
  const createRun = useCreatePayrollRun(orgId);
  const selected = organizations.data?.find((organization) => organization.id === orgId);
  const canCreate = selected?.role === 'owner' || selected?.role === 'admin';

  if (organizations.isLoading) {
    return (
      <SurfaceCard>
        <Loader2 className="h-5 w-5 animate-spin text-[#637085]" />
      </SurfaceCard>
    );
  }

  if (organizations.data?.length === 0) {
    return (
      <SurfaceCard>
        <p className="font-medium text-[#102033] dark:text-white">{tOrgs('noOrganizations')}</p>
        <Link
          href="/organizations"
          className="mt-4 inline-flex rounded-lg bg-[#1f8f55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14A800]"
        >
          {tOrgs('createTitle')}
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="flex min-w-[240px] flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
              {t('selectOrg')}
            </span>
            <select
              value={orgId}
              onChange={(event) => setOrgId(event.target.value)}
              className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
            >
              {organizations.data?.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>

          {canCreate && (
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => createRun.mutate({ fromActiveEmployees: true })}
                disabled={createRun.isPending || !selected?.treasuryContractId}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createRun.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {createRun.isPending ? t('creating') : t('newRun')}
              </button>
              <p className="text-xs text-[#637085] dark:text-[#8888aa]">{t('fromActive')}</p>
            </div>
          )}
        </div>

        {selected && !selected.treasuryContractId && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {t('needTreasury')}
          </p>
        )}

        {createRun.isError && <ErrorNote error={createRun.error} />}

        <p className="mt-4 text-xs text-[#637085] dark:text-[#8888aa]">{t('batchNote')}</p>
      </SurfaceCard>

      <SurfaceCard>
        {runs.isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#637085]" />}
        {runs.isError && <ErrorNote error={runs.error} />}

        {runs.data?.length === 0 && (
          <p className="text-sm text-[#637085] dark:text-[#8888aa]">{t('noRuns')}</p>
        )}

        {runs.data && runs.data.length > 0 && (
          <ul className="space-y-3">
            {runs.data.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/payroll/${run.id}`}
                  className="flex items-center justify-between gap-4 rounded-[18px] border border-[#eadfce] bg-[#fffaf2] p-4 transition-colors hover:border-[#1f8f55]/50 dark:border-[#1e1e3a] dark:bg-[#0f0f24]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102033] text-white dark:bg-[#2a2a5a]">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#102033] dark:text-white">
                        {run.totalAmount} USDC
                      </p>
                      <p className="mt-0.5 text-xs text-[#637085] dark:text-[#8888aa]">
                        {run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  <PayrollStatusBadge status={run.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>
    </div>
  );
}
