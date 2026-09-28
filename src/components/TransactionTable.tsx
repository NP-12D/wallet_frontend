'use client';

import { useMemo, useState } from 'react';
import { Transaction } from '@/types/wallet';

type SortKey = 'description' | 'createdAt' | 'type' | 'category' | 'status' | 'amount';
type SortDirection = 'ascending' | 'descending';
type ColumnFilters = Record<SortKey, string>;

interface TransactionTableProps {
  transactions: Transaction[] | null;
  loading?: boolean;
}

const emptyFilters: ColumnFilters = {
  description: '',
  createdAt: '',
  type: '',
  category: '',
  status: '',
  amount: '',
};

const columns: Array<{ key: SortKey; label: string; align?: 'right' }> = [
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount', align: 'right' },
];

function valueForColumn(transaction: Transaction, key: SortKey) {
  if (key === 'amount') return transaction.amount.toFixed(2);
  if (key === 'createdAt') return new Date(transaction.createdAt).toLocaleDateString();
  return String(transaction[key] ?? '');
}

function isPositive(type: Transaction['type']) {
  return type === 'INCOME';
}

function typeBadge(type: string) {
  return type === 'INCOME'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    : 'border-rose-500/30 bg-rose-500/10 text-rose-400';
}

function statusBadge(status: string) {
  if (status === 'COMPLETED' || status === 'SUCCESS') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  }
  if (status === 'PENDING') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  }
  return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
}

export default function TransactionTable({
  transactions,
  loading = false,
}: TransactionTableProps) {
  const [filters, setFilters] = useState<ColumnFilters>(emptyFilters);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'createdAt',
    direction: 'descending',
  });

  const displayedTransactions = useMemo(() => {
    const matchingTransactions = (transactions ?? []).filter((transaction) =>
      columns.every(({ key }) => {
        const filter = filters[key].trim().toLowerCase();
        return !filter || valueForColumn(transaction, key).toLowerCase().includes(filter);
      }),
    );

    return matchingTransactions.sort((left, right) => {
      const leftValue = valueForColumn(left, sort.key);
      const rightValue = valueForColumn(right, sort.key);
      const comparison =
        sort.key === 'amount' || sort.key === 'createdAt'
          ? Number(sort.key === 'amount' ? left.amount : new Date(left.createdAt)) -
            Number(sort.key === 'amount' ? right.amount : new Date(right.createdAt))
          : leftValue.localeCompare(rightValue, undefined, { numeric: true });
      return sort.direction === 'ascending' ? comparison : -comparison;
    });
  }, [filters, sort, transactions]);

  const updateFilter = (key: SortKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const changeSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
  };

  const filterControl = (key: SortKey, compact = false) => {
    const commonClassName =
      'w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-emerald-500/70';

    if (key === 'type') {
      return (
        <select aria-label="Filter by type" className={commonClassName} value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
      );
    }

    if (key === 'status') {
      return (
        <select aria-label="Filter by status" className={commonClassName} value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        
        </select>
      );
    }

    return (
      <input
        aria-label={`Filter by ${key}`}
        className={commonClassName}
        value={filters[key]}
        onChange={(event) => updateFilter(key, event.target.value)}
        placeholder={compact ? `Filter ${key}` : 'Filter'}
      />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 p-5 font-sans sm:p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded-lg bg-zinc-900" />
        ))}
      </div>
    );
  }

  const emptyState = (
    <div className="space-y-2 p-10 text-center font-sans">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500">
        !
      </div>
      <p className="text-sm font-semibold text-zinc-200">No transactions found</p>
      <p className="text-xs text-zinc-500">Adjust a search or column filter to see more results.</p>
    </div>
  );

  if (!transactions || transactions.length === 0) {
    return emptyState;
  }

  return (
    <div className="font-sans">
      <div className="border-b border-zinc-800 p-3 sm:hidden">
        <details>
          <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Column filters</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {columns.map(({ key, label }) => (
              <label key={key} className="space-y-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {label}
                {filterControl(key, true)}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[820px] text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            <tr>
              {columns.map(({ key, label, align }) => (
                <th key={key} className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''}`}>
                  <button
                    type="button"
                    onClick={() => changeSort(key)}
                    title={sort.key === key ? `Sorted ${sort.direction}` : 'Sort'}
                    className={`inline-flex items-center gap-1.5 transition-colors hover:text-zinc-200 ${align === 'right' ? 'ml-auto' : ''}`}
                  >
                    {label}
                    <span aria-hidden="true" className={sort.key === key ? 'text-emerald-400' : 'text-zinc-700'}>
                      {sort.key === key && sort.direction === 'ascending' ? '^' : 'v'}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
            <tr className="bg-zinc-900/60">
              {columns.map(({ key, align }) => (
                <th key={key} className={`px-3 py-2 ${align === 'right' ? 'text-right' : ''}`}>
                  {filterControl(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {displayedTransactions.map((transaction) => (
              <tr key={transaction.transactionId} className="transition-colors hover:bg-zinc-900/70">
                <td className="px-4 py-4 font-semibold text-white">
                  <div className="max-w-[220px] truncate">{transaction.description || 'Untitled transaction'}</div>
                  <div className="mt-1 font-mono text-[10px] font-normal text-zinc-500">{transaction.transactionId}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-400">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${typeBadge(transaction.type)}`}>
                    {transaction.type}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs font-medium text-zinc-400">{transaction.category || 'General'}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className={`whitespace-nowrap px-4 py-4 text-right font-mono text-sm font-bold ${isPositive(transaction.type) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive(transaction.type) ? '+' : '-'}$${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-zinc-800 sm:hidden">
        {displayedTransactions.map((transaction) => (
          <div key={transaction.transactionId} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{transaction.description || 'Untitled transaction'}</p>
                <p className="mt-1 font-mono text-[10px] text-zinc-500">{transaction.transactionId}</p>
              </div>
              <p className={`shrink-0 font-mono text-sm font-bold ${isPositive(transaction.type) ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive(transaction.type) ? '+' : '-'}$${transaction.amount.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
              <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
              <span>/</span>
              <span>{transaction.category}</span>
              <span className={`rounded-full border px-2 py-0.5 font-semibold ${typeBadge(transaction.type)}`}>{transaction.type}</span>
              <span className={`rounded-full border px-2 py-0.5 font-semibold ${statusBadge(transaction.status)}`}>{transaction.status}</span>
            </div>
          </div>
        ))}
      </div>

      {displayedTransactions.length === 0 && emptyState}
    </div>
  );
}
