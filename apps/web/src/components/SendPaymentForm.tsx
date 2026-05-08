'use client';

import { StrKey } from '@stellar/stellar-sdk';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { sendPayment } from '@/lib/stellar';
import { cn } from '@/lib/utils';

interface SendPaymentFormProps {
  senderSecret?: string;
  senderPublicKey?: string;
  className?: string;
}

interface FormValues {
  recipientPublicKey: string;
  amount: string;
  memo: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function SendPaymentForm({ senderSecret, className }: SendPaymentFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      recipientPublicKey: '',
      amount: '',
      memo: '',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!senderSecret) {
        setErrorMessage('Please connect your wallet before sending a payment.');
        setStatus('error');
        return;
      }

      setStatus('loading');
      setErrorMessage(null);
      setTxHash(null);

      try {
        const result = await sendPayment(
          senderSecret,
          data.recipientPublicKey,
          data.amount,
          data.memo || undefined
        );

        setTxHash(result.hash);
        setStatus('success');
        reset();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Payment failed. Please check your balance and try again.';
        setErrorMessage(message);
        setStatus('error');
      }
    },
    [senderSecret, reset]
  );

  const handleReset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setErrorMessage(null);
  }, []);

  return (
    <div className={cn('tonal-card rounded-2xl p-8', className)}>
      {status === 'success' && txHash ? (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-10 w-10 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">Payment Successful</h3>
            <p className="mt-2 text-sm text-brand-secondary">
              Your USDC has been delivered instantly.
            </p>
          </div>

          <div className="rounded-xl border border-brand-outline-variant bg-brand-surface p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
              Transaction ID
            </p>
            <p className="break-all font-mono text-xs text-brand-navy">{txHash}</p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-brand-outline-variant py-3 text-sm font-semibold text-brand-secondary transition-all hover:bg-brand-surface"
            >
              <ExternalLink className="h-4 w-4" />
              View on Stellar Expert
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl bg-brand-primary py-3 text-sm font-bold text-white transition-all hover:bg-brand-primary/90"
            >
              Send New Payment
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Recipient Address */}
          <div className="space-y-2">
            <label
              htmlFor="recipientPublicKey"
              className="text-xs font-bold uppercase tracking-widest text-brand-secondary"
            >
              Recipient Public Key <span className="text-red-500">*</span>
            </label>
            <input
              id="recipientPublicKey"
              type="text"
              placeholder="G... Stellar address"
              className={cn(
                'w-full rounded-xl border bg-brand-surface px-4 py-4 font-mono text-sm text-brand-navy placeholder-brand-secondary/50 transition-all focus:border-brand-primary/50 focus:bg-white focus:ring-4 focus:ring-brand-primary/5',
                errors.recipientPublicKey ? 'border-red-500/50' : 'border-brand-outline-variant'
              )}
              {...register('recipientPublicKey', {
                required: 'Recipient address is required',
                validate: (value) =>
                  StrKey.isValidEd25519PublicKey(value) || 'Invalid Stellar address format',
              })}
            />
            {errors.recipientPublicKey && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.recipientPublicKey.message}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Amount */}
            <div className="space-y-2">
              <label
                htmlFor="amount"
                className="text-xs font-bold uppercase tracking-widest text-brand-secondary"
              >
                Amount (USDC) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={cn(
                    'w-full rounded-xl border bg-brand-surface py-4 pl-4 pr-16 text-sm font-bold text-brand-navy placeholder-brand-secondary/50 transition-all focus:border-brand-primary/50 focus:bg-white focus:ring-4 focus:ring-brand-primary/5',
                    errors.amount ? 'border-red-500/50' : 'border-brand-outline-variant'
                  )}
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Min 0.01' },
                  })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-brand-primary">
                  USDC
                </span>
              </div>
              {errors.amount && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <label
                htmlFor="memo"
                className="text-xs font-bold uppercase tracking-widest text-brand-secondary"
              >
                Memo <span className="text-[10px] opacity-50">(Optional)</span>
              </label>
              <input
                id="memo"
                type="text"
                placeholder="Reference"
                maxLength={28}
                className="w-full rounded-xl border border-brand-outline-variant bg-brand-surface px-4 py-4 text-sm text-brand-navy placeholder-brand-secondary/50 transition-all focus:border-brand-primary/50 focus:bg-white focus:ring-4 focus:ring-brand-primary/5"
                {...register('memo', { maxLength: 28 })}
              />
            </div>
          </div>

          {/* Error display */}
          {status === 'error' && errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-xs font-medium text-red-600">{errorMessage}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading' || !senderSecret}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all',
              status === 'loading' || !senderSecret
                ? 'cursor-not-allowed bg-brand-secondary/20 text-brand-secondary'
                : 'bg-brand-primary shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending USDC...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                {!senderSecret ? 'Connect Wallet' : 'Send Payment'}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
