import ProtectedAppLayout from '@/components/ProtectedAppLayout';

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
