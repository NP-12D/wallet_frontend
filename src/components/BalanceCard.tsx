// components/BalanceCard.tsx
'use client';

import { useState } from 'react';
import { Wallet } from '@/types/wallet';
import Link from 'next/link';

interface BalanceCardProps {
  wallet: Wallet | null;
  loading?: boolean;
}

export default function BalanceCard({ wallet, loading = false }: BalanceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (wallet?.walletId) {
      navigator.clipboard.writeText(wallet.walletId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Animated Skeleton Loading State
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 p-6 sm:p-7 md:p-8 animate-pulse space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-zinc-800 rounded" />
            <div className="h-10 w-44 bg-zinc-800 rounded-xl" />
          </div>
          <div className="h-6 w-24 bg-zinc-800 rounded-full" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-16 bg-zinc-800 rounded" />
          <div className="h-10 w-full bg-zinc-800 rounded-xl" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-11 flex-1 bg-zinc-800 rounded-xl" />
          <div className="h-11 flex-1 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const balanceFormatted = wallet
    ? wallet.balance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-4 font-sans text-zinc-100 transition-colors hover:border-zinc-700 sm:p-7 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-start sm:gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Available balance
          </span>
          <h2 className="mt-1 truncate text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
            ${balanceFormatted}
          </h2>
        </div>

        <div className="self-start">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-950 text-zinc-300 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            Active
          </span>
        </div>
      </div>

      <div className="mb-5 space-y-1.5 sm:mb-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Wallet ID</div>
        <div className="flex items-center gap-2 max-w-full">
          <div className="min-w-0 max-w-full truncate rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2.5 font-mono text-[11px] text-zinc-300 select-all sm:px-3.5 sm:text-xs">
            {wallet?.walletId || '────────────────────────'}
          </div>

          {wallet?.walletId && (
            <button
              type="button"
              onClick={handleCopyId}
              className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:scale-95 sm:px-3.5 sm:text-xs"
              title="Copy Wallet ID"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <Link
          href="/topup"
          className="flex-1 text-center py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
        >
          <span>+ Top Up</span>
        </Link>
        <Link
          href="/transfer"
          className="flex-1 text-center py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 active:scale-[0.98] text-zinc-200 border border-zinc-800 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
        >
          <span>Transfer Money</span>
        </Link>
      </div>
    </div>
  );
}
