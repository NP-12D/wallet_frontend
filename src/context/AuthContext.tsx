// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/wallet';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('wallet_token');
    const savedUser = localStorage.getItem('wallet_user');
    try {
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as User);
      }
    } catch {
      localStorage.removeItem('wallet_token');
      localStorage.removeItem('wallet_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    setUser(res.user);

    localStorage.setItem('wallet_token', res.token);
    localStorage.setItem('wallet_user', JSON.stringify(res.user));
    document.cookie = `token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
  };

  const register = async (username: string, email: string, password: string) => {
    await authApi.register({ username, email, password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('wallet_token');
    localStorage.removeItem('wallet_user');
    document.cookie = 'token=; path=/; max-age=0';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isReady,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  const errorMessage = 'useAuth must be used within an AuthProvider';
  if (!context) throw new Error(errorMessage);
  return context;
};
