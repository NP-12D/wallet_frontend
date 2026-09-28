'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TransactionTable from '@/components/TransactionTable';
import { walletApi } from '@/services/api';
import { Transaction } from '@/types/wallet';

const ignoredSearchWords = new Set(['and', '&']);

function getSearchTokens(query: string) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term && !ignoredSearchWords.has(term));
}

function searchableTransaction(transaction: Transaction) {
  return [
    transaction.transactionId,
    transaction.description,
    transaction.type,
    transaction.category,
    transaction.status,
    transaction.amount.toFixed(2),
    transaction.createdAt,
    new Date(transaction.createdAt).toLocaleDateString(),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await walletApi.getTransactions({
        page: currentPage,
        limit: pageSize,
        ...(filterType !== 'ALL' ? { type: filterType } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
        ...(searchQuery.trim() ? { search: searchQuery } : {}),
      });

      const data = response?.data ?? [];
      setTransactions(data);
      setTotalRecords(response?.pagination?.total ?? data.length);
    } catch (caughtError) {
      setTransactions([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to load transaction history.',
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, fromDate, pageSize, searchQuery, toDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const searchedTransactions = useMemo(() => {
    const searchTerms = getSearchTokens(searchQuery);
    if (!transactions || searchTerms.length === 0) return transactions ?? [];

    return transactions.filter((transaction) => {
      const text = searchableTransaction(transaction);
      return searchTerms.every((term) => text.includes(term));
    });
  }, [searchQuery, transactions]);

  const setTypeFilter = (type: 'ALL' | 'INCOME' | 'EXPENSE') => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await walletApi.exportTransactions({
        ...(filterType !== 'ALL' ? { type: filterType } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
        ...(searchQuery.trim() ? { search: searchQuery } : {}),
      });
      const file = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? 'wallet-transactions.csv';

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to export transactions.',
      );
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const activeFilterCount = [filterType !== 'ALL', Boolean(fromDate), Boolean(toDate), Boolean(searchQuery.trim())]
    .filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 font-sans text-zinc-100 sm:space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">Ledger</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-zinc-500">Review activity, refine the ledger, and export your records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="transaction-filters"
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? 'border-zinc-700 bg-zinc-900 text-zinc-100'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10m-7 6h4" />
            </svg>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || searchedTransactions.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <svg aria-hidden="true" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4m-3 7v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" />
            </svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            title="Refresh transactions"
            aria-label="Refresh transactions"
            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:opacity-50"
          >
            <svg aria-hidden="true" className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.6m14.8 2A8 8 0 0 0 4.6 9m0 0H9m11 11v-5h-.6A8 8 0 0 1 4 13" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-800/50 bg-rose-950/30 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {filtersOpen && (
        <section id="transaction-filters" className="border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-zinc-500">Type</span>
              {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={
                    filterType === type
                      ? 'rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400'
                      : 'rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-200'
                  }
                >
                  {type === 'ALL' ? 'All' : type}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-500">
                From
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-zinc-200 outline-none"
                />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-500">
                To
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => {
                    setToDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-zinc-200 outline-none"
                />
              </label>
              {(fromDate || toDate) && (
                <button type="button" onClick={clearDateFilters} className="px-2 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-200">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-4 border-t border-zinc-800 pt-4">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search transaction ID, description, type, category, status, or amount"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/70"
            />
          </div>
        </section>
      )}

      <section className="overflow-hidden border border-zinc-800 bg-zinc-900/70">
        <TransactionTable transactions={searchedTransactions} loading={loading} />

        {!loading && searchedTransactions.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/50 p-4 text-xs text-zinc-500 sm:flex-row">
            <label className="flex items-center gap-2">
              Rows
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-300 outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <span>
              Page <strong className="font-semibold text-zinc-200">{currentPage}</strong> of{' '}
              <strong className="font-semibold text-zinc-200">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-semibold text-zinc-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-semibold text-zinc-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
