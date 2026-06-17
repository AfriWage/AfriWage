'use client';

import { CheckCircle, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';

type Status = 'idle' | 'loading' | 'success' | 'already-funded' | 'invalid-address' | 'error';

export default function FaucetPage() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = address.trim();
    if (!trimmed.startsWith('G') || trimmed.length !== 56) {
      setStatus('invalid-address');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/fund-testnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmed }),
      });

      const data = await response.json();

      if (response.ok && data.funded) {
        setStatus('success');
      } else if (data.message?.toLowerCase().includes('already')) {
        setStatus('already-funded');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Failed to fund account');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const explorerUrl = `https://stellar.expert/explorer/testnet/account/${address}`;

  return (
    <DashboardShell
      title="Testnet Faucet"
      description="Fund any Stellar testnet address with 10,000 XLM for free. No wallet connection required."
    >
      <div className="mx-auto max-w-lg">
        <SurfaceCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-[#637085]">
                Stellar Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (status !== 'idle' && status !== 'loading') setStatus('idle');
                }}
                placeholder="G... Stellar address"
                disabled={status === 'loading'}
                className="w-full rounded-[18px] border border-[#eadfce] bg-white px-5 py-4 font-mono text-sm text-[#102033] placeholder-[#637085] outline-none transition-colors focus:border-[#1f8f55] focus:ring-1 focus:ring-[#1f8f55] disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !address.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#1f8f55] px-6 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(31,143,85,0.28)] transition-all hover:bg-[#1a7a49] disabled:opacity-60"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Funding...
                </>
              ) : (
                'Fund Account'
              )}
            </button>
          </form>

          {status === 'success' && (
            <div className="mt-5 animate-fade-in rounded-[20px] bg-[#dff3e8] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8f55]" />
                <div>
                  <p className="font-semibold text-[#1a7a49]">
                    ✓ Account funded with 10,000 XLM
                  </p>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[#1f8f55] underline-offset-2 hover:underline"
                  >
                    View on Stellar Explorer
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {status === 'already-funded' && (
            <div className="mt-5 animate-fade-in rounded-[20px] bg-[#fff3e0] p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#e67e22]" />
                <p className="font-semibold text-[#b85a00]">
                  This account has already been funded. Each address can only be funded once.
                </p>
              </div>
            </div>
          )}

          {status === 'invalid-address' && (
            <div className="mt-5 animate-fade-in rounded-[20px] bg-[#fde8e8] p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c45a43]" />
                <p className="font-semibold text-[#c45a43]">
                  Invalid Stellar address. Addresses start with G and are 56 characters long.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-5 animate-fade-in rounded-[20px] bg-[#fde8e8] p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c45a43]" />
                <div>
                  <p className="font-semibold text-[#c45a43]">Error</p>
                  <p className="mt-1 text-sm text-[#c45a43]/80">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>
    </DashboardShell>
  );
}
