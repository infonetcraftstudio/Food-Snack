import { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { AccessGateForm } from '@/components/AccessGateForm';
import { WorkspaceSession } from '@/components/WorkspaceSession';

export async function AccessGate({ area, title, children }: { area: 'ADMIN' | 'MANAGEMENT' | 'FOOD_COLLECTION_STAFF'; title: string; children: ReactNode }) {
  const session = await getSession(area);
  if (!session) return <AccessGateForm area={area} title={title} />;
  return <><WorkspaceSession area={area} />{children}</>;
}
