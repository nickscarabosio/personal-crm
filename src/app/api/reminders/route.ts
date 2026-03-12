import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  const body = await req.json();

  if (!body.dealId || !body.title || !body.dueDate) {
    return NextResponse.json(
      { error: 'Missing required fields: dealId, title, dueDate' },
      { status: 400 }
    );
  }

  // Verify the contact/deal exists
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('id', body.dealId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: 'Deal/contact not found' }, { status: 404 });
  }

  // Set the follow-up on the contact
  const { error: updateError } = await supabase
    .from('contacts')
    .update({
      follow_up_date: body.dueDate,
      follow_up_type: body.type || 'task',
      follow_up_note: body.description || body.title,
    })
    .eq('id', body.dealId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Also log as an interaction for audit trail
  const { data: interaction, error: interactionError } = await supabase
    .from('interactions')
    .insert({
      contact_id: body.dealId,
      type: 'note',
      date: new Date().toISOString(),
      summary: `Reminder set: ${body.title} (due ${body.dueDate})`,
      follow_up_date: body.dueDate,
    })
    .select()
    .single();

  if (interactionError) {
    return NextResponse.json({ error: interactionError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: interaction.id,
      dealId: body.dealId,
      contactName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
      title: body.title,
      dueDate: body.dueDate,
      description: body.description || null,
      created: true,
    },
    { status: 201 }
  );
}
