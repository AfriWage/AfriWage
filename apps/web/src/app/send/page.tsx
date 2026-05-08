'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StrKey } from '@stellar/stellar-sdk';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { WalletConnect } from '@/components/WalletConnect';
import { sendPayment } from '@/lib/stellar';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SendPage() {
  const router = useRouter();
  const [senderSecret, setSenderSecret] = useState<string | undefined>(undefined);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const [status, setStatus] = useState<FormStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ recipient?: string; amount?: string }>({});

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConnect = useCallback((_pk: string) => { setSenderSecret(undefined); }, []);
  const handleDisconnect = useCallback(() => { setSenderSecret(undefined); }, []);

  const validate = () => {
    const newErrors: { recipient?: string; amount?: string } = {};
    if (!recipient) {
      newErrors.recipient = 'Recipient address is required';
    } else if (!StrKey.isValidEd25519PublicKey(recipient)) {
      newErrors.recipient = 'Invalid Stellar address format';
    }
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(amount) < 0.01) {
      newErrors.amount = 'Minimum amount is 0.01';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!senderSecret) {
      setErrorMessage('Please connect your wallet before sending a payment.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setTxHash(null);

    try {
      const result = await sendPayment(senderSecret, recipient, amount, memo || undefined);
      setTxHash(result.hash);
      setStatus('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Payment failed. Please check your balance and try again.'
      );
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setTxHash(null);
    setErrorMessage(null);
    setRecipient('');
    setAmount('');
    setMemo('');
    setErrors({});
  };

  // Estimated NGN equivalent (mock conversion at ~825 NGN/USD)
  const ngnEstimate = amount ? (parseFloat(amount) * 825).toLocaleString('en-NG') : '0';

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body text-body flex">
      <Sidebar />

      <main className="ml-64 flex-grow flex items-center justify-center py-12 px-4">
        {status === 'success' && txHash ? (
          /* ── Success State ── */
          <div className="w-full max-w-[560px] animate-fade-in">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-margin shadow-sm">
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="font-h3 text-h3 text-on-surface">Payment Successful</h2>
                  <p className="font-body-sm text-body-sm text-secondary mt-2">
                    Your USDC has been delivered instantly.
                  </p>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-outline-variant p-4 mb-6">
                <p className="font-body-sm text-body-sm text-secondary mb-1">Transaction ID</p>
                <p className="font-label-mono text-label-mono text-on-surface break-all">{txHash}</p>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant py-3 font-body-sm text-body-sm text-secondary transition-all hover:bg-surface-container"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Stellar Expert
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full bg-primary-container text-on-primary rounded-lg py-3 font-bold transition-transform hover:scale-[0.98]"
                >
                  Send New Payment
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Send Form ── */
          <div className="w-full max-w-[560px]">
            <header className="flex items-center mb-8">
              <button
                type="button"
                aria-label="Go back"
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-secondary"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="font-h3 text-h3 text-on-surface ml-4">Send Payment</h1>
              <div className="ml-auto">
                <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-margin shadow-sm flex flex-col gap-margin hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300"
              noValidate
            >
              {/* Step 1: Recipient */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="recipient">
                    Step 1: Recipient
                  </label>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">person</span>
                  <input
                    id="recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Stellar address or federated ID"
                    className={`w-full h-[48px] pl-10 pr-4 rounded-lg border bg-surface-container-lowest font-label-mono text-label-mono text-on-surface placeholder:text-secondary-fixed-dim transition-all outline-none focus:border-2 focus:border-primary-container ${
                      errors.recipient ? 'border-error' : 'border-outline-variant'
                    }`}
                  />
                </div>
                {errors.recipient && (
                  <p className="flex items-center gap-1.5 mt-1 text-xs text-error">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.recipient}
                  </p>
                )}
              </section>

              {/* Step 2: Amount */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="amount">
                    Step 2: Amount
                  </label>
                  <span className="font-body-sm text-body-sm text-secondary">Balance: 1,240.50 USDC</span>
                </div>
                <div className="relative">
                  <input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full h-[64px] pl-4 pr-24 rounded-lg border bg-surface-container-lowest font-h2 text-h2 text-on-surface text-right transition-all outline-none focus:border-2 focus:border-primary-container ${
                      errors.amount ? 'border-error' : 'border-outline-variant'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-surface px-3 py-1.5 rounded border border-outline-variant shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
                      $
                    </div>
                    <span className="font-label-mono text-label-mono text-on-surface">USDC</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="flex items-center gap-1.5 mt-1 text-xs text-error">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.amount}
                  </p>
                )}
                {amount && !errors.amount && (
                  <div className="mt-3 flex justify-end items-center text-secondary gap-1">
                    <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                    <span className="font-label-mono text-label-mono">≈ NGN {ngnEstimate}</span>
                  </div>
                )}
              </section>

              {/* Step 3: Summary */}
              <section className="bg-surface rounded-lg border border-outline-variant p-gutter flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-container" />
                <h3 className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Step 3: Summary
                </h3>
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-body-sm text-secondary">To</span>
                  <span className="font-label-mono text-label-mono text-on-surface">
                    {recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : '—'}
                  </span>
                </div>
                <div className="h-px w-full bg-outline-variant opacity-30" />
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-body-sm text-secondary">Amount</span>
                  <span className="font-label-mono text-label-mono text-on-surface font-bold text-[15px]">
                    {amount || '0.00'} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="font-body-sm text-body-sm text-secondary">Network Fee</span>
                    <span
                      className="material-symbols-outlined text-[14px] text-secondary cursor-help"
                      title="Standard Stellar Network Fee"
                    >
                      info
                    </span>
                  </div>
                  <span className="font-label-mono text-label-mono text-secondary">0.00001 XLM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-body-sm text-secondary">Estimated Delivery</span>
                  <span className="font-body-sm text-body-sm text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Instant
                  </span>
                </div>
              </section>

              {/* Error message */}
              {status === 'error' && errorMessage && (
                <div className="flex items-start gap-3 rounded-lg border border-error-container bg-error-container/30 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-error" />
                  <p className="font-body-sm text-body-sm text-error">{errorMessage}</p>
                </div>
              )}

              {/* Memo (optional) */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-2" htmlFor="memo">
                  Memo (Optional)
                </label>
                <input
                  id="memo"
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Payment reference..."
                  maxLength={28}
                  className="w-full h-[48px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest font-body text-body text-on-surface focus:ring-0 focus:border-2 focus:border-primary-container outline-none transition-all"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-primary-container text-on-primary py-3 px-6 rounded-lg font-body text-body font-semibold hover:bg-primary hover:shadow-md transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Send</span>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
