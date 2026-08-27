import { AccessGate } from '@/components/AccessGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate area="ADMIN" title="Admin access">{children}</AccessGate>;
}
