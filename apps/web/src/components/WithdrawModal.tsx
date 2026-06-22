'use client';

import { signTransaction } from '@/lib/freighter';
import { cn } from '@/lib/utils';
import {
  type AnchorConfig,
  type FiatCurrency,
  type Sep24Info,
  authenticateWithAnchor,
  discoverOffRampAnchor,
  initiateWithdrawal,
} from '@AfriWage/sdk';
import { AlertCircle, ArrowDownToLine, CheckCircle2, ExternalLink, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type WithdrawStep = 'currency' | 'amount' | 'processing' | 'interactive' | 'success' | 'error';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  publicKey: string;
  usdcBalance?: string;
  network?: 'testnet' | 'mainnet';
}

const CURRENCIES: { code: FiatCurrency; label: string; flag: string }[] = [
  { code: 'NGN', label: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'GHS', label: 'Ghanaian Cedi', flag: '🇬🇭' },
];

export function WithdrawModal({
  open,
  onClose,
  publicKey,
  usdcBalance = '0',
  network = 'testnet',
}: WithdrawModalProps) {
  const [step, setStep] = useState<WithdrawStep>('currency');
  const [currency, setCurrency] = useState<FiatCurrency | null>(null);
  const [amount, setAmount] = useState('');
  const [anchor, setAnchor] = useState<AnchorConfig | null>(null);
  const [sep24Info, setSep24Info] = useState<Sep24Info | null>(null);
  const [interactiveUrl, setInteractiveUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setStep('currency');
    setCurrency(null);
    setAmount('');
    setAnchor(null);
    setSep24Info(null);
    setInteractiveUrl(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleCurrencySelect = async (selected: FiatCurrency) => {
    setCurrency(selected);
    setStep('amount');
    setIsLoading(true);
    setError(null);

    try {
      const { anchor: discovered, info } = await discoverOffRampAnchor(selected, network);
      setAnchor(discovered);
      setSep24Info(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover anchor');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currency || !anchor || !amount) return;

    setStep('processing');
    setError(null);

    try {
      const authToken = await authenticateWithAnchor(
        anchor.webAuthEndpoint,
        publicKey,
        signTransaction
      );

      const result = await initiateWithdrawal({
        transferServer: anchor.transferServerSep24,
        authToken,
        assetCode: 'USDC',
        account: publicKey,
        amount,
        destinationAsset: currency,
      });

      setInteractiveUrl(result.url);
      setStep('interactive');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
      setStep('error');
    }
  };

  if (!open) return null;

  const usdcWithdrawEnabled = sep24Info?.withdraw?.USDC?.enabled ?? true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close withdraw modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-modal-title"
        className="relative w-full max-w-md rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-2xl dark:border-[#1e1e3a] dark:bg-[#16163a]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f8f55]/10">
              <ArrowDownToLine className="h-5 w-5 text-[#1f8f55]" />
            </div>
            <div>
              <h2
                id="withdraw-modal-title"
                className="text-lg font-bold text-[#102033] dark:text-white"
              >
                Withdraw to Bank
              </h2>
              <p className="text-sm text-[#637085] dark:text-[#8888aa]">
                Off-ramp USDC to local fiat via Stellar anchor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#637085] transition-colors hover:bg-[#f3ecdf] dark:hover:bg-[#2a2a5a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          {step === 'currency' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#415065] dark:text-[#c0c0d8]">
                Select destination currency
              </p>
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCurrencySelect(c.code)}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#eadfce] bg-[#fffaf2] px-4 py-4 text-left transition-colors hover:border-[#1f8f55]/40 hover:bg-[#f0fdf4] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:hover:border-[#1f8f55]/40"
                >
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <p className="font-semibold text-[#102033] dark:text-white">{c.code}</p>
                    <p className="text-sm text-[#637085] dark:text-[#8888aa]">{c.label}</p>
                  </div>
                </button>
              ))}
              <p className="text-xs text-[#8c7760] dark:text-[#666688]">
                Powered by Yellow Card anchor integration (SEP-24)
              </p>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[#637085]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Discovering anchor via stellar.toml…
                </div>
              ) : (
                <>
                  {anchor && (
                    <div className="rounded-xl border border-[#dff3e8] bg-[#f0fdf4] px-4 py-3 text-sm dark:border-[#1f8f55]/30 dark:bg-[#1f8f55]/10">
                      <p className="font-semibold text-[#1f8f55]">
                        {anchor.orgName ?? anchor.domain}
                      </p>
                      <p className="mt-1 text-xs text-[#637085] dark:text-[#8888aa]">
                        SEP-24: {anchor.transferServerSep24}
                      </p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="withdraw-amount"
                      className="text-sm font-medium text-[#415065] dark:text-[#c0c0d8]"
                    >
                      USDC amount to withdraw
                    </label>
                    <input
                      id="withdraw-amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-2 w-full rounded-xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-lg font-semibold text-[#102033] outline-none focus:border-[#1f8f55] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-white"
                    />
                    <p className="mt-1 text-xs text-[#8c7760]">Available: {usdcBalance} USDC</p>
                  </div>

                  {!usdcWithdrawEnabled && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      USDC withdrawal may not be enabled on this anchor for testnet.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={!amount || Number.parseFloat(amount) <= 0}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors',
                      amount && Number.parseFloat(amount) > 0
                        ? 'bg-[#1f8f55] hover:bg-[#14A800]'
                        : 'cursor-not-allowed bg-[#1f8f55]/50'
                    )}
                  >
                    Continue to {currency} withdrawal
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1f8f55]" />
              <p className="font-medium text-[#102033] dark:text-white">
                Authenticating and starting withdrawal…
              </p>
              <p className="text-sm text-[#637085] dark:text-[#8888aa]">
                Signing SEP-10 challenge with your wallet
              </p>
            </div>
          )}

          {step === 'interactive' && interactiveUrl && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#1f8f55]" />
              <p className="font-semibold text-[#102033] dark:text-white">
                Complete withdrawal in anchor window
              </p>
              <p className="text-sm text-[#637085] dark:text-[#8888aa]">
                A new tab opened with the anchor&apos;s hosted flow. Enter your bank details to
                receive {currency}.
              </p>
              <a
                href={interactiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f8f55] px-6 py-3 text-sm font-semibold text-white hover:bg-[#14A800]"
              >
                Re-open anchor window
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="block w-full text-sm font-medium text-[#637085] hover:text-[#102033] dark:hover:text-white"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && error && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl border border-[#d8cebe] bg-[#fffaf2] px-4 py-3 text-sm font-semibold text-[#415065] hover:bg-[#f3ecdf] dark:border-[#1e1e3a] dark:bg-[#0f0f24] dark:text-[#c0c0d8]"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
