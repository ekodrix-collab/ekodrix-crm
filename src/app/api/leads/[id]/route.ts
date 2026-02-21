import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Lead } from '@/types';

// GET - Fetch single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select(
        `
        *,
        assigned_user:users!assigned_to(id, name, email, avatar_url, phone),
        created_by_user:users!created_by(id, name)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      console.error('Error fetching lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fetch interactions and tasks count
    const { count: interactionsCount } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', id);

    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', id)
      .eq('status', 'pending');

    return NextResponse.json({
      data: {
        ...lead,
        interactions_count: interactionsCount || 0,
        pending_tasks_count: tasksCount || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/leads/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update lead
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

    // Get current lead data to check for status change
    const { data: currentLead } = await supabase
      .from('leads')
      .select('status, assigned_to')
      .eq('id', id)
      .single();

    // Get update fields from body
    const { update_last_contacted, ...updateFields } = body;

    // Prepare update data
    const updateData: Partial<Lead> = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    // If assigning to someone new, update assigned_at
    if (body.assigned_to && body.assigned_to !== currentLead?.assigned_to) {
      updateData.assigned_at = new Date().toISOString();
    }

    // If status changed to converted, set converted_at
    if (body.status === 'converted' && currentLead?.status !== 'converted') {
      updateData.converted_at = new Date().toISOString();
    }

    // Update last_contacted_at if this is from an interaction
    if (update_last_contacted) {
      updateData.last_contacted_at = new Date().toISOString();
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        assigned_user:users!assigned_to(id, name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A lead with this phone, email, or social handle already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error('Error in PUT /api/leads/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (optional - you might want to restrict deletion)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Delete the lead (cascades to interactions and tasks)
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}