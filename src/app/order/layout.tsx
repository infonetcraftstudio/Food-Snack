import { WorkspaceSession } from '@/components/WorkspaceSession';

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <><WorkspaceSession area="EMPLOYEE" />{children}</>;
}
