// types/index.ts

/* ============================================================================
   CORE ENTITIES
   ============================================================================ */

export interface User {
  id: string;
  username: string;
  email: string;
  walletId?: string;
}

export interface Wallet {
  walletId: string;
  balance: number;
  user: User;
}

/* ============================================================================
   TRANSACTIONS & ANALYTICS
   ============================================================================ */

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'TOP_UP' | 'TRANSFER' | 'PAYMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface Transaction {
  transactionId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsData {
  month: string;
  totalIncome: number;
  totalSpent: number;
  transactionCount: number;
  topTransactions: Transaction[];
}

/* ============================================================================
   AUTH & SESSION
   ============================================================================ */

export interface AuthResponse {
  user: User;
  token: string;
}

export type WalletSession = AuthResponse;

/* ============================================================================
   API REQUEST PAYLOADS (ADDED)
   ============================================================================ */

export type WebhookStatus = 'SUCCESS' | 'FAILED';

export interface CheckoutPayload {
  amount: number;
}

export interface WebhookPayload {
  transaction_id: string;
  status: WebhookStatus;
}

export interface TransferPayload {
  receiver_email: string;
  amount: number;
  description?: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType | string;
  from?: string;
  to?: string;
}

/* ============================================================================
   API RESPONSE PAYLOADS (ADDED)
   ============================================================================ */

export interface CheckoutResponse {
  transaction_id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
}

export interface WebhookResponse {
  transaction_id: string;
  status: TransactionStatus;
}

export interface TransferResponse {
  transactionId: string;
  amount: number;
  receiver_email?: string;
  description?: string;
}

/* ============================================================================
   TYPE ALIASES FOR CONSISTENCY (ADDED)
   ============================================================================ */

export type WalletResponse = Wallet;
export type TransactionsResponse = PaginatedTransactions;
export type AnalyticsResponse = AnalyticsData;
