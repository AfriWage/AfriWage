'use client';

import { AlertCircle, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { SurfaceCard } from '@/components/dashboard-shell';
import { useLogin, useLogout, useSession } from '@/hooks/use-session';
import { truncatePublicKey } from '@/lib/stellar-format';

/**
 * Renders its children only for a wallet that has completed SEP-10 login.
 *
 * Connecting a wallet is not the same as being signed in: `WalletConnect` reads
 * an address from Freighter, which proves nothing to the server. This gate is
 * what stands between that and a session the org routes will accept.
 */
export function WalletAuthGate({ children }: { children: ReactNode }) {
  const t = useTranslations('organizations');
  const session = useSession();
  const login = useLogin();

  if (session.isLoading) {
    return (
      <SurfaceCard>
        <div className="flex items-center gap-3 text-[#637085] dark:text-[#8888aa]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('signingIn')}</span>
        </div>
      </SurfaceCard>
    );
  }

  if (!session.data?.authenticated) {
    return (
      <SurfaceCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dff3e8] text-[#1f8f55] dark:bg-[#1a3a2a]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-[#102033] dark:text-white">
              {t('signInTitle')}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#637085] dark:text-[#8888aa]">
              {t('signInBody')}
            </p>

            <button
              type="button"
              onClick={() => login.mutate()}
              disabled={login.isPending}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {login.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {login.isPending ? t('signingIn') : t('signInAction')}
            </button>

            {login.isError && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {login.error instanceof Error ? login.error.message : t('signInAction')}
              </p>
            )}
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return <>{children}</>;
}

/** Shows the signed-in wallet with a sign-out action, for a page's header slot. */
export function SessionBadge() {
  const t = useTranslations('organizations');
  const session = useSession();
  const signOut = useLogout();

  if (!session.data?.authenticated || !session.data.walletPublicKey) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#d8cebe] bg-white px-3 py-2 dark:border-[#1e1e3a] dark:bg-[#16163a]">
      <span className="font-mono text-xs text-[#102033] dark:text-[#c0c0e0]">
        {truncatePublicKey(session.data.walletPublicKey)}
      </span>
      <button
        type="button"
        onClick={() => signOut.mutate()}
        title={t('signOut')}
        aria-label={t('signOut')}
        className="text-[#637085] transition-colors hover:text-[#1f8f55] dark:text-[#8888aa]"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
