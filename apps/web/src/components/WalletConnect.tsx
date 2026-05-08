'use client';

import { AlertCircle, CheckCircle, Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getPublicKey, isConnected, isFreighterInstalled } from '@/lib/freighter';
import { truncatePublicKey } from '@/lib/stellar';
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
    if (!isFreighterInstalled()) {
      setError('Freighter wallet not installed. Download it at freighter.app');
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
          className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-2 text-sm font-bold text-brand-primary transition-all hover:bg-brand-primary/10"
          aria-label="Wallet connected — click to manage"
          aria-expanded={showDropdown}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-primary" />
          {truncatePublicKey(publicKey, 6)}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-3 w-80 animate-fade-in rounded-2xl border border-brand-outline-variant bg-white p-6 shadow-xl shadow-brand-navy/10">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
              Employer Wallet
            </p>
            <div className="mb-6 rounded-xl border border-brand-outline-variant bg-brand-surface p-4">
              <p className="break-all font-mono text-xs font-medium text-brand-navy leading-relaxed">{publicKey}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-brand-outline-variant py-2.5 text-xs font-bold text-brand-secondary transition-all hover:bg-brand-surface"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-brand-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-brand-outline-variant py-2.5 text-xs font-bold text-brand-secondary transition-all hover:bg-brand-surface"
              >
                <ExternalLink className="h-4 w-4" />
                Explorer
              </a>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-xs font-bold text-red-600 transition-all hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </button>
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

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={status === 'connecting'}
        className={cn(
          'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all',
          status === 'connecting'
            ? 'cursor-wait bg-brand-secondary/20 text-brand-secondary'
            : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98]'
        )}
      >
        <Wallet className="h-4 w-4" />
        {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {status === 'error' && error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] font-bold text-red-600 max-w-xs uppercase tracking-tight">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
