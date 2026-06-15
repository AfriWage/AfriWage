'use client';

import { StrKey } from '@stellar/stellar-sdk';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import { type DragEvent, useCallback, useMemo, useRef, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import { sendPaymentViaFreighter } from '@/lib/payment-client';
import { cn } from '@/lib/utils';

type RowStatus = 'pending' | 'sending' | 'sent' | 'failed';
type Step = 'upload' | 'review' | 'executing' | 'complete';

interface BatchRow {
  id: string;
  address: string;
  amount: string;
  memo: string;
  status: RowStatus;
  error?: string;
  txHash?: string;
}

interface CsvRow {
  address?: string;
  amount?: string;
  memo?: string;
}

const CSV_TEMPLATE = `address,amount,memo
GBZXN7PIRZGNMHGA7MUUUF4GWTMWBXQKJBNV43IXRAJDYIPXZRPTXOJY,25.00,January payroll
GCKFBEIYTKP6R7Q5E6T5Q6T5Q6T5Q6T5Q6T5Q6T5Q6T5Q6T5Q6T5Q6T,50.00,Contractor fee`;

function validateRow(
  row: CsvRow,
  t: ReturnType<typeof useTranslations<'batch'>>
): { valid: boolean; error?: string; data?: { address: string; amount: string; memo: string } } {
  const address = row.address?.trim() ?? '';
  const amount = row.amount?.trim() ?? '';
  const memo = row.memo?.trim() ?? '';

  if (!address && !amount && !memo) {
    return { valid: false, error: t('emptyRow') };
  }

  if (!address || !amount) {
    return { valid: false, error: t('missingFields') };
  }

  if (!StrKey.isValidEd25519PublicKey(address)) {
    return { valid: false, error: t('invalidAddress') };
  }

  const parsedAmount = Number.parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return { valid: false, error: t('invalidAmount') };
  }

  return {
    valid: true,
    data: { address, amount, memo },
  };
}

