'use client';

import { useEffect, useMemo, useState } from 'react';
import { walletApi } from '@/services/api';
import { AnalyticsData, Transaction } from '@/types/wallet';

const currency = (amount: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(Math.abs(amount));

const categoryName = (category: string) =>
  category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

function TrendChart({ transactions }: { transactions: Transaction[] }) {
  const points = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toDateString();
      const dayTransactions = transactions.filter(
        (transaction) => new Date(transaction.createdAt).toDateString() === key,
      );

      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        income: dayTransactions
          .filter((transaction) => transaction.type === 'INCOME')
          .reduce((sum, transaction) => sum + transaction.amount, 0),
        expense: dayTransactions
          .filter((transaction) => transaction.type === 'EXPENSE')
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      };
    });
  }, [transactions]);

  const maxValue = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));
  const chartWidth = 640;
  const chartHeight = 208;
  const padding = { top: 18, right: 14, bottom: 30, left: 14 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const step = (chartWidth - padding.left - padding.right) / (points.length - 1);
  const position = (value: number, index: number) => ({
    x: padding.left + step * index,
    y: padding.top + innerHeight - (value / maxValue) * innerHeight,
  });
  const pathFor = (values: number[]) =>
    values
      .map((value, index) => {
        const { x, y } = position(value, index);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  const incomePath = pathFor(points.map((point) => point.income));
  const expensePath = pathFor(points.map((point) => point.expense));

  return (
    <div className="h-[250px] w-full" role="img" aria-label="Income and spending activity over the last seven days">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((line) => {
          const y = padding.top + innerHeight - innerHeight * line;
          return <line key={line} x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="4 5" />;
        })}
        <path d={incomePath} fill="none" stroke="currentColor" strokeWidth="2.75" className="text-zinc-950 dark:text-zinc-100" strokeLinecap="round" strokeLinejoin="round" />
        <path d={expensePath} fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-500" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" />
        {points.map((point, index) => {
          const income = position(point.income, index);
          return <circle key={point.label} cx={income.x} cy={income.y} r="3.5" className="fill-zinc-950 dark:fill-zinc-100" />;
        })}
        {points.map((point, index) => (
          <text key={point.label} x={position(0, index).x} y={chartHeight - 4} textAnchor="middle" className="fill-zinc-400 text-[10px] font-medium">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ActivityByTypeChart({ transactions }: { transactions: Transaction[] }) {
  const groups = [
    { key: 'topups', label: 'Top ups', note: 'Added funds', className: 'bg-zinc-100 dark:bg-zinc-100', match: (item: Transaction) => item.category === 'TOP_UP' },
    { key: 'received', label: 'Received', note: 'Transfer income', className: 'bg-zinc-700 dark:bg-zinc-300', match: (item: Transaction) => item.category === 'TRANSFER' && item.type === 'INCOME' },
    { key: 'sent', label: 'Sent', note: 'Transfer expense', className: 'bg-zinc-500 dark:bg-zinc-500', match: (item: Transaction) => item.category === 'TRANSFER' && item.type === 'EXPENSE' },
    { key: 'requestReceived', label: 'Request received', note: 'Money requested', className: 'bg-zinc-400 dark:bg-zinc-600', match: (item: Transaction) => item.category === 'MONEY_REQUEST' && item.type === 'INCOME' },
    { key: 'requestPaid', label: 'Request paid', note: 'Request expense', className: 'bg-zinc-600 dark:bg-zinc-400', match: (item: Transaction) => item.category === 'MONEY_REQUEST' && item.type === 'EXPENSE' },
  ].map((group) => ({
    ...group,
    value: transactions.filter(group.match).reduce((sum, item) => sum + item.amount, 0),
  }));
  const maxValue = Math.max(...groups.map((group) => group.value), 1);

  return (
    <div className="mt-6 grid h-76 grid-cols-2 items-end gap-x-5 gap-y-0 border-b border-zinc-800 px-2 pb-0 sm:h-56 sm:grid-cols-5 sm:gap-x-5 sm:px-5" role="img" aria-label="Monthly activity broken down by top ups, transfers, and money requests">
      {groups.map((group) => {
        const height = group.value > 0 ? Math.max((group.value / maxValue) * 100, 6) : 0;
        return (
          <div key={group.key} className="flex h-full flex-col justify-end text-center">
            {group.value > 0 && <span className="mb-2 font-mono text-xs font-semibold text-zinc-300">{currency(group.value, true)}</span>}
            <div className="flex flex-1 items-end">
              <div className={`w-full rounded-t-lg ${group.className}`} style={{ height: `${height}%` }} />
            </div>
            <div className="py-3">
              <span className="block text-xs font-medium text-zinc-400">{group.label}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-600">{group.note}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [analyticsData, history] = await Promise.all([
          walletApi.getAnalytics(),
          walletApi.getTransactions({ page: 1, limit: 50 }),
        ]);
        setAnalytics(analyticsData);
        setTransactions(history.data.filter((transaction) => transaction.status === 'COMPLETED'));
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const income = analytics?.totalIncome ?? 0;
  const spent = analytics?.totalSpent ?? 0;
  const netSavings = income - spent;
  const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;
  const monthTransactions = useMemo(() => {
    if (!analytics?.month) return transactions;
    return transactions.filter((transaction) =>
      transaction.createdAt.startsWith(analytics.month),
    );
  }, [analytics?.month, transactions]);
  const recentTransactions = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    return transactions.filter((transaction) => new Date(transaction.createdAt) >= sevenDaysAgo);
  }, [transactions]);
  const categories = useMemo(() => {
    const totals = monthTransactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .reduce<Record<string, number>>((result, transaction) => {
        result[transaction.category] = (result[transaction.category] ?? 0) + transaction.amount;
        return result;
      }, {});
    return Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 4);
  }, [monthTransactions]);
  const largestCategory = categories[0]?.[1] ?? 0;

  if (loading) {
    return (
      <div className="max-w-6xl space-y-6 animate-pulse">
        <div className="h-20 w-full max-w-md rounded-lg bg-zinc-900" />
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-lg bg-zinc-900" />)}</div>
        <div className="h-80 rounded-lg bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans text-zinc-100">
      <header className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /> Financial intelligence
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">See the story behind your balance.</h1>
          <p className="mt-1.5 text-sm text-zinc-400">Cash flow, spending patterns, and the activity that shapes {analytics?.month ?? 'this month'}.</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Completed transactions</div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-zinc-200">{analytics?.transactionCount ?? 0}</div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Money in', value: `+${currency(income)}`, note: 'Income received this month' },
          { label: 'Money out', value: `−${currency(spent)}`, note: 'Completed expenses this month' },
          { label: 'Net cash flow', value: `${netSavings >= 0 ? '+' : '−'}${currency(netSavings)}`, note: netSavings >= 0 ? 'More came in than went out' : 'Spending exceeded income' },
          { label: 'Savings rate', value: `${savingsRate}%`, note: income > 0 ? 'Of monthly income retained' : 'Add income to calculate' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{card.label}</div>
            <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-white">{card.value}</div>
            <p className="mt-2 text-xs text-zinc-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Cash-flow pulse</div>
              <h2 className="mt-1 text-base font-semibold text-white">Last 7 days</h2>
            </div>
            <div className="flex gap-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-zinc-100" />Income</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 border-t-2 border-dashed border-zinc-400" />Spent</span>
            </div>
          </div>
          <TrendChart transactions={transactions} />
          <div className="grid grid-cols-2 border-t border-zinc-800 pt-4 text-xs">
            <div><span className="text-zinc-500">Highest inflow</span><div className="mt-1 font-mono font-semibold text-zinc-200">{currency(Math.max(0, ...recentTransactions.filter((item) => item.type === 'INCOME').map((item) => item.amount)), true)}</div></div>
            <div className="border-l border-zinc-800 pl-4"><span className="text-zinc-500">Largest outflow</span><div className="mt-1 font-mono font-semibold text-zinc-200">{currency(Math.max(0, ...recentTransactions.filter((item) => item.type === 'EXPENSE').map((item) => item.amount)), true)}</div></div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Where money goes</div>
          <h2 className="mt-1 text-base font-semibold text-white">Expense mix</h2>
          <div className="mt-6 space-y-5">
            {categories.length > 0 ? categories.map(([category, amount]) => {
              const share = spent > 0 ? Math.round((amount / spent) * 100) : 0;
              const width = largestCategory > 0 ? (amount / largestCategory) * 100 : 0;
              return (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-zinc-300">{categoryName(category)}</span><span className="font-mono text-zinc-500">{currency(amount)} · {share}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-zinc-950 dark:bg-zinc-100" style={{ width: `${width}%` }} /></div>
                </div>
              );
            }) : <div className="py-10 text-center text-sm text-zinc-500">No completed expenses yet.</div>}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Monthly activity</div>
            <h2 className="mt-1 text-base font-semibold text-white">How money moved</h2>
          </div>
          <span className="text-xs text-zinc-500">{analytics?.month ?? 'This month'}</span>
        </div>
        <ActivityByTypeChart transactions={monthTransactions} />
        {income === 0 && spent === 0 && <p className="pt-4 text-center text-sm text-zinc-500">Complete a top up or transfer to see your monthly activity here.</p>}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div><div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Largest movements</div><h2 className="mt-1 text-base font-semibold text-white">Transactions worth reviewing</h2></div>
          <span className="hidden text-xs text-zinc-500 sm:block">Sorted by amount</span>
        </div>
        <div className="divide-y divide-zinc-800">
          {analytics?.topTransactions?.length ? analytics.topTransactions.map((transaction) => (
            <div key={transaction.transactionId} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0"><div className="truncate text-sm font-medium text-zinc-200">{transaction.description || categoryName(transaction.category)}</div><div className="mt-1 text-xs text-zinc-500">{categoryName(transaction.category)} · {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div></div>
              <div className="shrink-0 text-right"><div className="font-mono text-sm font-semibold text-white">{transaction.type === 'INCOME' ? '+' : '−'}{currency(transaction.amount)}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{transaction.type === 'INCOME' ? 'Income' : 'Expense'}</div></div>
            </div>
          )) : <div className="px-6 py-12 text-center text-sm text-zinc-500">No transactions recorded for this month.</div>}
        </div>
      </section>
    </div>
  );
}
