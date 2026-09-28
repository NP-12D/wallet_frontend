// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { walletApi } from '@/services/api';
import { Wallet, AnalyticsData } from '@/types/wallet';
import BalanceCard from '@/components/BalanceCard';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
};

export default function DashboardPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setError(null);
        const [walletRes, analyticsRes] = await Promise.all([
          walletApi.getWallet(),
          walletApi.getAnalytics(),
        ]);
        setWallet(walletRes);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-zinc-500 text-sm font-medium animate-pulse tracking-wide">
        Loading wallet info...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const topTransactions = analytics?.topTransactions ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-zinc-100 font-sans">
      <div className="flex flex-col gap-1 border-b border-zinc-800 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Wallet
        </div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Your money, in view.
        </h1>
        <p className="text-sm text-zinc-400">
          Manage your balance and review recent account activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BalanceCard wallet={wallet} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500">This month</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              {analytics?.month || 'Current'}
            </span>
          </div>

          <div className="space-y-5 my-6">
            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Income</div>
              <div className="text-2xl font-semibold text-white mt-1">
                +{formatCurrency(analytics?.totalIncome || 0)}
              </div>
            </div>

            <div className="w-full h-px bg-zinc-900/80" />

            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Spent</div>
              <div className="text-2xl font-semibold text-zinc-300 mt-1">
                -{formatCurrency(analytics?.totalSpent || 0)}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
            <span>Transactions processed</span>
            <span className="font-mono text-zinc-300 font-semibold">{analytics?.transactionCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 transition-colors hover:border-zinc-700">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500">Latest activity</span>
          <h3 className="text-sm font-semibold text-white">
            Recent transactions
          </h3>
        </div>

        {topTransactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            No recent transactions found.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {topTransactions.map((tx) => (
              <div
                key={tx.transactionId}
                className="py-3.5 px-3 -mx-3 rounded-lg flex items-center justify-between hover:bg-zinc-950 transition-colors"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-zinc-200">
                    {tx.description}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-zinc-400">{tx.category}</span>
                  </div>
                </div>

                <div
                  className={`font-semibold font-mono text-sm ${
                    tx.type === 'INCOME' ? 'text-white' : 'text-zinc-300'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
