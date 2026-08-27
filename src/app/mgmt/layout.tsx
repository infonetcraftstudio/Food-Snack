import { AccessGate } from '@/components/AccessGate';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate area="MANAGEMENT" title="Management access">{children}</AccessGate>;
}
