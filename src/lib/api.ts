import type {
  AnalyticsResponse,
  AuthResponse,
  CheckoutResponse,
  TransactionsResponse,
  TransferResponse,
  WalletResponse,
  WebhookStatus,
} from '@/types/wallet';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type ApiOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: HeadersInit = {};

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false && options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Your session expired. Please login again.');
  }

  if (!response.ok) {
    const errorBody = await safeJson(response);
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message || `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function safeJson(response: Response): Promise<{ message?: string | string[] } | null> {
  try {
    return (await response.json()) as { message?: string | string[] };
  } catch (error) {
    return null;
  }
}

export const authApi = {
  register(payload: { username: string; email: string; password: string }) {
    return request<AuthResponse>('/', {
      method: 'POST',
      body: payload,
      auth: false,
    });
  },

  login(payload: { email: string; password: string }) {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
  },
};

export const walletApi = {
  getWallet(token: string) {
    return request<WalletResponse>('/wallet', { token });
  },

  transfer(
    token: string,
    payload: { receiver_email: string; amount: number; description?: string },
  ) {
    return request<TransferResponse>('/wallet/transfer', {
      method: 'POST',
      token,
      body: payload,
    });
  },
};

export const paymentApi = {
  checkout(token: string, payload: { amount: number }) {
    return request<CheckoutResponse>('/payments/checkout', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  webhook(payload: { transaction_id: string; status: WebhookStatus }) {
    return request<CheckoutResponse>('/payments/webhook', {
      method: 'POST',
      body: payload,
      auth: false,
    });
  },
};

export const transactionApi = {
  list(token: string, params: URLSearchParams) {
    return request<TransactionsResponse>(`/wallet/transactions?${params.toString()}`, {
      token,
    });
  },

  analytics(token: string) {
    return request<AnalyticsResponse>('/wallet/analytics', { token });
  },

  async exportCsv(token: string) {
    const response = await fetch(`${API_BASE}/wallet/transactions/export?format=csv`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session expired. Please login again.');
    }

    if (!response.ok) {
      throw new Error(`Export failed with ${response.status}`);
    }

    return response.blob();
  },
};
