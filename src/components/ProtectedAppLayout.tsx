'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SupportChat from '@/components/SupportChat';

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-500">
        Loading your wallet...
      </main>
    );
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <Sidebar />
        <main className="min-h-0 w-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <SupportChat />
    </div>
  );
}
