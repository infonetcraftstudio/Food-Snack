import { AccessGate } from '@/components/AccessGate';

export default async function CollectionLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate area="FOOD_COLLECTION_STAFF" title="Collection desk access">{children}</AccessGate>;
}
