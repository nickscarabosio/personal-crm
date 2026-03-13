import { NextRequest, NextResponse } from 'next/server';

const TOKEN_NAME = 'nexus_session';

async function expectedToken() {
  const password = process.env.CRM_PASSWORD;
  if (!password) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '__nexus_salt__');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page, API routes (they have their own auth), and static assets through
  if (
    pathname === '/login' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // If no password is configured, allow all access (dev mode)
  const expected = await expectedToken();
  if (!expected) return NextResponse.next();

  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (token === expected) return NextResponse.next();

  // Redirect to login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
