// app/transfer/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletApi } from '@/services/api';

export default function TransferPage() {
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ receiverEmail?: string; amount?: string; description?: string }>({});

  // Fetch current user wallet balance for context
  const loadBalance = useCallback(async () => {
    setFetchingBalance(true);
    try {
      const res = await walletApi.getWallet();
      const currentBalance = typeof res?.balance === 'number' ? res.balance : Number(res?.balance || 0);
      setBalance(currentBalance);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    } finally {
      setFetchingBalance(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const numAmount = Number(amount);
    const nextErrors: { receiverEmail?: string; amount?: string; description?: string } = {};
    if (!receiverEmail.trim()) nextErrors.receiverEmail = 'Enter the recipient email address.';
    else if (!/^\S+@\S+\.\S+$/.test(receiverEmail)) nextErrors.receiverEmail = 'Enter a valid email address.';
    if (!Number.isFinite(numAmount) || numAmount <= 0) nextErrors.amount = 'Enter an amount greater than $0.';
    else if (balance !== null && numAmount > balance) nextErrors.amount = `Amount exceeds your available balance of $${balance.toFixed(2)}.`;
    if (description.length > 200) nextErrors.description = 'Use 200 characters or fewer.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      await walletApi.transfer({
        receiver_email: receiverEmail,
        amount: numAmount,
        description,
      });

      setStatus({
        type: 'success',
        msg: `Successfully sent $${numAmount.toFixed(2)} to ${receiverEmail}!`,
      });

      setReceiverEmail('');
      setAmount('');
      setDescription('');

      // Refresh balance after transfer completes
      loadBalance();
    } catch (err: any) {
      setStatus({
        type: 'error',
        msg: err?.response?.data?.message || 'Transfer failed. Check recipient email or balance.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleUseMax = () => {
    if (balance !== null) {
      setAmount(balance.toFixed(2));
    }
  };

  const transferAmount = Number(amount);
  const validTransferAmount = Number.isFinite(transferAmount) && transferAmount > 0 ? transferAmount : 0;
  const remainingBalance = balance === null ? null : Math.max(0, balance - validTransferAmount);
  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12 text-zinc-100 font-sans">
      <div className="border-b border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-zinc-500 tracking-wider uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            Peer-to-Peer
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Send Money
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Instant fund transfer to any registered wallet
          </p>
        </div>

      </div>

      {status && (
        <div
          className={`p-4 rounded-lg text-xs sm:text-sm border flex items-start gap-3 transition-all ${
            status.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
              : 'bg-rose-950/30 border-rose-800/50 text-rose-400'
          }`}
        >
          {status.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="flex-1 leading-relaxed">{status.msg}</span>
          <button
            onClick={() => setStatus(null)}
            className="text-zinc-400 hover:text-zinc-200 transition"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:items-start">
        <form
          onSubmit={handleTransfer}
          noValidate
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-6 transition-colors hover:border-zinc-700"
        >
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Recipient Email Address <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <input
              type="email"
              required
              disabled={loading}
              value={receiverEmail}
              onChange={(e) => { setReceiverEmail(e.target.value); setFieldErrors((current) => ({ ...current, receiverEmail: undefined })); }}
              placeholder="user2@example.com"
              aria-invalid={Boolean(fieldErrors.receiverEmail)}
              aria-describedby={fieldErrors.receiverEmail ? 'transfer-email-error' : undefined}
              className={`w-full rounded-lg border bg-zinc-950 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 transition focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${fieldErrors.receiverEmail ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500/50'}`}
            />
          </div>
          {fieldErrors.receiverEmail && <p id="transfer-email-error" className="text-xs text-zinc-400">{fieldErrors.receiverEmail}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-medium text-zinc-300">
              Transfer Amount ($) <span className="text-rose-400">*</span>
            </label>
            {balance !== null && (
              <button
                type="button"
                onClick={handleUseMax}
                disabled={loading}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-200 disabled:opacity-50"
              >
                Use max ${formatCurrency(balance)}
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setFieldErrors((current) => ({ ...current, amount: undefined })); }}
              placeholder="0.00"
              aria-invalid={Boolean(fieldErrors.amount)}
              aria-describedby={fieldErrors.amount ? 'transfer-amount-error' : undefined}
              className={`w-full rounded-lg border bg-zinc-950 py-3 pl-8 pr-4 font-mono text-sm font-semibold text-zinc-100 placeholder-zinc-650 transition focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${fieldErrors.amount ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500/50'}`}
            />
          </div>
          {fieldErrors.amount && <p id="transfer-amount-error" className="text-xs text-zinc-400">{fieldErrors.amount}</p>}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-zinc-500">Quick:</span>
            {[10, 25, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={loading}
                onClick={() => handlePresetSelect(preset)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono font-medium transition disabled:opacity-50"
              >
                +${preset}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Description <span className="text-zinc-600 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <input
              type="text"
              disabled={loading}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setFieldErrors((current) => ({ ...current, description: undefined })); }}
              placeholder="e.g. Dinner repayment, subscription share"
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? 'transfer-description-error' : undefined}
              className={`w-full rounded-lg border bg-zinc-950 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 transition focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${fieldErrors.description ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500/50'}`}
            />
          </div>
          {fieldErrors.description && <p id="transfer-description-error" className="text-xs text-zinc-400">{fieldErrors.description}</p>}
        </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-zinc-950 font-semibold rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-zinc-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Transfer...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Execute Instant Transfer</span>
              </>
            )}
          </button>
        </form>

        <aside className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-sm font-semibold text-white">Transfer summary</h2>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Live</span>
          </div>

          <div className="space-y-5 py-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Sending to</p>
              <p className="mt-1 truncate text-sm font-medium text-zinc-200">
                {receiverEmail || 'Add a recipient'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Transfer amount</p>
              <p className="mt-1 font-mono text-3xl font-semibold text-white">
                ${formatCurrency(validTransferAmount)}
              </p>
            </div>
          </div>

          <dl className="space-y-3 border-t border-zinc-800 pt-5 text-xs">
            <div className="flex items-center justify-between gap-4 text-zinc-500">
              <dt>Available to transfer</dt>
              <dd className="font-mono font-medium text-zinc-200">
                {fetchingBalance ? 'Loading...' : `$${formatCurrency(balance ?? 0)}`}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-zinc-500">
              <dt>Remaining after transfer</dt>
              <dd className="font-mono font-medium text-zinc-200">
                {remainingBalance === null ? 'Loading...' : `$${formatCurrency(remainingBalance)}`}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-zinc-500">
              <dt>Delivery</dt>
              <dd className="font-medium text-zinc-200">Instant</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
