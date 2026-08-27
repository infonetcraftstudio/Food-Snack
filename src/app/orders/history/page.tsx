import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { WorkspaceSession } from '@/components/WorkspaceSession';
import { EmptyOrders, OrderList, OrderNav } from '@/app/orders/page';

export const dynamic = 'force-dynamic';

export default async function OrderHistoryPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'EMPLOYEE') redirect('/login');
  const orders = await db.order.findMany({ where: { employeeId: user.id }, include: { service: true, orderItems: { include: { menuItem: true } } }, orderBy: { orderDate: 'desc' } });
  return <><WorkspaceSession area="EMPLOYEE" /><main className="orders-page"><Link href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</Link><header className="orders-header"><p className="eyebrow">Employee workspace</p><h1>Order history</h1><p className="muted">A record of your previous food and snack orders.</p></header><OrderNav current="history" />{orders.length === 0 ? <EmptyOrders title="No order history" detail="Your completed and cancelled orders will appear here." action="Browse services" href="/order" /> : <OrderList orders={orders} />}</main></>;
}
