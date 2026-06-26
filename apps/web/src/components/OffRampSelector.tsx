'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface OffRampSelectorProps {
  account?: string;
  className?: string;
}

interface OffRampConfig {
  provider: 'yellowcard';
  account: string;
  bankName: string;
  bankAccount: string;
  amount: string;
  assetCode?: string;
  memo?: string;
}

interface AnchorInfoResponse {
  transferServer?: string;
  signingKey?: string;
  networkPassphrase?: string;
}

export function OffRampSelector({ account, className }: OffRampSelectorProps) {
  const [provider] = useState<'yellowcard'>('yellowcard');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [anchorInfo, setAnchorInfo] = useState<AnchorInfoResponse | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      provider && bankName.trim() && bankAccount.trim() && amount.trim() && account?.trim()
    );
  }, [account, amount, bankAccount, bankName, provider]);

  const fetchAnchorInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/anchor/yellowcard?action=info');

      if (!response.ok) {
        throw new Error('Unable to fetch anchor configuration');
      }

      const data = (await response.json()) as AnchorInfoResponse;
      setAnchorInfo(data);
      setStatusMessage('Yellow Card anchor info loaded successfully.');
    } catch {
      setStatusMessage('Yellow Card anchor information is not available right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnchorInfo();
  }, [fetchAnchorInfo]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setStatusMessage('Please complete all off-ramp details before submitting.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/anchor/yellowcard?action=withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          amount,
          account: account ?? '',
          bankAccount,
          bankName,
          assetCode: 'USDC',
          memo: `afriwage-${provider}`,
        } satisfies OffRampConfig),
      });

      const result = (await response.json()) as { message?: string; id?: string; status?: string };

      if (!response.ok) {
        throw new Error(result.message ?? 'Unable to start withdrawal');
      }

      setStatusMessage(
        result.id
          ? `Withdrawal request created with ID ${result.id} (${result.status ?? 'pending'}).`
          : 'Withdrawal request submitted successfully.'
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to submit the withdrawal request.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [account, amount, bankAccount, bankName, canSubmit, provider]);

  return (
    <div className={className}>
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#111111]">Off-ramp provider</p>
            <p className="mt-1 text-xs text-[#6B7280]">Yellow Card (NGN to bank account)</p>
          </div>
          <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#A16207]">
            {provider}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="bank-name" className="block text-sm font-semibold text-[#111111]">
              Bank name
            </label>
            <input
              id="bank-name"
              type="text"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#14A800]/50"
              placeholder="e.g. Access Bank"
            />
          </div>

          <div>
            <label htmlFor="bank-account" className="block text-sm font-semibold text-[#111111]">
              Bank account number
            </label>
            <input
              id="bank-account"
              type="text"
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#14A800]/50"
              placeholder="10-digit account number"
            />
          </div>

          <div>
            <label htmlFor="offramp-amount" className="block text-sm font-semibold text-[#111111]">
              NGN amount
            </label>
            <input
              id="offramp-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#14A800]/50"
              placeholder="0.00"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !canSubmit}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280]"
        >
          {isLoading ? 'Preparing withdrawal...' : 'Start Yellow Card withdrawal'}
        </button>

        {anchorInfo && (
          <p className="mt-3 text-xs text-[#6B7280]">
            Anchor endpoint ready: {anchorInfo.transferServer ?? 'Unknown'}
          </p>
        )}

        {statusMessage && (
          <p className="mt-3 text-sm text-[#111111]">{statusMessage}</p>
        )}
      </div>
    </div>
  );
}
