import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canManage } from '@/lib/auth';

const querySchema = z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional(), shiftId: z.string().optional(), serviceId: z.string().optional() });

export async function GET(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  const input = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const orders = await db.order.findMany({ where: { ...(input.from || input.to ? { orderDate: { ...(input.from ? { gte: new Date(input.from) } : {}), ...(input.to ? { lte: new Date(input.to) } : {}) } } : {}), ...(input.shiftId ? { shiftId: input.shiftId } : {}), ...(input.serviceId ? { serviceId: input.serviceId } : {}) }, include: { orderItems: { include: { menuItem: true } }, service: true, employee: { select: { employeeId: true, fullName: true } }, shift: true } });
  const summary = orders.reduce((result, order) => { result.orders += order.status === 'ORDERED' ? 1 : 0; result.collected += order.collectionStatus === 'COLLECTED' ? 1 : 0; result.notCollected += order.collectionStatus === 'NOT_COLLECTED' ? 1 : 0; for (const item of order.orderItems) result.quantity += item.quantity; return result; }, { orders: 0, collected: 0, notCollected: 0, quantity: 0 });
  return NextResponse.json({ summary, orders });
}
