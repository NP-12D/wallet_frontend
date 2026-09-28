'use client';

import { useEffect, useState } from 'react';

const THEME_KEY = 'wallet_theme';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const nextIsDark = savedTheme !== 'light';
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle('dark', nextIsDark);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    localStorage.setItem(THEME_KEY, nextIsDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextIsDark);
  };

  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${nextTheme} mode`}
      aria-label={`Switch to ${nextTheme} mode`}
      className="theme-toggle grid h-10 w-10 place-items-center rounded-lg border border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-600"
    >
      {isDark ? (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.6 15.1A8.7 8.7 0 0 1 8.9 3.4a.75.75 0 0 0-.9-.9A9.5 9.5 0 1 0 21.5 16a.75.75 0 0 0-.9-.9Z" />
        </svg>
      )}
    </button>
  );
}
