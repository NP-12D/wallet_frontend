import type { User as AuthUser } from '@/types/wallet';

const TOKEN_KEY = 'wallet_token';
const USER_KEY = 'wallet_user';
const NOTICE_KEY = 'wallet_notice';

export type WalletSession = {
  token: string;
  user: AuthUser;
};

export function getSession(): WalletSession | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  if (!token || !user) return null;

  try {
    return {
      token,
      user: JSON.parse(user) as AuthUser,
    };
  } catch (error) {
    clearSession();
    return null;
  }
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setNotice(message: string) {
  sessionStorage.setItem(NOTICE_KEY, message);
}

export function takeNotice() {
  const message = sessionStorage.getItem(NOTICE_KEY);
  if (message) sessionStorage.removeItem(NOTICE_KEY);
  return message;
}
