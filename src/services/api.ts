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
    api.post<AuthResponse>('/register', data).then((res) => res.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/login', data).then((res) => res.data),
};

export const walletApi = {
  getWallet: () => api.get<Wallet>('/wallet').then((res) => res.data),

  transfer: (data: {
    receiver_email: string;
    amount: number;
    description?: string;
  }) => api.post('/wallet/transfer', data).then((res) => res.data),

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

export const paymentsApi = {
  checkout: (data: { amount: number }) =>
    api
      .post<CheckoutResponse>('/payments/checkout', data)
      .then((res) => res.data),

  webhook: (data: { transaction_id: string; status: WebhookStatus }) =>
    api.post<WebhookResponse>('/payments/webhook', data).then((res) => res.data),
};

export default api;
