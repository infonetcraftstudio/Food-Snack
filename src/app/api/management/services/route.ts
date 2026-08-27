import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canManage } from '@/lib/auth';

const serviceSchema = z.object({ name: z.string().trim().min(2).max(100), type: z.enum(['FOOD', 'SNACK']), shiftId: z.string().min(1), serviceDate: z.string().datetime(), bookingMode: z.enum(['AUTOMATIC', 'MANUAL']).default('MANUAL'), opensAt: z.string().datetime().nullable().optional(), closesAt: z.string().datetime().nullable().optional(), allowEdit: z.boolean().default(true), allowCancel: z.boolean().default(true) });

export async function GET() {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  return NextResponse.json({ services: await db.service.findMany({ where: { isActive: true }, include: { shift: true, menuItems: { where: { isActive: true } } }, orderBy: { serviceDate: 'desc' } }) });
}

export async function POST(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  try {
    const input = serviceSchema.parse(await request.json());
    const shift = await db.shift.findFirst({ where: { id: input.shiftId, isActive: true } });
    if (!shift) return NextResponse.json({ error: 'Select an active shift.' }, { status: 422 });
    const service = await db.$transaction(async (tx) => {
      const created = await tx.service.create({ data: { ...input, serviceDate: new Date(input.serviceDate), opensAt: input.opensAt ? new Date(input.opensAt) : null, closesAt: input.closesAt ? new Date(input.closesAt) : null } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'SERVICE_CREATED', entity: 'Service', entityId: created.id, newValue: JSON.stringify(input) } });
      return created;
    });
    return NextResponse.json(service, { status: 201 });
  } catch { return NextResponse.json({ error: 'Invalid service details.' }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  try {
    const input = serviceSchema.partial().extend({ id: z.string().min(1) }).parse(await request.json());
    const { id, serviceDate, opensAt, closesAt, ...changes } = input;
    const previous = await db.service.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    const service = await db.$transaction(async (tx) => {
      const updated = await tx.service.update({ where: { id }, data: { ...changes, ...(serviceDate ? { serviceDate: new Date(serviceDate) } : {}), ...(opensAt ? { opensAt: new Date(opensAt) } : {}), ...(closesAt ? { closesAt: new Date(closesAt) } : {}) } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'SERVICE_UPDATED', entity: 'Service', entityId: id, previousValue: JSON.stringify(previous), newValue: JSON.stringify(updated) } });
      return updated;
    });
    return NextResponse.json(service);
  } catch { return NextResponse.json({ error: 'Invalid service update.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
  try {
    const previous = await db.service.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.service.update({ where: { id }, data: { isActive: false, manualOpen: false } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'SERVICE_DEACTIVATED', entity: 'Service', entityId: id, previousValue: JSON.stringify(previous), newValue: JSON.stringify({ isActive: false }) } });
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Service could not be removed.' }, { status: 409 }); }
}
