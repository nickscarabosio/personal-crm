import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('contacts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    // Use pattern parameter to avoid injection attacks
    // PostgREST's .or() supports comma-separated conditions
    const pattern = `%${search}%`;
    query = query.or(
      `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company_name.ilike.${pattern}`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const contacts = (data || []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name || ''}`.trim(),
    email: c.email,
    company: c.company_name,
    phone: c.phone,
    role: c.role,
    status: c.status,
    source: c.source,
    lastContactedAt: c.last_contacted_at,
    createdAt: c.created_at,
  }));

  return NextResponse.json(contacts);
}
