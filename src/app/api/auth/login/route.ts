import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

const loginSchema = z.object({
  employeeId: z.string().trim().min(1).max(30),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { employeeId: input.employeeId.toUpperCase() } });
    if (!user || !user.isActive || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid employee ID or password.' }, { status: 401 });
    }
    await createSession(user);
    const destination = user.role === 'ADMIN' ? '/Admin' : user.role === 'MANAGEMENT' ? '/mgmt' : user.role === 'FOOD_COLLECTION_STAFF' ? '/collection' : '/';
    return NextResponse.json({ role: user.role, destination });
  } catch {
    return NextResponse.json({ error: 'Enter a valid employee ID and password.' }, { status: 400 });
  }
}
