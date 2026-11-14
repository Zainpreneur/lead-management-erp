import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/server/auth';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie');
  const sessionMatch = cookie?.match(/session=([^;]+)/);
  const sessionId = sessionMatch?.[1];
  
  if (sessionId) {
    deleteSession(sessionId);
  }
  
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('session');
  return response;
}