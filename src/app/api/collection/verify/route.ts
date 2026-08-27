import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const schema = z.object({ employeeId: z.string().trim().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getSession('FOOD_COLLECTION_STAFF');
  if (!session || !['FOOD_COLLECTION_STAFF', 'ADMIN'].includes(session.role)) return NextResponse.json({ error: 'Collection desk access required.' }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const employee = await db.user.findUnique({ where: { employeeId: input.employeeId.toUpperCase() }, include: { shift: true, orders: { where: { status: 'ORDERED', collectionStatus: 'PENDING' }, include: { service: true, orderItems: { include: { menuItem: true } } }, orderBy: { orderDate: 'desc' } } } });
    if (!employee || employee.role !== 'EMPLOYEE' || !employee.isActive || !(await bcrypt.compare(input.password, employee.passwordHash))) return NextResponse.json({ error: 'Employee verification failed.' }, { status: 401 });
    return NextResponse.json({ employee: { employeeId: employee.employeeId, fullName: employee.fullName, shift: employee.shift?.name ?? null }, orders: employee.orders });
  } catch {
    return NextResponse.json({ error: 'Enter valid employee credentials.' }, { status: 400 });
  }
}
