// components/AnalyticsSummary.tsx
'use client';

import { AnalyticsData } from '@/types/wallet';

interface AnalyticsSummaryProps {
  analytics: AnalyticsData | null;
  loading?: boolean;
}

export default function AnalyticsSummary({
  analytics,
  loading = false,
}: AnalyticsSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse font-sans">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 space-y-3"
          >
            <div className="h-3 w-20 bg-zinc-800 rounded" />
            <div className="h-8 w-32 bg-zinc-800 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const income = analytics?.totalIncome || 0;
  const spent = analytics?.totalSpent || 0;
  const netSavings = income - spent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-sans">
      {/* Total Income Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 transition-all hover:border-zinc-700/80 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Income
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 truncate tracking-tight">
            +${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Total Spent Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 transition-all hover:border-zinc-700/80 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Spent
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-500/50" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 truncate tracking-tight">
            -${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Net Savings Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 transition-all hover:border-zinc-700/80 sm:col-span-2 lg:col-span-1 group">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${netSavings >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`} />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Net Savings
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                netSavings >= 0 ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-rose-400 shadow-sm shadow-rose-500/50'
              }`}
            />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-2 truncate tracking-tight ${
              netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netSavings >= 0 ? '+' : ''}$
            {netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
