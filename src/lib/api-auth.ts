import { NextRequest, NextResponse } from 'next/server';

export function validateApiKey(req: NextRequest): NextResponse | null {
  const apiKey = process.env.CRM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'CRM_API_KEY not configured' },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  if (token !== apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  return null; // Auth passed
}
