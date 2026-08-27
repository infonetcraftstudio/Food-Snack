import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'development-secret-change-me');

async function roleFromRequest(request: NextRequest, requiredRole: string) {
  const cookieName = requiredRole === 'ADMIN' ? 'food_admin_access' : requiredRole === 'MANAGEMENT' ? 'food_management_access' : 'food_collection_access';
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.toLowerCase();
  const requiredRole = path === '/admin' || path.startsWith('/admin/') ? 'ADMIN' : path === '/mgmt' || path.startsWith('/mgmt/') ? 'MANAGEMENT' : path === '/collection' || path.startsWith('/collection/') ? 'FOOD_COLLECTION_STAFF' : null;
  if (!requiredRole) return NextResponse.next();
  const role = await roleFromRequest(request, requiredRole);
  if (!role) return NextResponse.next();
  if (requiredRole === 'MANAGEMENT' && (role === 'MANAGEMENT' || role === 'ADMIN')) return NextResponse.next();
  if (requiredRole === 'FOOD_COLLECTION_STAFF' && (role === 'FOOD_COLLECTION_STAFF' || role === 'ADMIN')) return NextResponse.next();
  if (role === requiredRole) return NextResponse.next();
  return NextResponse.redirect(new URL(role === 'ADMIN' ? '/Admin' : role === 'MANAGEMENT' ? '/mgmt' : role === 'FOOD_COLLECTION_STAFF' ? '/collection' : '/', request.url));
}

export const config = { matcher: ['/Admin/:path*', '/admin/:path*', '/mgmt/:path*', '/collection/:path*'] };
