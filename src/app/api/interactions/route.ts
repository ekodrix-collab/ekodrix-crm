import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch interactions for a lead
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const leadId = searchParams.get('lead_id');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    let query = supabase
      .from('interactions')
      .select(
        `
        *,
        user:users!user_id(id, name, email, avatar_url),
        lead:leads!lead_id(id, name)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: interactions, error, count } = await query;

    if (error) {
      console.error('Error fetching interactions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: interactions,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Error in GET /api/interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new interaction
export async function POST(request: NextRequest) {
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

    // Prepare interaction data
    const interactionData = {
      lead_id: body.lead_id,
      user_id: user.id,
      type: body.type,
      direction: body.direction || null,
      summary: body.summary,
      outcome: body.outcome || null,
      call_duration: body.call_duration || null,
      meeting_location: body.meeting_location || null,
      meeting_link: body.meeting_link || null,
      status_before: body.status_before || null,
      status_after: body.status_after || null,
      attachments: body.attachments || [],
    };

    const { data: interaction, error } = await supabase
      .from('interactions')
      .insert([interactionData])
      .select(
        `
        *,
        user:users!user_id(id, name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error creating interaction:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 1. Update lead's basic info
    const leadUpdates: any = {
      last_contacted_at: new Date().toISOString(),
    };

    if (body.status_after) {
      leadUpdates.status = body.status_after;
    }

    if (body.next_follow_up_date) {
      leadUpdates.next_follow_up_date = body.next_follow_up_date;
    }

    // Perform the update
    await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', body.lead_id);

    // 2. Create follow-up task if requested
    if (body.create_task && body.next_follow_up_date) {
      try {
        await supabase.from('tasks').insert([
          {
            lead_id: body.lead_id,
            assigned_to: user.id,
            created_by: user.id,
            type: 'follow_up_call',
            title: `Follow up: ${body.summary.substring(0, 50)}${body.summary.length > 50 ? '...' : ''}`,
            due_date: body.next_follow_up_date,
            priority: 'medium',
            status: 'pending',
          },
        ]);
      } catch (taskError) {
        console.error('Error creating follow-up task in interaction log:', taskError);
        // We don't fail the whole request because the interaction is already recorded
      }
    }

    return NextResponse.json({ data: interaction }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}