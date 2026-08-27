import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canManage } from '@/lib/auth';

const menuSchema = z.object({ serviceId: z.string().min(1), name: z.string().trim().min(2).max(100), description: z.string().trim().max(300).nullable().optional(), category: z.enum(['FOOD', 'SNACK']), availableQty: z.number().int().min(0), maxPerEmployee: z.number().int().min(1).max(50) });

export async function POST(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  try {
    const input = menuSchema.parse(await request.json());
    const item = await db.$transaction(async (tx) => {
      const created = await tx.menuItem.create({ data: input });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'MENU_ITEM_CREATED', entity: 'MenuItem', entityId: created.id, newValue: JSON.stringify(input) } });
      return created;
    });
    return NextResponse.json(item, { status: 201 });
  } catch { return NextResponse.json({ error: 'Invalid menu item details.' }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  try {
    const { id, ...changes } = menuSchema.partial().extend({ id: z.string().min(1) }).parse(await request.json());
    const previous = await db.menuItem.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'Menu item not found.' }, { status: 404 });
    const item = await db.$transaction(async (tx) => {
      const updated = await tx.menuItem.update({ where: { id }, data: changes });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'MENU_ITEM_UPDATED', entity: 'MenuItem', entityId: id, previousValue: JSON.stringify(previous), newValue: JSON.stringify(updated) } });
      return updated;
    });
    return NextResponse.json(item);
  } catch { return NextResponse.json({ error: 'Invalid menu item update.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const session = await getSession('MANAGEMENT');
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Management access required.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Menu item ID is required.' }, { status: 400 });
  try {
    const previous = await db.menuItem.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'Menu item not found.' }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.menuItem.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({ data: { actorId: session.userId, actorRole: session.role, action: 'MENU_ITEM_DEACTIVATED', entity: 'MenuItem', entityId: id, previousValue: JSON.stringify(previous), newValue: JSON.stringify({ isActive: false }) } });
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Menu item could not be removed.' }, { status: 409 }); }
}
