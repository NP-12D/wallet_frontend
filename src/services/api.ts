// services/api.ts
import axios from 'axios';
import {
  AuthResponse,
  Wallet,
  PaginatedTransactions,
  AnalyticsData,
  CheckoutResponse,
  WebhookResponse,
  WebhookStatus,
  MoneyRequest,
  SupportConversation,
  SupportConversationDetail,
  SupportMessage,
  JournalEntry,
  JournalEntryType,
} from '@/types/wallet';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token dynamically to outgoing requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wallet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api
      .post<{ message: string }>('/register', data)
      .then((res) => res.data),

  login: (data: { email: string; password: string }) =>
    api.post<{ message: string }>('/login', data).then((res) => res.data),

  verifyRegistration: (data: { email: string; code: string }) =>
    api.post<{ message: string }>('/register/verify', data).then((res) => res.data),

  verifyLogin: (data: { email: string; code: string }) =>
    api.post<AuthResponse>('/login/verify', data).then((res) => res.data),
};

export const walletApi = {
  getWallet: () => api.get<Wallet>('/wallet').then((res) => res.data),

  transfer: (data: {
    receiver_email: string;
    amount: number;
    description?: string;
  }) => api.post<{ message: string }>('/wallet/transfer', data).then((res) => res.data),

  confirmTransfer: (code: string) =>
    api.post('/wallet/transfer/confirm', { code }).then((res) => res.data),

  getTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    from?: string;
    to?: string;
    search?: string;
  }) =>
    api
      .get<PaginatedTransactions>('/wallet/transactions', { params })
      .then((res) => res.data),

  exportTransactions: (params?: {
    type?: string;
    from?: string;
    to?: string;
    search?: string;
  }) =>
    api.get('/wallet/transactions/export', { params, responseType: 'blob' }),

  getAnalytics: () =>
    api.get<AnalyticsData>('/wallet/analytics').then((res) => res.data),
};

export const moneyRequestsApi = {
  create: (data: {
    recipient_email: string;
    amount: number;
    description?: string;
  }) => api.post<MoneyRequest>('/money-requests', data).then((res) => res.data),

  list: () => api.get<MoneyRequest[]>('/money-requests').then((res) => res.data),

  getPendingCount: () =>
    api.get<{ count: number }>('/money-requests/pending-count').then((res) => res.data),

  fulfill: (requestId: string) =>
    api.post<MoneyRequest>(`/money-requests/${requestId}/fulfill`).then((res) => res.data),

  decline: (requestId: string) =>
    api.post<MoneyRequest>(`/money-requests/${requestId}/decline`).then((res) => res.data),
};

export const journalApi = {
  list: () => api.get<JournalEntry[]>('/journal').then((res) => res.data),

  create: (data: {
    type: JournalEntryType;
    amount: number;
    counterparty: string;
    note?: string;
    occurredAt: string;
  }) => api.post<JournalEntry>('/journal', data).then((res) => res.data),

  update: (entryId: string, data: Partial<{
    type: JournalEntryType;
    amount: number;
    counterparty: string;
    note: string;
    occurredAt: string;
  }>) => api.patch<JournalEntry>(`/journal/${entryId}`, data).then((res) => res.data),

  remove: (entryId: string) =>
    api.delete<{ message: string }>(`/journal/${entryId}`).then((res) => res.data),
};

export const paymentsApi = {
  checkout: (data: { amount: number }) =>
    api
      .post<CheckoutResponse>('/payments/checkout', data)
      .then((res) => res.data),

  webhook: (data: { transaction_id: string; status: WebhookStatus }) =>
    api.post<WebhookResponse>('/payments/webhook', data).then((res) => res.data),
};

export const supportApi = {
  getAccess: () =>
    api.get<{ isAdmin: boolean }>('/support/access').then((res) => res.data),

  getUnreadCount: () =>
    api.get<{ count: number; isAdmin: boolean }>('/support/unread-count').then((res) => res.data),

  getMessages: () => api.get<SupportMessage[]>('/support/messages').then((res) => res.data),

  sendMessage: (content: string) =>
    api.post<SupportMessage>('/support/messages', { content }).then((res) => res.data),

  getAdminConversations: () =>
    api.get<SupportConversation[]>('/support/admin/conversations').then((res) => res.data),

  getAdminConversation: (userId: string) =>
    api.get<SupportConversationDetail>(`/support/admin/conversations/${userId}`).then((res) => res.data),

  sendAdminMessage: (userId: string, content: string) =>
    api.post<SupportMessage>(`/support/admin/conversations/${userId}/messages`, { content }).then((res) => res.data),
};

export default api;
