'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { journalApi } from '@/services/api';
import { JournalEntry, JournalEntryType } from '@/types/wallet';

const today = () => new Date().toISOString().slice(0, 10);

function CalendarPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(`${value}T12:00:00`));
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedDate = new Date(`${value}T12:00:00`);
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  useEffect(() => {
    const closePicker = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closePicker);
    return () => document.removeEventListener('mousedown', closePicker);
  }, []);

  const chooseDate = (day: number) => {
    const chosen = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12);
    onChange(`${chosen.getFullYear()}-${String(chosen.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setOpen(false);
  };
  const title = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(viewDate);
  const displayValue = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate);
  const calendarDays = Array.from({ length: monthStart.getDay() + daysInMonth }, (_, index) => index < monthStart.getDay() ? null : index - monthStart.getDay() + 1);

  return <div ref={pickerRef} className="relative">
    <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-left text-sm text-zinc-100 outline-none transition hover:border-zinc-700 focus:border-zinc-600">
      <span className="flex items-center gap-2"><svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M4.5 9.5h15M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1Z" /></svg>{displayValue}</span><svg className={`h-4 w-4 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <div className="absolute z-30 mt-2 w-[min(19rem,calc(100vw-3rem))] rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl shadow-black/25">
      <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100" aria-label="Previous month"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg></button><p className="text-sm font-semibold text-zinc-100">{title}</p><button type="button" onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100" aria-label="Next month"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg></button></div>
      <div className="grid grid-cols-7 gap-1 text-center">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1 text-[10px] font-medium text-zinc-500">{day}</span>)}{calendarDays.map((day, index) => day === null ? <span key={`empty-${index}`} /> : <button key={day} type="button" onClick={() => chooseDate(day)} className={`h-8 rounded-lg text-xs font-medium transition ${selectedDate.getFullYear() === viewDate.getFullYear() && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getDate() === day ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'}`}>{day}</button>)}</div>
      <button type="button" onClick={() => { const current = today(); onChange(current); setViewDate(new Date(`${current}T12:00:00`)); setOpen(false); }} className="mt-3 w-full rounded-lg border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Today</button>
    </div>}
  </div>;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [type, setType] = useState<JournalEntryType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [note, setNote] = useState('');
  const [occurredAt, setOccurredAt] = useState(today());
  const [filter, setFilter] = useState<'ALL' | JournalEntryType>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ amount?: string; counterparty?: string }>({});
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await journalApi.list());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load your journal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const nextErrors: { amount?: string; counterparty?: string } = {};
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) nextErrors.amount = 'Enter an amount greater than $0.';
    if (!counterparty.trim()) nextErrors.counterparty = type === 'EXPENSE' ? 'Enter where or who you paid.' : 'Enter where or who the money came from.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const entry = await journalApi.create({ type, amount: numericAmount, counterparty: counterparty.trim(), note: note.trim(), occurredAt });
      setEntries((current) => [entry, ...current]);
      setAmount('');
      setCounterparty('');
      setNote('');
      setOccurredAt(today());
    } catch (caught: any) {
      setError(caught?.response?.data?.message || 'Could not save the journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      await journalApi.remove(entryToDelete.entryId);
      setEntries((current) => current.filter((entry) => entry.entryId !== entryToDelete.entryId));
      setEntryToDelete(null);
    } catch (caught: any) {
      setError(caught?.response?.data?.message || 'Could not delete the journal entry.');
    }
  };

  const visibleEntries = useMemo(() => filter === 'ALL' ? entries : entries.filter((entry) => entry.type === filter), [entries, filter]);
  const totals = useMemo(() => entries.reduce((result, entry) => ({
    paid: result.paid + (entry.type === 'EXPENSE' ? entry.amount : 0),
    received: result.received + (entry.type === 'INCOME' ? entry.amount : 0),
  }), { paid: 0, received: 0 }), [entries]);
  const formatMoney = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12 text-zinc-100">
      {entryToDelete && <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEntryToDelete(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="delete-journal-title" className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-950"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.6 2.9 17.2A2 2 0 004.7 20h14.6a2 2 0 001.8-2.8L13.7 3.6a2 2 0 00-3.4 0Z" /></svg></span><div><h2 id="delete-journal-title" className="text-base font-semibold text-white">Delete journal entry?</h2><p className="mt-1 text-sm leading-relaxed text-zinc-400">This will permanently remove <span className="font-medium text-zinc-200">{entryToDelete.counterparty}</span> ({formatMoney(entryToDelete.amount)}). Your wallet balance will not change.</p></div></div>
          <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setEntryToDelete(null)} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800">Keep entry</button><button type="button" onClick={() => void deleteEntry()} className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-white">Delete entry</button></div>
        </div>
      </div>}
      <header className="border-b border-zinc-800 pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Personal record</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">Money journal</h1>
        <p className="mt-1 text-sm text-zinc-400">Remember where money went or came from. Journal entries do not change your wallet balance.</p>
      </header>

      {error && <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-300">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6 lg:sticky lg:top-24">
          <div><h2 className="font-semibold text-white">Add an entry</h2><p className="mt-1 text-xs text-zinc-400">Keep your personal cash record in one place.</p></div>
          <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(['EXPENSE', 'INCOME'] as JournalEntryType[]).map((entryType) => <button key={entryType} type="button" onClick={() => setType(entryType)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${type === entryType ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}>{entryType === 'EXPENSE' ? 'I paid' : 'I received'}</button>)}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Amount</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setFieldErrors((current) => ({ ...current, amount: undefined })); }} placeholder="0.00" className={`w-full rounded-lg border bg-zinc-950 py-3 pl-7 pr-3 font-mono text-sm text-zinc-100 outline-none ${fieldErrors.amount ? 'border-zinc-500' : 'border-zinc-800 focus:border-zinc-600'}`} /></div>
            {fieldErrors.amount && <p className="mt-1 text-xs text-zinc-400">{fieldErrors.amount}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">{type === 'EXPENSE' ? 'Paid to / place' : 'Received from / place'}</label>
            <input value={counterparty} maxLength={80} onChange={(event) => { setCounterparty(event.target.value); setFieldErrors((current) => ({ ...current, counterparty: undefined })); }} placeholder={type === 'EXPENSE' ? 'e.g. Market, Alex, taxi' : 'e.g. Salary, Alex, client'} className={`w-full rounded-lg border bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none ${fieldErrors.counterparty ? 'border-zinc-500' : 'border-zinc-800 focus:border-zinc-600'}`} />
            {fieldErrors.counterparty && <p className="mt-1 text-xs text-zinc-400">{fieldErrors.counterparty}</p>}
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-zinc-300">Date</label><CalendarPicker value={occurredAt} onChange={setOccurredAt} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-zinc-300">Note <span className="font-normal text-zinc-600">optional</span></label><textarea value={note} maxLength={500} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="What was this for?" className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600" /></div>
          <button disabled={saving} className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-white disabled:opacity-50">{saving ? 'Saving...' : 'Save journal entry'}</button>
        </form>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><p className="text-[11px] uppercase tracking-wider text-zinc-500">Logged paid</p><p className="mt-1 font-mono text-xl font-semibold text-white">{formatMoney(totals.paid)}</p></div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><p className="text-[11px] uppercase tracking-wider text-zinc-500">Logged received</p><p className="mt-1 font-mono text-xl font-semibold text-white">{formatMoney(totals.received)}</p></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-white">Your entries</h2><div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">{(['ALL', 'EXPENSE', 'INCOME'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${filter === item ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}>{item === 'ALL' ? 'All' : item === 'EXPENSE' ? 'Paid' : 'Received'}</button>)}</div></div>
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            {loading ? <p className="p-6 text-sm text-zinc-400">Loading journal...</p> : visibleEntries.length === 0 ? <p className="p-8 text-center text-sm text-zinc-500">No journal entries yet.</p> : <ul className="divide-y divide-zinc-800">{visibleEntries.map((entry) => <li key={entry.entryId} className="flex gap-3 p-4 sm:items-center"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${entry.type === 'EXPENSE' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-950'}`}>{entry.type === 'EXPENSE' ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7m0 0h-7m7 0v7" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m17 7-10 10m0 0h7m-7 0v-7" /></svg>}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><p className="truncate text-sm font-semibold text-zinc-100">{entry.counterparty}</p><p className="font-mono text-sm font-semibold text-zinc-100">{entry.type === 'EXPENSE' ? '−' : '+'}{formatMoney(entry.amount)}</p></div><p className="mt-0.5 truncate text-xs text-zinc-500">{entry.note || 'No note'} · {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(entry.occurredAt))}</p></div><button type="button" onClick={() => setEntryToDelete(entry)} className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100" aria-label={`Delete ${entry.counterparty}`}>×</button></li>)}</ul>}
          </div>
        </section>
      </div>
    </div>
  );
}
