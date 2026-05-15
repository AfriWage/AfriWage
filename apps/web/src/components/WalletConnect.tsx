'use client';

import { AlertCircle, CheckCircle, Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getConnectedAddress, getPublicKey } from '@/lib/freighter';
import { truncatePublicKey } from '@/lib/stellar-format';
import { cn, copyToClipboard } from '@/lib/utils';
import type { WalletStatus } from '@/types';

interface WalletConnectProps {
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

export function WalletConnect({ onConnect, onDisconnect, className }: WalletConnectProps) {
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Silently restore an existing approved session on mount
  useEffect(() => {
    getConnectedAddress().then((address) => {
      if (address) {
        setPublicKey(address);
        setStatus('connected');
        onConnect?.(address);
      }
    });
  }, [onConnect]);

  const handleConnect = useCallback(async () => {
    setStatus('connecting');
    setError(null);

    try {
      const key = await getPublicKey();
      setPublicKey(key);
      setStatus('connected');
      onConnect?.(key);
    } catch (err) {
      setStatus('error');

      if (err instanceof Error && err.message === 'NOT_INSTALLED') {
        setError('NOT_INSTALLED');
      } else {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setError(msg);
      }
    }
  }, [onConnect]);

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
    setStatus('disconnected');
    setError(null);
    setShowDropdown(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const handleCopy = useCallback(async () => {
    if (!publicKey) return;
    const success = await copyToClipboard(publicKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicKey]);

  // ── Connected state ───────────────────────────────────────────────────────
  if (status === 'connected' && publicKey) {
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setShowDropdown((p) => !p)}
          className="flex items-center gap-2 rounded-lg border border-[#1f8f55]/40 bg-[#1f8f55]/10 px-3 sm:px-4 py-2 text-sm font-semibold text-[#1f8f55] transition-colors hover:bg-[#1f8f55]/20"
          aria-expanded={showDropdown}
        >
          <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-[#1f8f55]" />
          <span className="hidden sm:inline">{truncatePublicKey(publicKey, 6)}</span>
          <Wallet className="h-4 w-4 sm:hidden" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-[100] mt-2 w-[calc(100vw-2rem)] max-w-[20rem] sm:w-72 rounded-xl border border-[#d8cebe] bg-white p-4 shadow-xl origin-top-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8c7760]">
              Connected Wallet
            </p>
            <div className="mt-2 rounded-lg border border-[#efe3d0] bg-[#fffaf2] p-3">
              <p className="break-all font-mono text-xs text-[#102033]">{publicKey}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#efe3d0] bg-[#fffaf2] px-3 py-2 text-xs font-medium text-[#637085] transition-colors hover:bg-[#f3ecdf]"
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-[#1f8f55]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#efe3d0] bg-[#fffaf2] px-3 py-2 text-xs font-medium text-[#637085] transition-colors hover:bg-[#f3ecdf]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Explorer
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        )}

        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // ── Disconnected / error state ────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col items-end gap-3', className)}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={status === 'connecting'}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all',
          status === 'connecting'
            ? 'cursor-wait bg-[#1f8f55]/70 text-white'
            : 'bg-[#1f8f55] text-white hover:bg-[#14A800]'
        )}
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">{status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}</span>
      </button>

      {/* Error banner — always clearly visible */}
      {status === 'error' && error === 'NOT_INSTALLED' && (
        <div className="flex w-72 flex-col gap-3 rounded-xl border border-[#efe3d0] bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c45a43]" />
            <div>
              <p className="text-sm font-semibold text-[#102033]">Freighter not found</p>
              <p className="mt-1 text-xs text-[#637085]">
                Install the Freighter browser extension to connect your Stellar wallet.
              </p>
            </div>
          </div>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#102033] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3048]"
          >
            Install Freighter
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {status === 'error' && error && error !== 'NOT_INSTALLED' && (
        <div className="flex w-72 items-start gap-3 rounded-xl border border-[#efe3d0] bg-white p-4 shadow-lg">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c45a43]" />
          <div>
            <p className="text-sm font-semibold text-[#102033]">Connection failed</p>
            <p className="mt-1 text-xs text-[#637085]">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
