'use client';

import { ArrowLeft, Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SessionBadge, WalletAuthGate } from '@/components/WalletAuthGate';
import { ErrorNote, RoleBadge } from '@/components/org-ui';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import {
  useAddMember,
  useCreateEmployee,
  useEmployees,
  useOrgMembers,
  useOrganization,
  useRemoveMember,
  useUpdateEmployee,
} from '@/hooks/use-orgs';
import { Link } from '@/i18n/navigation';
import { OFFRAMP_CURRENCIES } from '@/lib/org-currencies';
import { ORG_ROLES, type OrgRole } from '@/lib/org-roles';
import { truncatePublicKey } from '@/lib/stellar-format';

export default function OrganizationDetailPage({ params }: { params: { orgId: string } }) {
  const t = useTranslations('organizations');

  return (
    <DashboardShell title={t('title')} description={t('description')} actions={<SessionBadge />}>
      <WalletAuthGate>
        <OrganizationDetail orgId={params.orgId} />
      </WalletAuthGate>
    </DashboardShell>
  );
}

function OrganizationDetail({ orgId }: { orgId: string }) {
  const t = useTranslations('organizations');
  const organization = useOrganization(orgId);

  if (organization.isLoading) {
    return (
      <SurfaceCard>
        <Loader2 className="h-5 w-5 animate-spin text-[#637085]" />
      </SurfaceCard>
    );
  }

  if (organization.isError || !organization.data) {
    return (
      <SurfaceCard>
        <p className="text-[#102033] dark:text-white">{t('notFound')}</p>
        <ErrorNote error={organization.error} />
      </SurfaceCard>
    );
  }

  const { data } = organization;
  const canManageMembers = data.role === 'owner';
  const canManageEmployees = data.role === 'owner' || data.role === 'admin';

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-sm text-[#637085] transition-colors hover:text-[#1f8f55] dark:text-[#8888aa]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToOrganizations')}
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-[#102033] dark:text-white">
            {data.name}
          </h2>
          <RoleBadge role={data.role} />
        </div>

        <p className="mt-2 break-all text-sm text-[#637085] dark:text-[#8888aa]">
          {data.treasuryContractId
            ? `${t('treasury')}: ${data.treasuryContractId}`
            : t('treasuryNotProvisioned')}
        </p>
      </SurfaceCard>

      <MembersCard orgId={orgId} canManage={canManageMembers} />
      <EmployeesCard orgId={orgId} canManage={canManageEmployees} />
    </div>
  );
}

function MembersCard({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const t = useTranslations('organizations');
  const members = useOrgMembers(orgId);
  const addMember = useAddMember(orgId);
  const removeMember = useRemoveMember(orgId);
  const [wallet, setWallet] = useState('');
  const [role, setRole] = useState<OrgRole>('payer');

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (wallet.trim() === '') return;

    addMember.mutate({ walletPublicKey: wallet.trim(), role }, { onSuccess: () => setWallet('') });
  };

  return (
    <SurfaceCard>
      <h2 className="font-display text-xl font-semibold text-[#102033] dark:text-white">
        {t('membersTitle')}
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-[#637085] dark:text-[#8888aa]">
        {t('membersBody')}
      </p>

      {members.isError && <ErrorNote error={members.error} />}

      {members.data?.length === 0 && (
        <p className="mt-6 text-sm text-[#637085] dark:text-[#8888aa]">{t('noMembers')}</p>
      )}

      {members.data && members.data.length > 0 && (
        <ul className="mt-6 divide-y divide-[#efe3d0] dark:divide-[#1e1e3a]">
          {members.data.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 py-3">
              <span
                className="truncate font-mono text-sm text-[#102033] dark:text-[#c0c0e0]"
                title={member.walletPublicKey}
              >
                {truncatePublicKey(member.walletPublicKey, 6)}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <RoleBadge role={member.role} />
                {canManage && (
                  <button
                    type="button"
                    onClick={() => removeMember.mutate(member.walletPublicKey)}
                    disabled={removeMember.isPending}
                    title={t('removeMember')}
                    aria-label={t('removeMember')}
                    className="text-[#637085] transition-colors hover:text-red-600 disabled:opacity-50 dark:text-[#8888aa]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {removeMember.isError && <ErrorNote error={removeMember.error} />}

      {canManage && (
        <form onSubmit={handleAdd} className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
              {t('walletLabel')}
            </span>
            <input
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              placeholder="G…"
              required
              className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 font-mono text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
              {t('roleLabel')}
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as OrgRole)}
              className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
            >
              {ORG_ROLES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={addMember.isPending || wallet.trim() === ''}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-[#102033] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3048] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addMember.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {addMember.isPending ? t('addingMember') : t('addMember')}
          </button>
        </form>
      )}

      {addMember.isError && <ErrorNote error={addMember.error} />}
    </SurfaceCard>
  );
}

function EmployeesCard({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const t = useTranslations('organizations');
  const employees = useEmployees(orgId);
  const createEmployee = useCreateEmployee(orgId);
  const updateEmployee = useUpdateEmployee(orgId);
  const [form, setForm] = useState({
    name: '',
    stellarPublicKey: '',
    wageAmount: '',
    payoutOfframpCurrency: '',
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();

    createEmployee.mutate(
      {
        name: form.name.trim(),
        stellarPublicKey: form.stellarPublicKey.trim(),
        wageAmount: form.wageAmount.trim(),
        payoutOfframpCurrency:
          form.payoutOfframpCurrency === '' ? null : form.payoutOfframpCurrency,
      },
      {
        onSuccess: () =>
          setForm({ name: '', stellarPublicKey: '', wageAmount: '', payoutOfframpCurrency: '' }),
      }
    );
  };

  return (
    <SurfaceCard>
      <h2 className="font-display text-xl font-semibold text-[#102033] dark:text-white">
        {t('employeesTitle')}
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-[#637085] dark:text-[#8888aa]">
        {t('employeesBody')}
      </p>

      {employees.isError && <ErrorNote error={employees.error} />}

      {employees.data?.length === 0 && (
        <p className="mt-6 text-sm text-[#637085] dark:text-[#8888aa]">{t('noEmployees')}</p>
      )}

      {employees.data && employees.data.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#efe3d0] text-xs uppercase tracking-wider text-[#8c7760] dark:border-[#1e1e3a] dark:text-[#7777aa]">
                <th className="px-3 py-3">{t('employeeName')}</th>
                <th className="px-3 py-3">{t('employeeWallet')}</th>
                <th className="px-3 py-3">{t('employeeWage')}</th>
                <th className="px-3 py-3">{t('employeeOfframp')}</th>
                <th className="px-3 py-3">{t('employeeStatus')}</th>
                {canManage && <th className="px-3 py-3" />}
              </tr>
            </thead>
            <tbody>
              {employees.data.map((employee) => (
                <tr key={employee.id} className="border-b border-[#efe3d0] dark:border-[#1e1e3a]">
                  <td className="px-3 py-3 text-[#102033] dark:text-white">{employee.name}</td>
                  <td
                    className="px-3 py-3 font-mono text-xs text-[#637085] dark:text-[#8888aa]"
                    title={employee.stellarPublicKey}
                  >
                    {truncatePublicKey(employee.stellarPublicKey, 6)}
                  </td>
                  <td className="px-3 py-3 text-[#102033] dark:text-white">
                    {employee.wageAmount}
                  </td>
                  <td className="px-3 py-3 text-[#637085] dark:text-[#8888aa]">
                    {employee.payoutOfframpCurrency ?? t('onChain')}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        employee.active ? 'text-[#1f8f55]' : 'text-[#637085] dark:text-[#8888aa]'
                      }
                    >
                      {employee.active ? t('employeeActive') : t('employeeInactive')}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          updateEmployee.mutate({ id: employee.id, active: !employee.active })
                        }
                        disabled={updateEmployee.isPending}
                        className="text-xs font-semibold text-[#637085] transition-colors hover:text-[#1f8f55] disabled:opacity-50 dark:text-[#8888aa]"
                      >
                        {employee.active ? t('deactivate') : t('reactivate')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {updateEmployee.isError && <ErrorNote error={updateEmployee.error} />}

      {canManage && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_2fr_1fr_1fr_auto]"
        >
          <EmployeeField
            label={t('employeeName')}
            value={form.name}
            onChange={(name) => setForm((prev) => ({ ...prev, name }))}
            required
          />
          <EmployeeField
            label={t('employeeWallet')}
            value={form.stellarPublicKey}
            onChange={(stellarPublicKey) => setForm((prev) => ({ ...prev, stellarPublicKey }))}
            placeholder="G…"
            mono
            required
          />
          <EmployeeField
            label={t('employeeWage')}
            value={form.wageAmount}
            onChange={(wageAmount) => setForm((prev) => ({ ...prev, wageAmount }))}
            placeholder="250.00"
            inputMode="decimal"
            required
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
              {t('employeeOfframp')}
            </span>
            <select
              value={form.payoutOfframpCurrency}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, payoutOfframpCurrency: event.target.value }))
              }
              className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
            >
              <option value="">{t('onChain')}</option>
              {OFFRAMP_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={createEmployee.isPending}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-[#1f8f55] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEmployee.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {createEmployee.isPending ? t('addingEmployee') : t('addEmployee')}
          </button>
        </form>
      )}

      {createEmployee.isError && <ErrorNote error={createEmployee.error} />}
    </SurfaceCard>
  );
}

function EmployeeField({
  label,
  value,
  onChange,
  placeholder,
  mono,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
  inputMode?: 'decimal';
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className={`rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white ${
          mono ? 'font-mono' : ''
        }`}
      />
    </label>
  );
}
