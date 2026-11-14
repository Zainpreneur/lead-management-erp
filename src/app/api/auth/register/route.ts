import { NextResponse } from 'next/server';
import { createUser } from '@/lib/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, role, team } = body;
    
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password required' }, { status: 400 });
    }
    
    const user = createUser({ email, name, password, role, team });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}