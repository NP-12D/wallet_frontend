import ProtectedAppLayout from '@/components/ProtectedAppLayout';

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
