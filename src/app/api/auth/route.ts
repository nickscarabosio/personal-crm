import { NextRequest, NextResponse } from 'next/server';

const TOKEN_NAME = 'nexus_session';
// Session lasts 30 days
const MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.CRM_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: 'CRM_PASSWORD not configured' }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  // Create a simple token (hash of password + secret)
  const encoder = new TextEncoder();
  const data = encoder.encode(expected + '__nexus_salt__');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const token = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res;
}
