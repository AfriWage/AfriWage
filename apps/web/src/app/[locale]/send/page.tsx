'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { SendPaymentForm } from '@/components/SendPaymentForm';
import { WalletConnect } from '@/components/WalletConnect';

export default function SendPage() {
  const t = useTranslations('send');
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const handleConnect = useCallback((pk: string) => setPublicKey(pk), []);
  const handleDisconnect = useCallback(() => setPublicKey(null), []);

  return (
    <DashboardShell
      title={t('title')}
      description={t('description')}
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      <div className="space-y-6">
        <SurfaceCard>
          <SendPaymentForm senderPublicKey={publicKey ?? undefined} />
        </SurfaceCard>
      </div>
    </DashboardShell>
  );
}
