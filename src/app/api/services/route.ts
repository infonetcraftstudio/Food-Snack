import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { bookingState } from '@/lib/booking';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE' || !session.userId) return NextResponse.json({ error: 'Employee access required.' }, { status: 403 });
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { shiftId: true } });
  if (!user?.shiftId) return NextResponse.json({ services: [] });
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);
  const services = await db.service.findMany({ where: { shiftId: user.shiftId, serviceDate: { gte: startOfDay, lt: startOfNextDay }, isActive: true }, include: { menuItems: { where: { isActive: true }, orderBy: { name: 'asc' } } }, orderBy: { opensAt: 'asc' } });
  return NextResponse.json({ services: services.map((service) => ({ ...service, state: bookingState(service) })) });
}
