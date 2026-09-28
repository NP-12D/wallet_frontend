// components/Navbar.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 font-sans backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 sm:gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:text-base"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-sm font-extrabold text-white">
            $
          </div>
          <span className="hidden font-extrabold tracking-tight text-white sm:inline">
            Wallet Core
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="ml-1 hidden items-center gap-1 border-l border-zinc-800 pl-4 md:flex" aria-label="Primary">
            <Link
              href="/transactions"
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                pathname === '/transactions'
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              Transactions
            </Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {isAuthenticated ? (
          <>
            <div className="text-right max-w-27.5 xs:max-w-[150px] sm:max-w-55">
              <div className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
                {user?.username}
              </div>
            </div>

            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              Log Out
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 sm:text-sm"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
