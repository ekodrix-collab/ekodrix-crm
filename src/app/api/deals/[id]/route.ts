import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Deal } from '@/types';

// GET - Fetch single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: deal, error } = await supabase
      .from('deals')
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name, email, status),
        owner:users!owner_id(id, name, email, avatar_url),
        payments(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      console.error('Error fetching deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: deal });
  } catch (error) {
    console.error('Error in GET /api/deals/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update deal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const body = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current deal to check stage change
    const { data: currentDeal } = await supabase
      .from('deals')
      .select('stage, lead_id')
      .eq('id', id)
      .single();

    // Prepare update data
    const updateData: Partial<Deal> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // If stage changed to 'won', set won_date
    if (body.stage === 'won' && currentDeal?.stage !== 'won') {
      updateData.won_date = new Date().toISOString().split('T')[0];

      // Update lead status to 'converted'
      if (currentDeal?.lead_id) {
        await supabase
          .from('leads')
          .update({
            status: 'converted',
            converted_at: new Date().toISOString(),
          })
          .eq('id', currentDeal.lead_id);
      }
    }

    // If stage changed to 'lost', set lost_date
    if (body.stage === 'lost' && currentDeal?.stage !== 'lost') {
      updateData.lost_date = new Date().toISOString().split('T')[0];

      // Update lead status to 'lost'
      if (currentDeal?.lead_id) {
        await supabase
          .from('leads')
          .update({
            status: 'lost',
            lost_reason: body.lost_reason,
          })
          .eq('id', currentDeal.lead_id);
      }
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name),
        owner:users!owner_id(id, name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: deal });
  } catch (error) {
    console.error('Error in PUT /api/deals/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { error } = await supabase.from('deals').delete().eq('id', id);

    if (error) {
      console.error('Error deleting deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/deals/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}