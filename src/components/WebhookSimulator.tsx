// components/WebhookSimulator.tsx
'use client';

import { useState } from 'react';
import { paymentsApi } from '@/services/api';

interface WebhookSimulatorProps {
  initialTxId?: string;
  onSuccess?: () => void;
}

export default function WebhookSimulator({
  initialTxId = '',
  onSuccess,
}: WebhookSimulatorProps) {
  const [transactionId, setTransactionId] = useState<string>(initialTxId);
  const [status, setStatus] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await paymentsApi.webhook({
        transaction_id: transactionId,
        status,
      });
      setFeedback({
        type: 'success',
        text: `Webhook triggered successfully. Transaction status set to ${status}.`,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to trigger webhook. Check Transaction ID.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl font-sans">
      <div>
        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
          Gateway Testing
        </span>
        <h2 className="text-lg font-bold text-white">Webhook Simulator</h2>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">POST /payments/webhook</p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Transaction ID
          </label>
          <input
            type="text"
            required
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="tx_6b6cd3ab-..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 text-xs sm:text-sm font-mono transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Simulated Outcome
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'SUCCESS' | 'FAILED')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 text-xs sm:text-sm transition cursor-pointer"
          >
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !transactionId}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition text-xs sm:text-sm shadow-lg shadow-sky-500/20 cursor-pointer"
        >
          {loading ? 'Processing Callback...' : 'Trigger Webhook Callback'}
        </button>
      </form>
    </div>
  );
}
