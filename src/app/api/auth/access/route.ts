import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAccessSession } from '@/lib/auth';

const schema = z.object({ area: z.enum(['ADMIN', 'MANAGEMENT', 'FOOD_COLLECTION_STAFF']), password: z.string().min(1).max(128) });
const passwords = { ADMIN: process.env.ADMIN_PAGE_PASSWORD ?? 'AdminPass123!', MANAGEMENT: process.env.MANAGEMENT_PAGE_PASSWORD ?? 'MgmtPass123!', FOOD_COLLECTION_STAFF: process.env.COLLECTION_PAGE_PASSWORD ?? 'CollectionPass123!' };

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    if (input.password !== passwords[input.area]) return NextResponse.json({ error: 'Incorrect page password.' }, { status: 401 });
    await createAccessSession(input.area);
    return NextResponse.json({ destination: input.area === 'ADMIN' ? '/Admin' : input.area === 'MANAGEMENT' ? '/mgmt' : '/collection' });
  } catch { return NextResponse.json({ error: 'Enter a valid password.' }, { status: 400 }); }
}
