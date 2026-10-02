'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { supportApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { SupportConversation, SupportMessage } from '@/types/wallet';

const formatTime = (date: string) =>
  new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(Boolean(user?.isAdmin));
  const [unreadCount, setUnreadCount] = useState(0);
  const chatPanelRef = useRef<HTMLElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const { count, isAdmin: hasAdminAccess } = await supportApi.getUnreadCount();
      setUnreadCount(count);
      setIsAdmin(hasAdminAccess);
    } catch (requestError) {
      console.error('Failed to load support unread count:', requestError);
    }
  }, []);

  const loadUserMessages = useCallback(async () => {
    const nextMessages = await supportApi.getMessages();
    setMessages(nextMessages);
  }, []);

  const loadConversations = useCallback(async () => {
    const nextConversations = await supportApi.getAdminConversations();
    setConversations(nextConversations);
  }, []);

  const loadAdminConversation = useCallback(async (conversation: SupportConversation) => {
    const detail = await supportApi.getAdminConversation(conversation.user.id);
    setSelectedConversation(conversation);
    setMessages(detail.messages);
  }, []);

  const loadSupport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const access = await supportApi.getAccess();
      setIsAdmin(access.isAdmin);
      if (access.isAdmin) {
        await loadConversations();
      } else {
        await loadUserMessages();
      }
      await loadUnreadCount();
    } catch (requestError) {
      console.error('Failed to load support chat:', requestError);
      setError('Support chat is unavailable right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadConversations, loadUnreadCount, loadUserMessages]);

  useEffect(() => {
    void loadUnreadCount();
    const intervalId = window.setInterval(() => void loadUnreadCount(), 30_000);
    window.addEventListener('focus', loadUnreadCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadUnreadCount);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!isOpen) return;
    void loadSupport();
    const intervalId = window.setInterval(() => {
      if (isAdmin) {
        void loadConversations();
        if (selectedConversation) void loadAdminConversation(selectedConversation);
      } else {
        void loadUserMessages();
      }
      void loadUnreadCount();
    }, 15_000);

    return () => window.clearInterval(intervalId);
  }, [isAdmin, isOpen, loadAdminConversation, loadConversations, loadSupport, loadUnreadCount, loadUserMessages, selectedConversation]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !chatPanelRef.current?.contains(target) &&
        !chatButtonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isOpen]);

  const openChat = () => {
    setIsOpen((open) => !open);
    setError(null);
  };

  const selectConversation = async (conversation: SupportConversation) => {
    setLoading(true);
    setError(null);
    try {
      await loadAdminConversation(conversation);
      await loadConversations();
      await loadUnreadCount();
    } catch (requestError) {
      console.error('Failed to load admin support conversation:', requestError);
      setError('Could not open this conversation.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending || (isAdmin && !selectedConversation)) return;

    setSending(true);
    setError(null);
    try {
      if (isAdmin && selectedConversation) {
        const message = await supportApi.sendAdminMessage(selectedConversation.user.id, content);
        setMessages((current) => [...current, message]);
        await loadConversations();
      } else {
        const message = await supportApi.sendMessage(content);
        setMessages((current) => [...current, message]);
      }
      setDraft('');
      await loadUnreadCount();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const title = isAdmin ? 'Support inbox' : 'Chat with support';
  const emptyMessage = isAdmin
    ? 'Select a customer conversation to read and reply.'
    : 'Ask us anything about transfers, requests, or using your wallet.';

  return (
    <div className="fixed bottom-5 right-5 z-[60] font-sans">
      {isOpen && (
        <section ref={chatPanelRef} className="mb-3 flex h-[min(42rem,calc(100vh-7rem))] w-[min(92vw,44rem)] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl" aria-label={title}>
          {isAdmin && (
            <aside className="hidden w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 sm:block">
              <div className="border-b border-zinc-800 px-4 py-4">
                <p className="text-sm font-bold text-zinc-100">Customer chats</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{conversations.length} conversations</p>
              </div>
              <div className="max-h-full overflow-y-auto p-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.user.id}
                    type="button"
                    onClick={() => void selectConversation(conversation)}
                    className={`mb-1 w-full rounded-lg p-3 text-left transition ${selectedConversation?.user.id === conversation.user.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-zinc-200">{conversation.user.username}</span>
                      {conversation.unreadCount > 0 && <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">{conversation.unreadCount}</span>}
                    </div>
                    <p className="mt-1 truncate text-[11px] text-zinc-500">{conversation.lastMessage}</p>
                  </button>
                ))}
                {!loading && conversations.length === 0 && <p className="p-3 text-xs text-zinc-500">No support messages yet.</p>}
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3.5">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-zinc-100">
                  {isAdmin && selectedConversation ? selectedConversation.user.username : title}
                </h2>
                <p className="truncate text-[11px] text-zinc-500">
                  {isAdmin && selectedConversation ? selectedConversation.user.email : isAdmin ? 'Choose a conversation to reply' : 'We are here to help'}
                </p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-zinc-700 bg-zinc-950 text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100" aria-label="Close support chat" title="Close chat">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
                  <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {loading && messages.length === 0 ? (
                <p className="pt-8 text-center text-sm text-zinc-500">Loading support chat...</p>
              ) : messages.length === 0 ? (
                <p className="mx-auto max-w-xs pt-10 text-center text-sm leading-relaxed text-zinc-500">{emptyMessage}</p>
              ) : (
                messages.map((message) => {
                  const ownMessage = isAdmin ? message.sender === 'ADMIN' : message.sender === 'USER';
                  return (
                    <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 ${ownMessage ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-100'}`}>
                        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                        <p className={`mt-1 text-[10px] ${ownMessage ? 'text-zinc-600' : 'text-zinc-500'}`}>{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {error && <p className="border-t border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-200">{error}</p>}
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-zinc-800 p-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={sending || (isAdmin && !selectedConversation)}
                maxLength={1000}
                placeholder={isAdmin && !selectedConversation ? 'Select a customer chat first' : 'Write a message...'}
                className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button type="submit" disabled={sending || !draft.trim() || (isAdmin && !selectedConversation)} className="rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? 'Sending' : 'Send'}
              </button>
            </form>
          </div>
        </section>
      )}

      {!isOpen && (
        <button ref={chatButtonRef} type="button" onClick={openChat} className="relative ml-auto grid h-13 w-13 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-xl transition duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-800" aria-label={title} title={title}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.8 10.8 0 01-4.4-.93L3 20l1.48-3.45A7.33 7.33 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-zinc-950 bg-zinc-100 px-1 text-[10px] font-extrabold leading-none text-zinc-950" aria-label={`${unreadCount} unread support messages`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
