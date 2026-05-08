'use client';

import { ArrowRight, CheckCircle, Copy, ExternalLink, MapPin } from 'lucide-react';
import { useCallback, useState } from 'react';
import { formatAmount } from '@/lib/stellar';
import { cn, copyToClipboard } from '@/lib/utils';
import type { Worker } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/types';

interface WorkerCardProps {
  worker: Worker;
  onPay?: (worker: Worker) => void;
  className?: string;
}

export function WorkerCard({ worker, onPay, className }: WorkerCardProps) {
  const [copied, setCopied] = useState(false);

  const country = SUPPORTED_COUNTRIES.find((c) => c.code === worker.country);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(worker.publicKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [worker.publicKey]);

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'group relative rounded-[24px] border border-brand-outline-variant bg-white p-6 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-navy/5',
        className
      )}
    >
      {/* Avatar + Name */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary shadow-lg shadow-brand-primary/20 text-lg font-black text-white">
            {initials}
          </div>
          <div>
            <p className="text-lg font-black text-brand-navy">{worker.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg leading-none">{country?.flag}</span>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-secondary opacity-60">
                <MapPin className="h-3 w-3" />
                {country?.name ?? worker.country}
              </div>
            </div>
          </div>
        </div>

        {/* Total received badge */}
        <div className="rounded-xl bg-brand-surface border border-brand-outline-variant px-4 py-2 text-right">
          <p className="font-mono text-sm font-black text-brand-navy">
            {formatAmount(worker.totalReceived, 'USDC')}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary opacity-40">Lifetime</p>
        </div>
      </div>

      {/* Wallet address */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-brand-surface border border-brand-outline-variant p-3">
        <p className="flex-1 font-mono text-xs font-medium text-brand-navy/60 truncate">
          {worker.publicKey}
        </p>
        <div className="flex items-center gap-1 border-l border-brand-outline-variant pl-3">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-brand-secondary transition-colors hover:text-brand-primary"
            title="Copy address"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-brand-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${worker.publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-brand-secondary transition-colors hover:text-brand-primary"
            title="View on Explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Pay button */}
      {onPay && (
        <button
          type="button"
          onClick={() => onPay(worker)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-navy py-4 text-sm font-black text-white shadow-xl shadow-brand-navy/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Initiate Payment
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
