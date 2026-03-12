import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  const { id } = await params;

  const { data, error } = await supabase
    .from('contacts')
    .select('*, pipeline_stages!contacts_pipeline_stage_id_fkey(id, label, weight, color)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch tags
  const { data: contactTags } = await supabase
    .from('contact_tags')
    .select('tag_id')
    .eq('contact_id', id);

  const tagIds = (contactTags || []).map((ct) => ct.tag_id);
  let tags: { id: string; label: string; color: string }[] = [];
  if (tagIds.length > 0) {
    const { data: tagsData } = await supabase
      .from('tags')
      .select('id, label, color')
      .in('id', tagIds);
    tags = tagsData || [];
  }

  // Fetch interactions
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', id)
    .order('date', { ascending: false })
    .limit(10);

  const deal = {
    id: data.id,
    title: `${data.first_name} ${data.last_name || ''}`.trim(),
    firstName: data.first_name,
    lastName: data.last_name,
    status: data.status,
    value: data.pipeline_stages?.weight ?? 0,
    stage: data.pipeline_stages
      ? { id: data.pipeline_stages.id, label: data.pipeline_stages.label, weight: data.pipeline_stages.weight, color: data.pipeline_stages.color }
      : null,
    owner: data.company_name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    linkedinUrl: data.linkedin_url,
    source: data.source,
    notes: data.notes,
    goal: data.goal,
    goalTargetDate: data.goal_target_date,
    followUpDate: data.follow_up_date,
    followUpType: data.follow_up_type,
    followUpNote: data.follow_up_note,
    lastContactedAt: data.last_contacted_at,
    tags,
    recentInteractions: interactions || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json(deal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();

  // Map API fields to database columns
  const updateFields: Record<string, unknown> = {};

  if (body.status !== undefined) updateFields.status = body.status;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.goal !== undefined) updateFields.goal = body.goal;
  if (body.goalTargetDate !== undefined) updateFields.goal_target_date = body.goalTargetDate;
  if (body.followUpDate !== undefined) updateFields.follow_up_date = body.followUpDate;
  if (body.followUpType !== undefined) updateFields.follow_up_type = body.followUpType;
  if (body.followUpNote !== undefined) updateFields.follow_up_note = body.followUpNote;
  if (body.pipelineStageId !== undefined) updateFields.pipeline_stage_id = body.pipelineStageId;
  if (body.email !== undefined) updateFields.email = body.email;
  if (body.phone !== undefined) updateFields.phone = body.phone;
  if (body.role !== undefined) updateFields.role = body.role;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    title: `${data.first_name} ${data.last_name || ''}`.trim(),
    status: data.status,
    notes: data.notes,
    updatedAt: data.updated_at,
  });
}