export default function BatchPage() {
  const t = useTranslations('batch');
  const tCommon = useTranslations('common');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = useCallback((pk: string) => setPublicKey(pk), []);
  const handleDisconnect = useCallback(() => setPublicKey(null), []);

  const validRows = useMemo(() => rows.filter((r) => r.status !== 'failed' || !r.error), [rows]);
  const hasInvalidRows = useMemo(() => rows.some((r) => r.error), [rows]);
  const canConfirm = useMemo(
    () => rows.length > 0 && !hasInvalidRows && rows.every((r) => !r.error),
    [rows, hasInvalidRows]
  );

  const totalAmount = useMemo(
    () =>
      rows
        .filter((r) => !r.error)
        .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
        .toFixed(2),
    [rows]
  );

  const completedCount = useMemo(
    () => rows.filter((r) => r.status === 'sent' || r.status === 'failed').length,
    [rows]
  );

  const successCount = useMemo(() => rows.filter((r) => r.status === 'sent').length, [rows]);
  const failureCount = useMemo(() => rows.filter((r) => r.status === 'failed' && !r.error).length, [rows]);
  const sentTotal = useMemo(
    () =>
      rows
        .filter((r) => r.status === 'sent')
        .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
        .toFixed(2),
    [rows]
  );

  const parseCsv = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setFileError(t('invalidFile'));
        return;
      }

      setFileError(null);

      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: BatchRow[] = results.data.map((row, index) => {
            const validation = validateRow(row, t);
            return {
              id: `row-${index}`,
              address: row.address?.trim() ?? '',
              amount: row.amount?.trim() ?? '',
              memo: row.memo?.trim() ?? '',
              status: 'pending' as const,
              error: validation.valid ? undefined : validation.error,
            };
          });

          if (parsed.length === 0) {
            setFileError(t('noValidRows'));
            return;
          }

          setRows(parsed);
          setStep('review');
        },
        error: () => {
          setFileError(t('invalidFile'));
        },
      });
    },
    [t]
  );

  const handleFileSelect = (file: File | undefined) => {
    if (file) parseCsv(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'afriwage-batch-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportResults = () => {
    const csvData = rows.map((row) => ({
      address: row.address,
      amount: row.amount,
      memo: row.memo,
      status: row.status,
      error: row.error ?? '',
      txHash: row.txHash ?? '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'afriwage-batch-results.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const executePayments = async () => {
    if (!publicKey) return;

    setStep('executing');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.error) continue;

      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'sending' as const } : r))
      );

      try {
        const result = await sendPaymentViaFreighter(
          publicKey,
          row.address,
          row.amount,
          row.memo || undefined
        );

        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, status: 'sent' as const, txHash: result.hash }
              : r
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : tCommon('error');
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: 'failed' as const, error: message } : r
          )
        );
      }
    }

    setStep('complete');
  };

  const reset = () => {
    setRows([]);
    setStep('upload');
    setFileError(null);
  };

  const statusLabel = (status: RowStatus, error?: string) => {
    if (error && status === 'pending') return error;
    switch (status) {
      case 'pending':
        return t('pending');
      case 'sending':
        return t('sending');
      case 'sent':
        return t('sent');
      case 'failed':
        return t('failed');
    }
  };

  return (
    <DashboardShell
      title={t('title')}
      description={t('description')}
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      <div className="space-y-6">
        {step === 'upload' && (
          <SurfaceCard>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-[#102033]">{t('uploadTitle')}</h2>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d8cebe] bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-[#415065] transition-colors hover:bg-[#f3ecdf]"
              >
                <Download className="h-4 w-4" />
                {t('downloadTemplate')}
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 py-16 transition-colors',
                dragOver
                  ? 'border-[#1f8f55] bg-[#dff3e8]/40'
                  : 'border-[#d8cebe] bg-[#fffaf2] hover:border-[#1f8f55]/50'
              )}
            >
              <Upload className="h-10 w-10 text-[#8c7760]" />
              <p className="mt-4 text-center font-medium text-[#102033]">{t('uploadHint')}</p>
              <p className="mt-2 text-sm text-[#637085]">{t('csvOnly')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>

            {fileError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}
          </SurfaceCard>
        )}

        {(step === 'review' || step === 'executing' || step === 'complete') && (
          <>
            <SurfaceCard>
              <h2 className="font-display text-xl font-semibold text-[#102033]">
                {step === 'review' ? t('previewTitle') : step === 'executing' ? t('executingTitle') : t('completeTitle')}
              </h2>

              {step === 'executing' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-[#637085]">
                    <span>{t('progress', { completed: completedCount, total: validRows.length })}</span>
                    <span>{Math.round((completedCount / validRows.length) * 100)}%</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#efe3d0]">
                    <div
                      className="h-full rounded-full bg-[#1f8f55] transition-all duration-300"
                      style={{ width: `${(completedCount / validRows.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {step === 'complete' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-[#dff3e8] bg-[#f0fdf4] p-4">
                    <p className="text-sm text-[#637085]">{t('successCount', { count: successCount })}</p>
                  </div>
                  <div className="rounded-[18px] border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">{t('failureCount', { count: failureCount })}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#efe3d0] bg-[#fffaf2] p-4">
                    <p className="text-sm text-[#102033]">{t('totalSent', { total: sentTotal })}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#efe3d0] text-xs uppercase tracking-wider text-[#8c7760]">
                      <th className="px-3 py-3">{t('address')}</th>
                      <th className="px-3 py-3">{t('amountUsdc')}</th>
                      <th className="px-3 py-3">{t('memo')}</th>
                      <th className="px-3 py-3">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-b border-[#efe3d0]',
                          row.error && 'bg-red-50',
                          row.status === 'sent' && 'bg-[#f0fdf4]',
                          row.status === 'failed' && !row.error && 'bg-red-50'
                        )}
                      >
                        <td className="px-3 py-3 font-mono text-xs">{row.address || '—'}</td>
                        <td className="px-3 py-3">{row.amount || '—'}</td>
                        <td className="px-3 py-3">{row.memo || '—'}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            {row.status === 'sending' && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1f8f55]" />
                            )}
                            {row.status === 'sent' && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#1f8f55]" />
                            )}
                            {row.status === 'failed' && (
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span
                              className={cn(
                                row.error || (row.status === 'failed' && !row.txHash)
                                  ? 'text-red-600'
                                  : row.status === 'sent'
                                    ? 'text-[#1f8f55]'
                                    : 'text-[#637085]'
                              )}
                            >
                              {statusLabel(row.status, row.error)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>

            {step === 'review' && (
              <SurfaceCard>
                <h2 className="font-display text-xl font-semibold text-[#102033]">{t('reviewTitle')}</h2>
                <p className="mt-2 text-[#637085]">
                  {t('summary', { count: validRows.length, total: totalAmount })}
                </p>

                {!publicKey && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {t('connectWallet')}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!canConfirm || !publicKey}
                    onClick={executePayments}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1f8f55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileUp className="h-4 w-4" />
                    {t('confirmSendAll')}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#d8cebe] bg-transparent px-6 py-3 text-sm font-semibold text-[#415065] transition-colors hover:bg-[#f3ecdf]"
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </SurfaceCard>
            )}

            {step === 'complete' && (
              <SurfaceCard>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportResults}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#102033] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3048]"
                  >
                    <Download className="h-4 w-4" />
                    {t('exportResults')}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#d8cebe] bg-transparent px-6 py-3 text-sm font-semibold text-[#415065] transition-colors hover:bg-[#f3ecdf]"
                  >
                    {t('startOver')}
                  </button>
                </div>
              </SurfaceCard>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
