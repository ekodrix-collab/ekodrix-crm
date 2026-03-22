import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const data = await request.json();

    const {
      type,
      direction,
      summary,
      outcome,
      call_duration,
      status_before,
      status_after,
      lead_id,
    } = data;

    // 1. Update the interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .update({
        type,
        direction,
        summary,
        outcome,
        call_duration,
        status_before,
        status_after,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (interactionError) {
      return NextResponse.json({ error: interactionError.message }, { status: 500 });
    }

    // 2. If status was updated, update the lead status
    if (status_after && lead_id) {
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: status_after,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);

      if (leadError) {
        console.error('Error updating lead status:', leadError);
        // We continue anyway as the interaction was recorded
      }
    }

    return NextResponse.json({ data: interaction });
  } catch (error) {
    console.error('Error updating interaction:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
