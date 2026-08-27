import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const schema = z.object({ orderId: z.string().min(1), employeeId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getSession('FOOD_COLLECTION_STAFF');
  if (!session || !['FOOD_COLLECTION_STAFF', 'ADMIN'].includes(session.role)) return NextResponse.json({ error: 'Collection desk access required.' }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const order = await db.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({ where: { id: input.orderId, employee: { employeeId: input.employeeId.toUpperCase() }, status: 'ORDERED', collectionStatus: 'PENDING' }, data: { collectionStatus: 'COLLECTED', collectedAt: new Date() } });
      if (updated.count !== 1) throw new Error('NOT_PENDING');
      const result = await tx.order.findUniqueOrThrow({ where: { id: input.orderId }, include: { orderItems: true } });
      for (const item of result.orderItems) await tx.menuItem.update({ where: { id: item.menuItemId }, data: { collectedQty: { increment: item.quantity } } });
      await tx.collectionLog.create({ data: { orderId: result.id, employeeId: result.employeeId, collectedAt: new Date(), status: 'COLLECTED' } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'COLLECTION_CONFIRMED', entity: 'Order', entityId: result.id } });
      return result;
    });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'No pending order found. It may already be collected.' }, { status: 409 });
  }
}
