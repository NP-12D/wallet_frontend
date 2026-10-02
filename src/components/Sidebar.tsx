// components/Sidebar.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { moneyRequestsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => ReactElement;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: 'Transfer',
    href: '/transfer',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    name: 'Requests',
    href: '/requests',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    name: 'Top Up',
    href: '/topup',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
      </svg>
    ),
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const refreshPendingRequestCount = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingRequestCount(0);
      return;
    }

    try {
      const { count } = await moneyRequestsApi.getPendingCount();
      setPendingRequestCount(count);
    } catch (error) {
      console.error('Failed to load pending money request count:', error);
    }
  }, [isAuthenticated]);

  // Close mobile navigation drawer automatically on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    void refreshPendingRequestCount();
    const intervalId = window.setInterval(refreshPendingRequestCount, 30_000);
    window.addEventListener('focus', refreshPendingRequestCount);
    window.addEventListener('wallet-money-requests-updated', refreshPendingRequestCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshPendingRequestCount);
      window.removeEventListener('wallet-money-requests-updated', refreshPendingRequestCount);
    };
  }, [refreshPendingRequestCount]);

  const renderNavLinks = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-zinc-900 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`}
            />
            <span>{item.name}</span>
            {item.href === '/requests' && pendingRequestCount > 0 && (
              <span
                className="ml-auto min-w-5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold leading-none text-zinc-950"
                aria-label={`${pendingRequestCount} pending money requests`}
              >
                {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Top Navigation Toggle Bar (< lg) */}
      <div className="lg:hidden sticky top-16 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between font-sans">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Menu
          </span>
          <span className="text-xs text-zinc-600">•</span>
            <span className="text-xs font-medium text-zinc-200 capitalize">
            {navItems.find((item) => item.href === pathname)?.name ||
              'Navigation'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {isMobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
          <span>{isMobileOpen ? 'Close' : 'Pages'}</span>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Slide-out Sidebar Drawer (Mobile) & fixed navigation (Desktop) */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950 p-5 font-sans transition-transform duration-300 ease-in-out lg:h-full lg:p-6 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile Header Close Action */}
          <div className="flex items-center justify-between lg:hidden">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          {renderNavLinks()}
        </div>
      </aside>
    </>
  );
}
