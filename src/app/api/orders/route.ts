import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { bookingState } from '@/lib/booking';

const orderSchema = z.object({ serviceId: z.string().min(1), items: z.array(z.object({ menuItemId: z.string().min(1), quantity: z.number().int().min(1).max(50) })).min(1) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE' || !session.userId) return NextResponse.json({ error: 'Employee access required.' }, { status: 403 });
  const employeeId = session.userId;
  try {
    const input = orderSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { id: session.userId }, select: { shiftId: true } });
    if (!user?.shiftId) return NextResponse.json({ error: 'You need an assigned shift before ordering.' }, { status: 422 });
    const service = await db.service.findFirst({ where: { id: input.serviceId, shiftId: user.shiftId, isActive: true }, include: { menuItems: true } });
    if (!service || bookingState(service) !== 'OPEN') return NextResponse.json({ error: 'This service is not currently open.' }, { status: 409 });
    const requested = new Map(input.items.map((item) => [item.menuItemId, item.quantity]));
    const items = service.menuItems.filter((item) => requested.has(item.id));
    if (items.length !== requested.size) return NextResponse.json({ error: 'One or more menu items are unavailable.' }, { status: 400 });
    for (const item of items) {
      const quantity = requested.get(item.id)!;
      if (quantity > item.maxPerEmployee) return NextResponse.json({ error: `${item.name} exceeds the per-employee limit.` }, { status: 422 });
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const order = await db.$transaction(async (tx) => {
      for (const item of items) {
        const quantity = requested.get(item.id)!;
        const changed = await tx.menuItem.updateMany({ where: { id: item.id, availableQty: { gte: quantity }, isActive: true }, data: { availableQty: { decrement: quantity }, orderedQty: { increment: quantity } } });
        if (changed.count !== 1) throw new Error(`INSUFFICIENT:${item.name}`);
      }
      const created = await tx.order.create({ data: { employeeId, shiftId: user.shiftId!, serviceId: service.id, orderDate: today, orderItems: { create: items.map((item) => ({ menuItemId: item.id, quantity: requested.get(item.id)! })) } }, include: { orderItems: true } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'ORDER_CREATED', entity: 'Order', entityId: created.id, newValue: JSON.stringify(input) } });
      return created;
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('INSUFFICIENT:')) return NextResponse.json({ error: `${error.message.slice(12)} has insufficient quantity available.` }, { status: 409 });
    return NextResponse.json({ error: 'Unable to place this order. You may already have an order for this service today.' }, { status: 400 });
  }
}
