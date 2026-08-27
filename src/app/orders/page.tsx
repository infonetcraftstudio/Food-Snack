import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck, ShoppingBasket } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { WorkspaceSession } from '@/components/WorkspaceSession';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'EMPLOYEE') redirect('/login');
  const orders = await db.order.findMany({ where: { employeeId: user.id, status: 'ORDERED' }, include: { service: true, orderItems: { include: { menuItem: true } } }, orderBy: { orderDate: 'desc' } });
  return <><WorkspaceSession area="EMPLOYEE" /><main className="orders-page"><Link href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</Link><header className="orders-header"><p className="eyebrow">Employee workspace</p><h1>My orders</h1><p className="muted">Your current food and snack bookings.</p></header><OrderNav current="current" />{orders.length === 0 ? <EmptyOrders title="No current orders" detail="Orders you place for open services will appear here." action="Browse services" href="/order" /> : <OrderList orders={orders} />}</main></>;
}

export type EmployeeOrder = Awaited<ReturnType<typeof db.order.findMany<{ include: { service: true; orderItems: { include: { menuItem: true } } } }>>>;

export function OrderList({ orders }: { orders: EmployeeOrder }) {
  return <div className="order-history-list">{orders.map((order) => <article className="employee-order-card" key={order.id}><div className="employee-order-top"><div><span className="type-label">{order.service.type}</span><h2>{order.service.name}</h2><small>{new Date(order.orderDate).toLocaleDateString()}</small></div><span className={`booking-state ${order.collectionStatus === 'COLLECTED' ? 'open' : ''}`}>{order.collectionStatus === 'COLLECTED' ? 'COLLECTED' : 'PENDING COLLECTION'}</span></div><div className="order-items">{order.orderItems.map((item) => <p key={item.id}>{item.menuItem.name} <strong>× {item.quantity}</strong></p>)}</div><div className="order-status-line">{order.collectionStatus === 'COLLECTED' ? <CheckCircle2 size={16} /> : <Clock3 size={16} />} {order.collectionStatus === 'COLLECTED' ? 'Collected successfully' : 'Ready to collect after employee verification'}</div></article>)}</div>;
}

export function EmptyOrders({ title, detail, action, href }: { title: string; detail: string; action: string; href: string }) { return <div className="empty-state"><div className="empty-icon"><ShoppingBasket size={23} /></div><h3>{title}</h3><p>{detail}</p><Link className="primary-button" href={href}>{action} <PackageCheck size={16} /></Link></div>; }

export function OrderNav({ current }: { current: 'current' | 'history' }) { return <nav className="order-nav"><Link className={current === 'current' ? 'selected' : ''} href="/orders">My orders</Link><Link className={current === 'history' ? 'selected' : ''} href="/orders/history">Order history</Link></nav>; }
