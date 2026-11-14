'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function signIn(email: string, password: string) {
  const result = await auth.api.signInEmail({
    body: { email, password },
  });
  return result;
}

export async function signUp(email: string, password: string, name: string) {
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });
  return result;
}

export async function signOut() {
  const result = await auth.api.signOut({
    headers: await headers(),
  });
  return result;
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function updateUserRole(userId: string, role: string) {
  // This would require admin permission check
  const session = await getSession();
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Forbidden');
  }

  // Implementation depends on Better Auth admin API
  // For now, return placeholder
  return { ok: true };
}