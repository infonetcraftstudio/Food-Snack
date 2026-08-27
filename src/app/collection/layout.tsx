import { AccessGate } from '@/components/AccessGate';

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate area="FOOD_COLLECTION_STAFF" title="Collection desk access">{children}</AccessGate>;
}
