// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nextErrors: { username?: string; email?: string; password?: string } = {};
    if (!username.trim()) nextErrors.username = 'Enter a username.';
    else if (username.trim().length > 40) nextErrors.username = 'Use 40 characters or fewer.';
    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Create a password.';
    else if (password.length < 6) nextErrors.password = 'Use at least 6 characters.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      await register(username, email, password);
      router.replace('/login');
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Changed h-screen to min-h-screen and items-center to items-start with vertical padding (py-12) to move it down from the top gracefully
    <main className="relative flex min-h-screen w-full items-start justify-center bg-zinc-950 px-4 py-12 font-sans text-zinc-100 sm:py-16">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-8 space-y-6 transition-colors hover:border-zinc-700">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-extrabold text-white mx-auto text-xl">
            $
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-xs sm:text-sm text-zinc-400">Register a new wallet user account</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs">
            {error}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFieldErrors((current) => ({ ...current, username: undefined }));
              }}
              placeholder="user1"
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
              className={`w-full rounded-xl border bg-zinc-950/80 px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 transition focus:outline-none sm:text-sm ${fieldErrors.username ? 'border-zinc-500' : 'border-zinc-800/80 focus:border-emerald-500/50'}`}
            />
            {fieldErrors.username && <p id="register-username-error" className="mt-1.5 text-xs text-zinc-400">{fieldErrors.username}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="user1@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              className={`w-full rounded-xl border bg-zinc-950/80 px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 transition focus:outline-none sm:text-sm ${fieldErrors.email ? 'border-zinc-500' : 'border-zinc-800/80 focus:border-emerald-500/50'}`}
            />
            {fieldErrors.email && <p id="register-email-error" className="mt-1.5 text-xs text-zinc-400">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="••••••••"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
              className={`w-full rounded-xl border bg-zinc-950/80 px-4 py-2.5 pr-12 text-xs text-zinc-100 placeholder-zinc-600 transition focus:outline-none sm:text-sm ${fieldErrors.password ? 'border-zinc-500' : 'border-zinc-800/80 focus:border-emerald-500/50'}`}
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-300 transition hover:bg-zinc-800 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.9 10.9 0 0112 4c5.5 0 9.3 4.5 10 8-.2 1.1-.8 2.4-1.8 3.6M6.6 6.6C4.7 8 3.4 10.2 3 12c.7 3.5 4.5 8 9 8 1.3 0 2.5-.3 3.5-.8" /></svg> : <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>}
            </button>
            </div>
            {fieldErrors.password && <p id="register-password-error" className="mt-1.5 text-xs text-zinc-400">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg transition text-xs sm:text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Register Wallet</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-100 font-medium hover:text-white transition">
            Sign in here
          </Link>
        </div>
      </div>
    </main>
  );
}
