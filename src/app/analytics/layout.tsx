// src/app/dashboard/layout.tsx
import ProtectedAppLayout from '@/components/ProtectedAppLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
