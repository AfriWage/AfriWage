'use client';

import { Building2, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SessionBadge, WalletAuthGate } from '@/components/WalletAuthGate';
import { ErrorNote, RoleBadge } from '@/components/org-ui';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { useCreateOrganization, useOrganizations } from '@/hooks/use-orgs';
import { Link } from '@/i18n/navigation';
import { OFFRAMP_CURRENCIES } from '@/lib/org-currencies';
import { truncatePublicKey } from '@/lib/stellar-format';

export default function OrganizationsPage() {
  const t = useTranslations('organizations');

  return (
    <DashboardShell title={t('title')} description={t('description')} actions={<SessionBadge />}>
      <WalletAuthGate>
        <div className="space-y-6">
          <OrganizationList />
          <CreateOrganizationForm />
        </div>
      </WalletAuthGate>
    </DashboardShell>
  );
}

function OrganizationList() {
  const t = useTranslations('organizations');
  const organizations = useOrganizations();

  return (
    <SurfaceCard>
      <h2 className="font-display text-xl font-semibold text-[#102033] dark:text-white">
        {t('yourOrganizations')}
      </h2>

      {organizations.isLoading && (
        <div className="mt-6 flex items-center gap-2 text-[#637085] dark:text-[#8888aa]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {organizations.isError && <ErrorNote error={organizations.error} />}

      {organizations.data?.length === 0 && (
        <div className="mt-6 rounded-[18px] border border-dashed border-[#d8cebe] bg-[#fffaf2] p-6 text-center dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
          <p className="font-medium text-[#102033] dark:text-white">{t('noOrganizations')}</p>
          <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
            {t('noOrganizationsHint')}
          </p>
        </div>
      )}

      {organizations.data && organizations.data.length > 0 && (
        <ul className="mt-6 space-y-3">
          {organizations.data.map((organization) => (
            <li key={organization.id}>
              <Link
                href={`/organizations/${organization.id}`}
                className="flex items-center justify-between gap-4 rounded-[18px] border border-[#eadfce] bg-[#fffaf2] p-4 transition-colors hover:border-[#1f8f55]/50 dark:border-[#1e1e3a] dark:bg-[#0f0f24]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102033] text-white dark:bg-[#2a2a5a]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#102033] dark:text-white">
                      {organization.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#637085] dark:text-[#8888aa]">
                      {organization.treasuryContractId
                        ? `${t('treasury')}: ${truncatePublicKey(organization.treasuryContractId, 6)}`
                        : t('treasuryNotProvisioned')}
                    </p>
                  </div>
                </div>
                <RoleBadge role={organization.role} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}

function CreateOrganizationForm() {
  const t = useTranslations('organizations');
  const create = useCreateOrganization();
  const [name, setName] = useState('');
  const [offramp, setOfframp] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim() === '') return;

    create.mutate(
      { name: name.trim(), defaultOfframpCurrency: offramp === '' ? null : offramp },
      {
        onSuccess: () => {
          setName('');
          setOfframp('');
        },
      }
    );
  };

  return (
    <SurfaceCard>
      <h2 className="font-display text-xl font-semibold text-[#102033] dark:text-white">
        {t('createTitle')}
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
            {t('nameLabel')}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('namePlaceholder')}
            maxLength={120}
            required
            className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
            {t('offrampLabel')}
          </span>
          <select
            value={offramp}
            onChange={(event) => setOfframp(event.target.value)}
            className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
          >
            <option value="">{t('offrampNone')}</option>
            {OFFRAMP_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={create.isPending || name.trim() === ''}
          className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-[#1f8f55] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {create.isPending ? t('creating') : t('create')}
        </button>
      </form>

      {create.isError && <ErrorNote error={create.error} />}
    </SurfaceCard>
  );
}
