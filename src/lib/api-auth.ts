import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

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
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    const tokenBuffer = Buffer.from(token);
    const keyBuffer = Buffer.from(apiKey);
    
    // Length check first (required for timingSafeEqual)
    if (tokenBuffer.length !== keyBuffer.length) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    const match = timingSafeEqual(tokenBuffer, keyBuffer);
    if (!match) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  return null; // Auth passed
}
