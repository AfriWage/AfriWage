'use client';

import { StrKey } from '@stellar/stellar-sdk';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { OffRampSelector } from '@/components/OffRampSelector';
import { cn } from '@/lib/utils';

interface SendPaymentFormProps {
  senderPublicKey?: string;
  className?: string;
}

interface FormValues {
  recipientPublicKey: string;
  amount: string;
  memo: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function SendPaymentForm({ senderPublicKey, className }: SendPaymentFormProps) {
  const t = useTranslations('send');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      recipientPublicKey: '',
      amount: '',
      memo: '',
    },
  });

  const memo = watch('memo');
  const memoLength = memo.length;

  const colorClass =
    memoLength < 20
      ? 'text-[#6B7280]'
      : memoLength < 28
        ? 'text-[#F5A623]'
        : 'text-[#E24B4A]';

  const onSubmit = useCallback(
    async () => {
      if (!senderPublicKey) {
        setErrorMessage(t('connectBeforeSend'));
        setStatus('error');
        return;
      }

      setStatus('loading');
      setErrorMessage(null);
      setTxHash(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setTxHash('542a1f2...9a2f77c');
        setStatus('success');
        reset();
      } catch {
        setErrorMessage(t('paymentFailed'));
        setStatus('error');
      }
    },
    [senderPublicKey, reset, t]
  );

  const handleReset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setErrorMessage(null);
  }, []);

  return (
    <div className={cn('rounded-xl border border-[#E5E7EB] bg-white p-8 shadow-sm', className)}>
      {status === 'success' && txHash ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4]">
            <CheckCircle2 className="h-8 w-8 text-[#14A800]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#111111]">{t('paymentSent')}</h3>
            <p className="mt-2 text-sm text-[#6B7280]">{t('paymentDelivered')}</p>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              {t('transactionHash')}
            </p>
            <p className="mt-1 break-all font-mono text-sm text-[#111111]">{txHash}</p>
          </div>

          <div className="flex gap-4">
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F9FAFB]"
            >
              <ExternalLink className="h-4 w-4" />
              {tCommon('explorer')}
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              {t('sendAnother')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label
              htmlFor="recipientPublicKey"
              className="block text-sm font-semibold text-[#111111]"
            >
              {t('recipientAddress')} <span className="text-[#E24B4A]">*</span>
            </label>
            <input
              id="recipientPublicKey"
              type="text"
              placeholder={t('addressPlaceholder')}
              className={cn(
                'w-full rounded-lg border bg-white px-4 py-3 font-mono text-sm text-[#111111] placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50',
                errors.recipientPublicKey ? 'border-[#E24B4A]' : 'border-[#E5E7EB]'
              )}
              {...register('recipientPublicKey', {
                required: t('recipientRequired'),
                validate: (value) => StrKey.isValidEd25519PublicKey(value) || t('invalidAddress'),
              })}
            />
            {errors.recipientPublicKey && (
              <p className="flex items-center gap-1.5 text-xs text-[#E24B4A]">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.recipientPublicKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-semibold text-[#111111]">
              {t('amount')} (USDC) <span className="text-[#E24B4A]">*</span>
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={cn(
                  'w-full rounded-lg border bg-white py-3 pl-4 pr-16 text-sm text-[#111111] placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50',
                  errors.amount ? 'border-[#E24B4A]' : 'border-[#E5E7EB]'
                )}
                {...register('amount', {
                  required: t('amountRequired'),
                  min: { value: 0.01, message: t('minAmount') },
                  pattern: {
                    value: /^\d+(\.\d{1,7})?$/,
                    message: t('invalidAmount'),
                  },
                })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B7280]">
                USDC
              </span>
            </div>
            {errors.amount && (
              <p className="flex items-center gap-1.5 text-xs text-[#E24B4A]">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="memo" className="block text-sm font-semibold text-[#111111]">
              {t('memo')} <span className="font-normal text-[#6B7280]">{t('memoOptional')}</span>
            </label>
            <input
              id="memo"
              type="text"
              placeholder={t('memoPlaceholder')}
              maxLength={28}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50"
              {...register('memo', {
                maxLength: {
                  value: 28,
                  message: t('memoTooLong'),
                },
              })}
            />
            {errors.memo && (
              <p className="flex items-center gap-1.5 text-xs text-[#E24B4A]">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.memo.message}
              </p>
            )}
            <p
              aria-live="polite"
              className={cn('text-right text-xs', colorClass)}
            >
              {memoLength}
              {' '}
              / 28
            </p>
          </div>

          <OffRampSelector account={senderPublicKey} />

          {status === 'error' && errorMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !senderPublicKey}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white transition-colors',
              status === 'loading' || !senderPublicKey
                ? 'cursor-not-allowed bg-[#E5E7EB] text-[#6B7280]'
                : 'bg-[#14A800] hover:bg-[#108A00]'
            )}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon('processing')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {!senderPublicKey ? t('connectToSend') : t('sendUsdc')}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
