import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const stage = searchParams.get('stage');

  let query = supabase
    .from('contacts')
    .select('*, pipeline_stages!contacts_pipeline_stage_id_fkey(id, label, weight, color)')
    .not('pipeline_stage_id', 'is', null)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (stage) {
    query = query.eq('pipeline_stage_id', stage);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deals = (data || []).map((c) => ({
    id: c.id,
    title: `${c.first_name} ${c.last_name || ''}`.trim(),
    status: c.status,
    value: c.pipeline_stages?.weight ?? 0,
    stage: c.pipeline_stages
      ? { id: c.pipeline_stages.id, label: c.pipeline_stages.label, weight: c.pipeline_stages.weight, color: c.pipeline_stages.color }
      : null,
    owner: c.company_name || null,
    email: c.email,
    notes: c.notes,
    goal: c.goal,
    followUpDate: c.follow_up_date,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json(deals);
}
