'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Copy, ExternalLink, Share2, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { verifyPayment } from '@/lib/api';
import { truncatePublicKey } from '@/lib/stellar-format';
import { copyToClipboard, formatDate } from '@/lib/utils';

export default function ReceiptPage() {
  const params = useParams<{ hash: string }>();
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const hash = typeof params.hash === 'string' ? params.hash : '';

  const receiptQuery = useQuery({
    queryKey: ['receipt', hash],
    queryFn: () => verifyPayment(hash),
    enabled: Boolean(hash),
  });

  const handleCopyHash = useCallback(async () => {
    if (!receiptQuery.data?.hash) return;
    const success = await copyToClipboard(receiptQuery.data.hash);
    if (!success) return;
    setCopiedHash(true);
    window.setTimeout(() => setCopiedHash(false), 1500);
  }, [receiptQuery.data?.hash]);

  const handleShare = useCallback(async () => {
    const success = await copyToClipboard(window.location.href);
    if (!success) return;
    setCopiedUrl(true);
    window.setTimeout(() => setCopiedUrl(false), 1500);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6efe6] px-4 py-10 text-[#102033] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#102033] text-white">
            <span className="font-display text-lg font-semibold">A</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold">Payment Receipt</h1>
          <p className="mt-2 text-sm text-[#637085]">
            Public verification for AfriWage payout delivery on Stellar.
          </p>
        </div>

        <div className="rounded-[32px] border border-[#eadfce] bg-white p-6 shadow-[0_22px_50px_rgba(16,32,51,0.06)] sm:p-8">
          {receiptQuery.isLoading ? (
            <div className="space-y-5">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ) : receiptQuery.isError ? (
            <div className="rounded-[24px] border border-red-100 bg-red-50 p-6 text-center">
              <p className="text-lg font-semibold text-red-600">Receipt verification failed</p>
              <p className="mt-2 text-sm text-red-500">
                {receiptQuery.error instanceof Error
                  ? receiptQuery.error.message
                  : 'Unable to verify transaction'}
              </p>
            </div>
          ) : receiptQuery.data ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[24px] bg-[#fffaf2] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Verification status</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-[#102033]">
                    {receiptQuery.data.verified ? 'Payment verified' : 'Verification failed'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                    receiptQuery.data.verified
                      ? 'bg-[#dff3e8] text-[#1f8f55]'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {receiptQuery.data.verified ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {receiptQuery.data.verified ? 'Verified' : 'Failed'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Sender</p>
                  <p className="mt-3 font-mono text-sm text-[#102033]">
                    {truncatePublicKey(receiptQuery.data.sender, 6)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Recipient</p>
                  <p className="mt-3 font-mono text-sm text-[#102033]">
                    {truncatePublicKey(receiptQuery.data.recipient, 6)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Amount</p>
                  <p className="mt-3 font-mono text-sm text-[#102033]">
                    {receiptQuery.data.amount} {receiptQuery.data.asset}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Date &amp; time</p>
                  <p className="mt-3 text-sm text-[#102033]">
                    {receiptQuery.data.createdAt ? formatDate(receiptQuery.data.createdAt) : 'Unavailable'}
                  </p>
                </div>
              </div>

              {receiptQuery.data.memo && (
                <div className="rounded-[24px] border border-[#eadfce] bg-[#fffaf2] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Memo</p>
                  <p className="mt-3 text-sm text-[#102033]">{receiptQuery.data.memo}</p>
                </div>
              )}

              <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Transaction hash</p>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1f8f55]"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedHash ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-3 break-all font-mono text-sm text-[#102033]">{receiptQuery.data.hash}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={receiptQuery.data.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-[20px] border border-[#eadfce] bg-white px-4 py-3 font-semibold text-[#102033]"
                >
                  View on Stellar Explorer
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-[#1f8f55] px-4 py-3 font-semibold text-white"
                >
                  <Share2 className="h-4 w-4" />
                  {copiedUrl ? 'Receipt URL Copied' : 'Share Receipt'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
