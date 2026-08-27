import { AccessGate } from '@/components/AccessGate';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate area="ADMIN" title="Admin access">{children}</AccessGate>;
}
