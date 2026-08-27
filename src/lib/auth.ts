import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';
import type { Role, User } from '@prisma/client';

const COOKIE_NAME = 'food_session';
const ACCESS_COOKIE_NAMES = ['food_admin_access', 'food_management_access', 'food_collection_access'] as const;
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'development-secret-change-me');

type Session = { userId?: string; role: Role; employeeId?: string };

export async function createSession(user: Pick<User, 'id' | 'role' | 'employeeId'>) {
  const token = await new SignJWT({ userId: user.id, role: user.role, employeeId: user.employeeId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
}

export async function createAccessSession(role: Role) {
  const token = await new SignJWT({ role, accessOnly: true })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret);
  const cookieName = role === 'ADMIN' ? 'food_admin_access' : role === 'MANAGEMENT' ? 'food_management_access' : 'food_collection_access';
  (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8, path: '/' });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  for (const name of ACCESS_COOKIE_NAMES) cookieStore.delete(name);
}

export async function getSession(requiredRole?: Role): Promise<Session | null> {
  const cookieStore = await cookies();
  const roleCookie = requiredRole === 'ADMIN' ? 'food_admin_access' : requiredRole === 'MANAGEMENT' ? 'food_management_access' : requiredRole === 'FOOD_COLLECTION_STAFF' ? 'food_collection_access' : null;
  const tokens = (roleCookie ? [cookieStore.get(roleCookie)?.value, cookieStore.get(COOKIE_NAME)?.value] : [cookieStore.get(COOKIE_NAME)?.value, ...ACCESS_COOKIE_NAMES.map((name) => cookieStore.get(name)?.value)]).filter(Boolean) as string[];
  for (const token of tokens) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.role === 'string' && (!requiredRole || payload.role === requiredRole || (requiredRole === 'MANAGEMENT' && payload.role === 'ADMIN') || (requiredRole === 'FOOD_COLLECTION_STAFF' && payload.role === 'ADMIN'))) return { userId: typeof payload.userId === 'string' ? payload.userId : undefined, role: payload.role as Role, employeeId: typeof payload.employeeId === 'string' ? payload.employeeId : undefined };
    } catch { /* Try the next session cookie. */ }
  }
  return null;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  return db.user.findUnique({ where: { id: session.userId }, include: { shift: true } });
}

export function canManage(role: Role) {
  return role === 'ADMIN' || role === 'MANAGEMENT';
}
