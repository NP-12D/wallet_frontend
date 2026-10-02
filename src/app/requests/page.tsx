'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { moneyRequestsApi } from '@/services/api';
import type { MoneyRequest, MoneyRequestStatus } from '@/types/wallet';
import { useAuth } from '@/context/AuthContext';

type Notice = { type: 'success' | 'error'; message: string } | null;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

const statusStyle: Record<MoneyRequestStatus, string> = {
  PENDING: 'border-amber-800/60 bg-amber-950/30 text-amber-300',
  FULFILLED: 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300',
  DECLINED: 'border-zinc-700 bg-zinc-800/70 text-zinc-400',
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [fieldErrors, setFieldErrors] = useState<{ recipientEmail?: string; amount?: string; description?: string }>({});

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await moneyRequestsApi.list());
    } catch (error) {
      console.error('Failed to load money requests:', error);
      setNotice({ type: 'error', message: 'Could not load money requests. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const { incoming, outgoing } = useMemo(() => {
    const currentEmail = user?.email.toLowerCase() ?? '';
    return {
      incoming: requests.filter((request) => request.recipient.email.toLowerCase() === currentEmail),
      outgoing: requests.filter((request) => request.requester.email.toLowerCase() === currentEmail),
    };
  }, [requests, user?.email]);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const numericAmount = Number(amount);
    const nextErrors: { recipientEmail?: string; amount?: string; description?: string } = {};
    if (!recipientEmail.trim()) nextErrors.recipientEmail = 'Enter the recipient email address.';
    else if (!/^\S+@\S+\.\S+$/.test(recipientEmail)) nextErrors.recipientEmail = 'Enter a valid email address.';
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) nextErrors.amount = 'Enter an amount greater than $0.';
    if (description.length > 200) nextErrors.description = 'Use 200 characters or fewer.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await moneyRequestsApi.create({
        recipient_email: recipientEmail,
        amount: numericAmount,
        description,
      });
      setRecipientEmail('');
      setAmount('');
      setDescription('');
      setNotice({ type: 'success', message: 'Money request sent. The recipient can now pay or decline it.' });
      await loadRequests();
      window.dispatchEvent(new Event('wallet-money-requests-updated'));
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || 'Could not send the money request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const respondToRequest = async (request: MoneyRequest, action: 'fulfill' | 'decline') => {
    setActionId(request.requestId);
    setNotice(null);
    try {
      if (action === 'fulfill') {
        await moneyRequestsApi.fulfill(request.requestId);
        setNotice({ type: 'success', message: `You sent ${formatCurrency(request.amount)} to ${request.requester.email}.` });
      } else {
        await moneyRequestsApi.decline(request.requestId);
        setNotice({ type: 'success', message: 'Money request declined.' });
      }
      await loadRequests();
      window.dispatchEvent(new Event('wallet-money-requests-updated'));
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || `Could not ${action} this request.`,
      });
    } finally {
      setActionId(null);
    }
  };

  const RequestList = ({ items, type }: { items: MoneyRequest[]; type: 'incoming' | 'outgoing' }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 px-5 py-9 text-center text-sm text-zinc-500">
          {type === 'incoming' ? 'No money requests are waiting for you.' : 'You have not sent any money requests.'}
        </div>
      ) : (
        items.map((request) => {
          const isPendingIncoming = type === 'incoming' && request.status === 'PENDING';
          const isActing = actionId === request.requestId;
          return (
            <article key={request.requestId} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {type === 'incoming' ? request.requester.email : request.recipient.email}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${statusStyle[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {request.description || 'No note added to this request.'}
                  </p>
                  <p className="text-[11px] text-zinc-600">
                    Requested {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <p className="font-mono text-2xl font-semibold text-white">{formatCurrency(request.amount)}</p>
                  {isPendingIncoming && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => respondToRequest(request, 'decline')}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => respondToRequest(request, 'fulfill')}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing ? 'Processing...' : 'Pay request'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12 font-sans text-zinc-100">
      <div className="border-b border-zinc-800 pb-5">
        <div className="mb-1 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          Peer-to-peer
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Request money</h1>
        <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
          Ask another wallet user for a specific amount. They decide whether to pay it.
        </p>
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-100">
          <span className="flex-1">{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white" aria-label="Dismiss message">×</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-start">
        <form noValidate onSubmit={submitRequest} className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-900 p-6 sm:p-7">
          <div>
            <h2 className="text-base font-semibold text-white">New request</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">The recipient will never be charged until they choose to pay.</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-300">Ask from</span>
            <input type="email" required disabled={submitting} value={recipientEmail} onChange={(event) => { setRecipientEmail(event.target.value); setFieldErrors((current) => ({ ...current, recipientEmail: undefined })); }} placeholder="user2@example.com" aria-invalid={Boolean(fieldErrors.recipientEmail)} aria-describedby={fieldErrors.recipientEmail ? 'request-email-error' : undefined} className={`w-full rounded-lg border bg-zinc-950 px-3.5 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${fieldErrors.recipientEmail ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500/50'}`} />
            {fieldErrors.recipientEmail && <p id="request-email-error" className="text-xs text-zinc-400">{fieldErrors.recipientEmail}</p>}
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-300">Amount ($)</span>
            <input type="number" required min="0.01" step="0.01" disabled={submitting} value={amount} onChange={(event) => { setAmount(event.target.value); setFieldErrors((current) => ({ ...current, amount: undefined })); }} placeholder="50.00" aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? 'request-amount-error' : undefined} className={`w-full rounded-lg border bg-zinc-950 px-3.5 py-3 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${fieldErrors.amount ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500/50'}`} />
            {fieldErrors.amount && <p id="request-amount-error" className="text-xs text-zinc-400">{fieldErrors.amount}</p>}
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-300">Note <span className="font-normal text-zinc-600">(optional)</span></span>
            <textarea maxLength={200} rows={3} disabled={submitting} value={description} onChange={(event) => { setDescription(event.target.value); setFieldErrors((current) => ({ ...current, description: undefined })); }} placeholder="Could you cover dinner?" aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? 'request-description-error' : undefined} className={`w-full resize-none rounded-lg border bg-zinc-950 px-3.5 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${fieldErrors.description ? 'border-zinc-500' : 'border-zinc-800 focus:border-emerald-500/50'}`} />
            {fieldErrors.description && <p id="request-description-error" className="text-xs text-zinc-400">{fieldErrors.description}</p>}
          </label>

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Sending request...' : 'Send money request'}
          </button>
        </form>

        <section className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Incoming requests</h2>
                <p className="mt-1 text-xs text-zinc-500">Review and pay only the requests you approve.</p>
              </div>
              <span className="rounded-full bg-zinc-950 px-2.5 py-1 font-mono text-xs text-zinc-400">{incoming.filter((request) => request.status === 'PENDING').length}</span>
            </div>
            {loading ? <p className="py-8 text-center text-sm text-zinc-500">Loading requests...</p> : <RequestList items={incoming} type="incoming" />}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="mb-5 border-b border-zinc-800 pb-4">
              <h2 className="text-base font-semibold text-white">Sent requests</h2>
              <p className="mt-1 text-xs text-zinc-500">Track requests you have asked others to pay.</p>
            </div>
            {loading ? <p className="py-8 text-center text-sm text-zinc-500">Loading requests...</p> : <RequestList items={outgoing} type="outgoing" />}
          </div>
        </section>
      </div>
    </div>
  );
}
