'use client';

import { AlertCircle, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import { sendPayment } from '@/lib/stellar';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

function isValidStellarPublicKey(value: string) {
  return /^G[A-Z2-7]{55}$/.test(value.trim());
}

export default function SendPage() {
  const [senderSecret, setSenderSecret] = useState<string | undefined>(undefined);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ recipient?: string; amount?: string }>({});

  const handleConnect = useCallback(() => {
    setSenderSecret(undefined);
  }, []);

  const handleDisconnect = useCallback(() => {
    setSenderSecret(undefined);
  }, []);

  const validate = () => {
    const nextErrors: { recipient?: string; amount?: string } = {};

    if (!recipient) {
      nextErrors.recipient = 'Recipient address is required.';
    } else if (!isValidStellarPublicKey(recipient)) {
      nextErrors.recipient = 'Enter a valid Stellar public key.';
    }

    if (!amount) {
      nextErrors.amount = 'Amount is required.';
    } else if (Number.parseFloat(amount) < 0.01) {
      nextErrors.amount = 'Minimum amount is 0.01.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    if (!senderSecret) {
      setStatus('error');
      setErrorMessage('Please connect a payout wallet before sending.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setTxHash(null);

    try {
      const result = await sendPayment(senderSecret, recipient, amount, memo || undefined);
      setTxHash(result.hash);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed.');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setTxHash(null);
    setErrorMessage(null);
    setRecipient('');
    setAmount('');
    setMemo('');
    setErrors({});
  };

  const ngnEstimate = amount ? (Number.parseFloat(amount) * 1580).toLocaleString('en-NG') : '0';

  return (
    <DashboardShell
      title="Send Payout"
      description="A guided payment flow optimized for fast operator decisions on both desktop and mobile."
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      {status === 'success' && txHash ? (
        <div className="mx-auto max-w-2xl">
          <SurfaceCard className="bg-[linear-gradient(135deg,#fffdf8_0%,#fff7ec_100%)]">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#dff3e8] text-[#1f8f55]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold text-[#102033]">Payout submitted</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#637085]">
                The success state is intentionally simple: hash, explorer link, and one clear path back into the workflow.
              </p>
            </div>

            <div className="mt-8 rounded-[24px] border border-[#e7dccb] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Transaction hash</p>
              <p className="mt-3 break-all font-mono text-sm text-[#102033]">{txHash}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#e7dccb] bg-white px-4 py-3 font-semibold text-[#102033]"
              >
                View on explorer
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-[18px] bg-[#1f8f55] px-4 py-3 font-semibold text-white"
              >
                Send another payout
              </button>
            </div>
          </SurfaceCard>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <SurfaceCard>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Recipient</p>
                <input
                  type="text"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="G... Stellar wallet"
                  className="mt-3 h-14 w-full rounded-[20px] border border-[#e7dccb] bg-[#fffaf2] px-4 font-mono text-sm text-[#102033] outline-none focus:border-[#1f8f55]"
                />
                {errors.recipient && <p className="mt-2 text-sm text-[#c45a43]">{errors.recipient}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Amount</p>
                  <input
                    type="text"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    className="mt-3 h-14 w-full rounded-[20px] border border-[#e7dccb] bg-[#fffaf2] px-4 text-lg font-semibold text-[#102033] outline-none focus:border-[#1f8f55]"
                  />
                  {errors.amount && <p className="mt-2 text-sm text-[#c45a43]">{errors.amount}</p>}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Asset</p>
                  <div className="mt-3 flex h-14 items-center justify-center rounded-[20px] border border-[#e7dccb] bg-white font-mono text-sm text-[#102033]">
                    USDC
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Memo</p>
                <input
                  type="text"
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="Optional payment note"
                  maxLength={28}
                  className="mt-3 h-14 w-full rounded-[20px] border border-[#e7dccb] bg-[#fffaf2] px-4 text-sm text-[#102033] outline-none focus:border-[#1f8f55]"
                />
              </div>

              {status === 'error' && errorMessage && (
                <div className="flex items-start gap-3 rounded-[20px] border border-[#f0cfbf] bg-[#fff2ec] p-4 text-sm text-[#c45a43]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#1f8f55] px-4 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(31,143,85,0.22)] disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending payout
                  </>
                ) : (
                  'Confirm payout'
                )}
              </button>
            </form>
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="bg-[#fff8ef]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Payment summary</p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#637085]">Recipient</span>
                  <span className="font-mono text-[#102033]">
                    {recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#637085]">Amount</span>
                  <span className="font-mono text-[#102033]">{amount || '0.00'} USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#637085]">Estimated NGN value</span>
                  <span className="font-mono text-[#102033]">NGN {ngnEstimate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#637085]">Network fee</span>
                  <span className="font-mono text-[#102033]">0.00001 XLM</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#1f8f55]" />
                <div>
                  <p className="font-semibold text-[#102033]">Operator-first flow</p>
                  <p className="mt-2 text-sm leading-6 text-[#637085]">
                    The redesigned send screen keeps validation, summary, and wallet status in one place instead of splitting the decision across several screens.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
