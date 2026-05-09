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

  useEffect(() => {
    const checkConnection = async () => {
      if (!isFreighterInstalled()) return;

      try {
        const connected = await isConnected();
        if (!connected) return;

        const key = await getPublicKey();
        setPublicKey(key);
        setStatus('connected');
        onConnect?.(key);
      } catch {
        // No-op: connection is optional until the user explicitly asks for it.
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
    } catch (connectionError) {
      const message =
        connectionError instanceof Error ? connectionError.message : 'Failed to connect wallet';
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
    if (!success) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [publicKey]);

  if (status === 'connected' && publicKey) {
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setShowDropdown((previous) => !previous)}
          className="flex items-center gap-3 rounded-full border border-[#d8cebe] bg-white px-4 py-2 text-sm font-semibold text-[#102033] shadow-[0_10px_30px_rgba(16,32,51,0.06)] transition-all hover:bg-[#fff8ef]"
          aria-label="Wallet connected - click to manage"
          aria-expanded={showDropdown}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#1f8f55]" />
          {truncatePublicKey(publicKey, 6)}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-3 w-80 animate-fade-in rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-[0_20px_50px_rgba(16,32,51,0.12)]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#8c7760]">
              Employer Wallet
            </p>
            <div className="mb-6 rounded-[20px] border border-[#eadfce] bg-[#fffaf2] p-4">
              <p className="break-all font-mono text-xs font-medium leading-relaxed text-[#102033]">
                {publicKey}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-[18px] border border-[#eadfce] py-2.5 text-xs font-bold text-[#637085] transition-all hover:bg-[#fff8ef]"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-[#1f8f55]" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-[18px] border border-[#eadfce] py-2.5 text-xs font-bold text-[#637085] transition-all hover:bg-[#fff8ef]"
              >
                <ExternalLink className="h-4 w-4" />
                Explorer
              </a>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#f0cfbf] bg-[#fff2ec] py-3 text-xs font-bold text-[#c45a43] transition-all hover:bg-[#ffe9de]"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </button>
          </div>
        )}

        {showDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} aria-hidden="true" />
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
          'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
          status === 'connecting'
            ? 'cursor-wait bg-[#e7dccb] text-[#637085]'
            : 'bg-[#102033] text-white shadow-[0_14px_32px_rgba(16,32,51,0.16)] hover:scale-[1.02] active:scale-[0.98]'
        )}
      >
        <Wallet className="h-4 w-4" />
        {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {status === 'error' && error && (
        <div className="max-w-xs rounded-[18px] border border-[#f0cfbf] bg-[#fff2ec] p-3 text-[10px] font-bold uppercase tracking-tight text-[#c45a43]">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
