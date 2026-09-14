import { NextResponse } from 'next/server';
import { buildSessionClearCookie } from '@/lib/auth';

/** Clears the session cookie. */
export async function POST() {
  return NextResponse.json(
    { authenticated: false },
    { headers: { 'Set-Cookie': buildSessionClearCookie() } }
  );
}
