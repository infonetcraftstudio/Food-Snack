import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const shiftSchema = z.object({ name: z.string().trim().min(2).max(80), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), isActive: z.boolean().default(true) });

export async function POST(request: Request) {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const input = shiftSchema.parse(await request.json());
    if (input.isActive && await db.shift.count({ where: { isActive: true } }) >= 6) return NextResponse.json({ error: 'Only 6 active shifts are allowed. Deactivate an existing shift first.' }, { status: 422 });
    const shift = await db.$transaction(async (tx) => {
      const created = await tx.shift.create({ data: input });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'SHIFT_CREATED', entity: 'Shift', entityId: created.id, newValue: JSON.stringify(input) } });
      return created;
    });
    return NextResponse.json(shift, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Enter a unique shift name and valid 24-hour times.' }, { status: 400 });
  }
}

export async function GET() {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json({ shifts: await db.shift.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }) });
}

export async function PATCH(request: Request) {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const input = shiftSchema.extend({ id: z.string().min(1) }).parse(await request.json());
    if (input.isActive && await db.shift.count({ where: { isActive: true, id: { not: input.id } } }) >= 6) return NextResponse.json({ error: 'Only 6 active shifts are allowed.' }, { status: 422 });
    const previous = await db.shift.findUnique({ where: { id: input.id } });
    if (!previous) return NextResponse.json({ error: 'Shift not found.' }, { status: 404 });
    const updated = await db.$transaction(async (tx) => {
      const shift = await tx.shift.update({ where: { id: input.id }, data: { name: input.name, startTime: input.startTime, endTime: input.endTime, isActive: input.isActive } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'SHIFT_UPDATED', entity: 'Shift', entityId: shift.id, previousValue: JSON.stringify(previous), newValue: JSON.stringify(shift) } });
      return shift;
    });
    return NextResponse.json(updated);
  } catch { return NextResponse.json({ error: 'Invalid shift update or duplicate shift name.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Shift ID is required.' }, { status: 400 });
  try {
    const previous = await db.shift.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'Shift not found.' }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.shift.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'SHIFT_DEACTIVATED', entity: 'Shift', entityId: id, previousValue: JSON.stringify(previous), newValue: JSON.stringify({ isActive: false }) } });
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Shift cannot be deleted while it has dependent records.' }, { status: 409 }); }
}
