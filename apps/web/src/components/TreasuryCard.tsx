'use client';

import { Loader2, Plus, ShieldCheck, Vault } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { SurfaceCard } from '@/components/dashboard-shell';
import { ErrorNote } from '@/components/org-ui';
import { useCreateBudgetCategory, useProvisionTreasury, useTreasury } from '@/hooks/use-treasury';
import type { OrgRole } from '@/lib/org-roles';
import { Decimal } from 'decimal.js';

/**
 * The organization's Charter treasury: provisioning, live state and budget
 * categories.
 *
 * Every action here builds unsigned XDR server-side and signs it in Freighter,
 * which is why the sign-explainer copy is shown rather than left implicit — a
 * signature prompt on a payroll app should say whose key is moving what.
 */
export function TreasuryCard({ orgId, role }: { orgId: string; role: OrgRole }) {
  const t = useTranslations('treasury');
  const treasury = useTreasury(orgId);
  const provision = useProvisionTreasury(orgId);

  const state = treasury.data?.treasury ?? null;
  const canProvision = role === 'owner';
  const canManageCategories = role === 'owner' || role === 'admin';

  return (
    <SurfaceCard>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102033] text-white dark:bg-[#2a2a5a]">
          <Vault className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[#102033] dark:text-white">
          {t('title')}
        </h2>
      </div>

      {treasury.isLoading && <Loader2 className="mt-6 h-5 w-5 animate-spin text-[#637085]" />}

      {treasury.isError && <ErrorNote error={treasury.error} />}

      {!treasury.isLoading && !state && (
        <div className="mt-6 rounded-[18px] border border-dashed border-[#d8cebe] bg-[#fffaf2] p-6 dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
          <p className="font-medium text-[#102033] dark:text-white">{t('notProvisioned')}</p>
          <p className="mt-1 text-sm text-[#637085] dark:text-[#8888aa]">
            {t('notProvisionedHint')}
          </p>

          {canProvision && (
            <>
              <button
                type="button"
                onClick={() => provision.mutate(undefined)}
                disabled={provision.isPending}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {provision.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {provision.isPending ? t('provisioning') : t('provision')}
              </button>
              <p className="mt-3 text-xs text-[#637085] dark:text-[#8888aa]">
                {t('signExplainer')}
              </p>
            </>
          )}

          {provision.isError && <ErrorNote error={provision.error} />}
        </div>
      )}

      {state && (
        <>
          <p className="mt-4 text-sm text-[#637085] dark:text-[#8888aa]">
            {t('body', { threshold: state.threshold, approvers: state.approvers.length })}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label={t('balance')} value={`${state.balance} USDC`} />
            <Stat label={t('threshold')} value={String(state.threshold)} />
            <Stat label={t('approvers')} value={String(state.approvers.length)} />
          </div>

          <p className="mt-4 break-all font-mono text-xs text-[#637085] dark:text-[#8888aa]">
            {state.contractId}
          </p>

          <CategoryTable
            orgId={orgId}
            categories={state.categories}
            canManage={canManageCategories}
          />
        </>
      )}
    </SurfaceCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#efe3d0] bg-[#fffaf2] p-4 dark:border-[#1e1e3a] dark:bg-[#0f0f24]">
      <p className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-[#102033] dark:text-white">
        {value}
      </p>
    </div>
  );
}

interface CategoryRow {
  id: number;
  name: string;
  cap: string;
  spent: string;
  active: boolean;
}

function CategoryTable({
  orgId,
  categories,
  canManage,
}: {
  orgId: string;
  categories: CategoryRow[];
  canManage: boolean;
}) {
  const t = useTranslations('treasury');
  const createCategory = useCreateBudgetCategory(orgId);
  const [name, setName] = useState('');
  const [capAmount, setCapAmount] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    createCategory.mutate(
      { name: name.trim(), capAmount: capAmount.trim() },
      {
        onSuccess: () => {
          setName('');
          setCapAmount('');
        },
      }
    );
  };

  return (
    <div className="mt-8">
      <h3 className="font-display text-lg font-semibold text-[#102033] dark:text-white">
        {t('categoriesTitle')}
      </h3>

      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-[#637085] dark:text-[#8888aa]">{t('noCategories')}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#efe3d0] text-xs uppercase tracking-wider text-[#8c7760] dark:border-[#1e1e3a] dark:text-[#7777aa]">
                <th className="px-3 py-3">{t('categoryName')}</th>
                <th className="px-3 py-3">{t('categoryCap')}</th>
                <th className="px-3 py-3">{t('categorySpent')}</th>
                <th className="px-3 py-3">{t('categoryRemaining')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-[#efe3d0] dark:border-[#1e1e3a]">
                  <td className="px-3 py-3 text-[#102033] dark:text-white">{category.name}</td>
                  <td className="px-3 py-3 text-[#637085] dark:text-[#8888aa]">{category.cap}</td>
                  <td className="px-3 py-3 text-[#637085] dark:text-[#8888aa]">{category.spent}</td>
                  <td className="px-3 py-3 text-[#102033] dark:text-white">
                    {remainingCap(category)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
              {t('categoryName')}
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#8c7760] dark:text-[#7777aa]">
              {t('capLabel')}
            </span>
            <input
              value={capAmount}
              onChange={(event) => setCapAmount(event.target.value)}
              inputMode="decimal"
              placeholder="25000.00"
              required
              className="rounded-lg border border-[#d8cebe] bg-white px-4 py-2.5 text-sm text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
            />
          </label>

          <button
            type="submit"
            disabled={createCategory.isPending}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-[#102033] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3048] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createCategory.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {createCategory.isPending ? t('addingCategory') : t('addCategory')}
          </button>
        </form>
      )}

      {createCategory.isError && <ErrorNote error={createCategory.error} />}
    </div>
  );
}

/**
 * Remaining headroom under a category's lifetime cap.
 *
 * Computed with decimal.js rather than subtracting floats — these are USDC
 * amounts with seven decimal places, and 0.1 + 0.2 arithmetic has no place in a
 * budget figure an operator reads before approving a payout.
 */
function remainingCap(category: CategoryRow): string {
  return new Decimal(category.cap).minus(category.spent).toFixed(2);
}
