import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const userSchema = z.object({ employeeId: z.string().trim().min(1).max(30), fullName: z.string().trim().min(2).max(120), password: z.string().min(8).max(128), department: z.string().trim().max(100).optional(), designation: z.string().trim().max(100).optional(), role: z.enum(['EMPLOYEE', 'MANAGEMENT', 'ADMIN', 'FOOD_COLLECTION_STAFF']), shiftId: z.string().nullable().optional() });

export async function GET() {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json({ users: await db.user.findMany({ select: { id: true, employeeId: true, fullName: true, department: true, designation: true, role: true, isActive: true, shift: true, createdAt: true }, orderBy: { fullName: 'asc' } }) });
}

export async function POST(request: Request) {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const input = userSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { employeeId: input.employeeId.toUpperCase(), fullName: input.fullName, passwordHash, department: input.department, designation: input.designation, role: input.role, shiftId: input.shiftId } });
      await tx.auditLog.create({ data: { actorId: session!.userId, actorRole: session!.role, action: 'USER_CREATED', entity: 'User', entityId: created.id, newValue: JSON.stringify({ ...input, password: '[redacted]' }) } });
      return created;
    });
    return NextResponse.json({ id: user.id, employeeId: user.employeeId }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Invalid user details or duplicate employee ID.' }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const actorId = session.userId;
  try {
    const input = userSchema.partial().extend({ id: z.string().min(1), password: z.string().min(8).max(128).optional() }).parse(await request.json());
    const previous = await db.user.findUnique({ where: { id: input.id } });
    if (!previous) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const { id, password, ...changes } = input;
    const data = { ...changes, ...(changes.employeeId ? { employeeId: changes.employeeId.toUpperCase() } : {}), ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) };
    const updated = await db.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data });
      await tx.auditLog.create({ data: { actorId, actorRole: session.role, action: password ? 'USER_UPDATED_PASSWORD' : 'USER_UPDATED', entity: 'User', entityId: id, previousValue: JSON.stringify({ ...previous, passwordHash: '[redacted]' }), newValue: JSON.stringify({ ...user, passwordHash: password ? '[redacted]' : '[unchanged]' }) } });
      return user;
    });
    return NextResponse.json({ id: updated.id, employeeId: updated.employeeId });
  } catch { return NextResponse.json({ error: 'Invalid user update or duplicate employee ID.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const session = await getSession('ADMIN');
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const actorId = session.userId;
  const id = new URL(request.url).searchParams.get('id');
  if (!id || id === session.userId) return NextResponse.json({ error: 'A valid user other than your own account is required.' }, { status: 400 });
  try {
    const previous = await db.user.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({ data: { actorId, actorRole: session.role, action: 'USER_DEACTIVATED', entity: 'User', entityId: id, previousValue: JSON.stringify({ ...previous, passwordHash: '[redacted]' }), newValue: JSON.stringify({ isActive: false }) } });
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'User could not be deactivated.' }, { status: 409 }); }
}
