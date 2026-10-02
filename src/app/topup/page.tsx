// src/app/topup/page.tsx
'use client';

import { useState } from 'react';
import { paymentsApi } from '@/services/api';
import { CheckoutResponse, WebhookStatus } from '@/types/wallet';

export default function TopUpPage() {
  // Checkout State
  const [checkoutAmount, setCheckoutAmount] = useState<string>('100');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutFieldError, setCheckoutFieldError] = useState<string | null>(null);

  // Webhook Simulator State
  const [webhookTxId, setWebhookTxId] = useState<string>('');
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>('SUCCESS');
  const [webhookLoading, setWebhookLoading] = useState<boolean>(false);
  const [webhookMessage, setWebhookMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [webhookFieldError, setWebhookFieldError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(checkoutAmount);

    if (!Number.isFinite(numAmt) || numAmt <= 0) {
      setCheckoutFieldError('Enter an amount greater than $0.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutFieldError(null);
    setCheckoutResult(null);

    try {
      const data = await paymentsApi.checkout({ amount: numAmt });
      setCheckoutResult(data);
      setWebhookTxId(data.transaction_id);
    } catch (err: any) {
      setCheckoutError(err?.response?.data?.message || 'Failed to initiate checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookTxId.trim()) {
      setWebhookFieldError('Enter a pending payment ID.');
      return;
    }

    setWebhookLoading(true);
    setWebhookMessage(null);
    setWebhookFieldError(null);

    try {
      const result = await paymentsApi.webhook({
        transaction_id: webhookTxId,
        status: webhookStatus,
      });

      setCheckoutResult((current) =>
        current?.transaction_id === webhookTxId
          ? { ...current, status: result.status }
          : current,
      );

      setWebhookMessage({
        type: 'success',
        text: `Payment confirmed as ${result.status}.`,
      });
      setCheckoutResult(null);
      setCheckoutAmount('100');
      setCheckoutError(null);
      setWebhookTxId('');
      setWebhookStatus('SUCCESS');
    } catch (err: any) {
      setWebhookMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Webhook execution failed.',
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleCopyTxId = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedAmount = Number(checkoutAmount);
  const previewAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const checkoutIsPending = checkoutResult?.status === 'PENDING';
  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12 text-zinc-100 font-sans">
      <div className="border-b border-zinc-800 pb-5">
        <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          Add funds
        </div>
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">Top up your wallet</h1>
        <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
          Create a payment request, then confirm its result.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-start">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-sm font-semibold text-white">Payment amount</h2>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Step 1 of 2</span>
          </div>

          {checkoutError && (
            <div className="mt-5 rounded-lg border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-400">
              {checkoutError}
            </div>
          )}

          <form noValidate onSubmit={handleCheckout} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">Amount to add</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-zinc-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  disabled={checkoutLoading}
                  value={checkoutAmount}
                  onChange={(e) => { setCheckoutAmount(e.target.value); setCheckoutFieldError(null); }}
                  aria-invalid={Boolean(checkoutFieldError)}
                  aria-describedby={checkoutFieldError ? 'topup-amount-error' : undefined}
                  className={`w-full rounded-lg border bg-zinc-950 py-4 pl-8 pr-4 font-mono text-2xl font-semibold text-zinc-100 outline-none transition disabled:opacity-50 ${checkoutFieldError ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500'}`}
                />
              </div>
              {checkoutFieldError && <p id="topup-amount-error" className="text-xs text-zinc-400">{checkoutFieldError}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] text-zinc-500">Quick amount</span>
                {[50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCheckoutAmount(preset.toString())}
                    disabled={checkoutLoading}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-[11px] font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={checkoutLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkoutLoading ? 'Creating payment request...' : `Continue with $${formatCurrency(previewAmount)}`}
            </button>
          </form>
        </section>

        <aside className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-sm font-semibold text-white">Payment status</h2>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Step 2 of 2</span>
          </div>

          {!checkoutResult ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-500">$</div>
              <p className="mt-4 text-sm font-medium text-zinc-300">Waiting for a payment request</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">Choose an amount, or confirm a saved pending payment with its transaction ID.</p>
              <form noValidate onSubmit={handleWebhook} className="mt-5 space-y-3 text-left">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">Pending payment ID</label>
                  <input
                    type="text"
                    value={webhookTxId}
                    onChange={(event) => { setWebhookTxId(event.target.value); setWebhookFieldError(null); }}
                    placeholder="tx_..."
                    aria-invalid={Boolean(webhookFieldError)}
                    aria-describedby={webhookFieldError ? 'topup-payment-id-error' : undefined}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-100 outline-none ${webhookFieldError ? 'border-zinc-500' : 'border-zinc-800 focus:border-zinc-600'}`}
                  />
                  {webhookFieldError && <p id="topup-payment-id-error" className="text-xs text-zinc-400">{webhookFieldError}</p>}
                </div>
                <select
                  value={webhookStatus}
                  onChange={(event) => setWebhookStatus(event.target.value as WebhookStatus)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-medium text-zinc-200 outline-none focus:border-zinc-600"
                  aria-label="Payment outcome"
                >
                  <option value="SUCCESS">Payment received</option>
                  <option value="FAILED">Payment failed</option>
                </select>
                <button
                  type="submit"
                  disabled={webhookLoading || !webhookTxId.trim()}
                  className="flex w-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-100 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {webhookLoading ? 'Confirming payment...' : 'Confirm saved payment'}
                </button>
              </form>
              {webhookMessage && (
                <div className={`mt-4 rounded-lg border p-3 text-xs ${
                  webhookMessage.type === 'success'
                    ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-400'
                    : 'border-rose-900/50 bg-rose-950/30 text-rose-400'
                }`}>
                  {webhookMessage.text}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-5">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Payment amount</span>
                  <span className="font-mono text-lg font-semibold text-white">${formatCurrency(checkoutResult.amount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Current status</span>
                  <span className="font-mono text-[11px] font-semibold text-zinc-200">{checkoutResult.status}</span>
                </div>
                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Reference</span>
                    <button
                      type="button"
                      onClick={() => handleCopyTxId(checkoutResult.transaction_id)}
                      className="text-[11px] font-semibold text-zinc-200 hover:text-white"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-zinc-300">{checkoutResult.transaction_id}</p>
                </div>
              </div>

              {webhookMessage && (
                <div className={`mt-4 rounded-lg border p-3 text-xs ${
                  webhookMessage.type === 'success'
                    ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-400'
                    : 'border-rose-900/50 bg-rose-950/30 text-rose-400'
                }`}>
                  {webhookMessage.text}
                </div>
              )}

              <form noValidate onSubmit={handleWebhook} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">Payment outcome</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['SUCCESS', 'FAILED'] as const).map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => setWebhookStatus(outcome)}
                        className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                          webhookStatus === outcome
                            ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-200'
                        }`}
                      >
                        {outcome === 'SUCCESS' ? 'Received' : 'Failed'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={webhookLoading || !webhookTxId.trim() || !checkoutIsPending}
                  className="flex w-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {webhookLoading
                    ? 'Confirming payment...'
                    : checkoutIsPending
                      ? 'Confirm payment result'
                      : 'Payment already resolved'}
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
