import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canManage } from '@/lib/auth';

const schema = z.object({ serviceId: z.string().min(1), action: z.enum(['OPEN', 'CLOSE', 'REOPEN', 'DISABLE', 'EXTEND']), reason: z.string().trim().max(200).optional(), endsAt: z.string().datetime().nullable().optional() });

export async function POST(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const service = await db.service.findUnique({ where: { id: input.serviceId } });
    if (!service) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    const actionData = input.action === 'OPEN' || input.action === 'REOPEN' ? { manualOpen: true, isActive: true } : input.action === 'CLOSE' || input.action === 'DISABLE' ? { manualOpen: false, ...(input.action === 'DISABLE' ? { isActive: false } : {}) } : {};
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.service.update({ where: { id: service.id }, data: actionData });
      await tx.bookingOverride.create({ data: { serviceId: service.id, action: input.action, reason: input.reason, endsAt: input.endsAt ? new Date(input.endsAt) : null, createdById: session.userId } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: `BOOKING_${input.action}`, entity: 'Service', entityId: service.id, previousValue: JSON.stringify({ manualOpen: service.manualOpen, isActive: service.isActive }), newValue: JSON.stringify(updated) } });
      return updated;
    });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: 'Invalid booking override.' }, { status: 400 }); }
}
