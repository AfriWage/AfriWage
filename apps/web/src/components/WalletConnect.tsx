'use client';

import { AlertCircle, CheckCircle, Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getPublicKey, isConnected, isFreighterInstalled } from '@/lib/freighter';
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

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isFreighterInstalled()) return;
      try {
        const connected = await isConnected();
        if (connected) {
          const key = await getPublicKey();
          setPublicKey(key);
          setStatus('connected');
          onConnect?.(key);
        }
      } catch {
        // Silently fail — user hasn't connected yet
      }
    };
    checkConnection();
  }, [onConnect]);

  const handleConnect = useCallback(async () => {
    // Check if Freighter is installed
    if (!isFreighterInstalled()) {
      setError('Freighter wallet not detected. Please install Freighter to continue.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const key = await getPublicKey();
      setPublicKey(key);
      setStatus('connected');
      onConnect?.(key);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      setStatus('error');
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

  if (status === 'connected' && publicKey) {
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setShowDropdown((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-all hover:border-green-500/50 hover:bg-green-500/20"
          aria-label="Wallet connected — click to manage"
          aria-expanded={showDropdown}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          {truncatePublicKey(publicKey, 6)}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-fade-in rounded-2xl border border-white/10 bg-stellar-blue/95 p-4 shadow-card-hover backdrop-blur-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              Connected Wallet
            </p>
            <div className="mb-4 rounded-xl bg-white/5 p-3">
              <p className="break-all font-mono text-xs text-slate-300">{publicKey}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={copied ? 'Copied!' : 'Copy address'}
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="View on Stellar Explorer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Explorer
              </a>

              <button
                type="button"
                onClick={handleDisconnect}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                aria-label="Disconnect wallet"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Click-outside overlay */}
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

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={status === 'connecting'}
        className={cn(
          'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200',
          status === 'connecting'
            ? 'cursor-wait bg-[#14A800]/70 text-white'
            : 'bg-[#14A800] text-white hover:bg-[#108A00]'
        )}
        aria-label="Connect Freighter wallet"
      >
        <Wallet className="h-4 w-4" />
        {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {status === 'error' && error && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 max-w-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes('not detected') && (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-red-200 underline"
            >
              Install Freighter
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
