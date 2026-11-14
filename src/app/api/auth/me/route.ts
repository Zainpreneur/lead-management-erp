import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie');
  const sessionMatch = cookie?.match(/session=([^;]+)/);
  const sessionId = sessionMatch?.[1];
  
  if (!sessionId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  
  const user = getSession(sessionId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  
  return NextResponse.json({ user });
}