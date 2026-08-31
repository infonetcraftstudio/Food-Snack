import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSession } from '@/lib/auth';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const area = url.searchParams.get('area') ?? (await request.json().catch(() => ({}))).area;
  const redirectToLogin = url.searchParams.get('redirect') === '1';
  const cookieStore = await cookies();

  if (area === 'ADMIN') cookieStore.delete('food_admin_access');
  else if (area === 'MANAGEMENT') cookieStore.delete('food_management_access');
  else if (area === 'FOOD_COLLECTION_STAFF') cookieStore.delete('food_collection_access');
  else if (area === 'EMPLOYEE') cookieStore.delete('food_session');
  else await clearSession();

  if (redirectToLogin) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.json({ ok: true });
}
