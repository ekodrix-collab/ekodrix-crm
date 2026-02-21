import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all tasks with filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  // Get query parameters
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const assigned_to = searchParams.get('assigned_to');
  const priority = searchParams.get('priority');
  const lead_id = searchParams.get('lead_id');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');
  const view = searchParams.get('view'); // 'today', 'overdue', 'upcoming', 'all'
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name, status, priority),
        assigned_user:users!assigned_to(id, name, email, avatar_url),
        created_by_user:users!created_by(id, name)
      `,
        { count: 'exact' }
      )
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false });

    // Apply view filters
    if (view === 'today') {
      query = query.eq('due_date', today).eq('status', 'pending');
    } else if (view === 'overdue') {
      query = query.lt('due_date', today).eq('status', 'pending');
    } else if (view === 'upcoming') {
      query = query.gt('due_date', today).eq('status', 'pending');
    }

    // Apply specific filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (assigned_to && assigned_to !== 'all') {
      query = query.eq('assigned_to', assigned_to);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (lead_id) {
      query = query.eq('lead_id', lead_id);
    }

    if (date_from) {
      query = query.gte('due_date', date_from);
    }

    if (date_to) {
      query = query.lte('due_date', date_to);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: tasks,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new task
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

    // Prepare task data
    const taskData = {
      lead_id: body.lead_id || null,
      assigned_to: body.assigned_to,
      created_by: user.id,
      type: body.type,
      title: body.title,
      description: body.description || null,
      due_date: body.due_date,
      due_time: body.due_time || null,
      priority: body.priority || 'medium',
      status: 'pending',
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name),
        assigned_user:users!assigned_to(id, name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If task is for a lead, update the lead's next_follow_up_date
    if (body.lead_id && body.type.includes('follow_up')) {
      await supabase
        .from('leads')
        .update({ next_follow_up_date: body.due_date })
        .eq('id', body.lead_id);
    }

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}