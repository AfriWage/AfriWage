'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { OrgRole } from '@/lib/org-roles';

/** Small presentational pieces shared by the organization and payroll pages. */

export function RoleBadge({ role }: { role: OrgRole }) {
  const t = useTranslations('organizations');
  const labels: Record<OrgRole, string> = {
    owner: t('roleOwner'),
    admin: t('roleAdmin'),
    payer: t('rolePayer'),
  };

  return (
    <span className="shrink-0 rounded-full bg-[#dff3e8] px-3 py-1 text-xs font-semibold text-[#1f8f55] dark:bg-[#1a3a2a] dark:text-[#4ade80]">
      {labels[role]}
    </span>
  );
}

/**
 * Surfaces a failed mutation or query.
 *
 * Errors reaching here come from `ApiClientError`, which carries the server's
 * own message — so a 409 shows "An organization must keep at least one owner"
 * rather than a generic failure the user cannot act on.
 */
export function ErrorNote({ error }: { error: unknown }) {
  const tCommon = useTranslations('common');

  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {error instanceof Error ? error.message : tCommon('error')}
    </p>
  );
}
