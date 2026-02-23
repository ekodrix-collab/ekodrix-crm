import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all leads with filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  // Get query parameters
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const assigned_to = searchParams.get('assigned_to');
  const priority = searchParams.get('priority');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    let query = supabase
      .from('leads')
      .select(
        `
        *,
        assigned_user:users!assigned_to(id, name, email, avatar_url)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    if (assigned_to && assigned_to !== 'all') {
      query = query.eq('assigned_to', assigned_to);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%,instagram_handle.ilike.%${search}%`
      );
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: leads,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new lead
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

    // Prepare lead data
    const leadData = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company_name: body.company_name || null,
      designation: body.designation || null,
      instagram_handle: body.instagram_handle || null,
      facebook_url: body.facebook_url || null,
      whatsapp_number: body.whatsapp_number || null,
      linkedin_url: body.linkedin_url || null,
      website: body.website || null,
      source: body.source,
      source_details: body.source_details || null,
      status: 'new',
      priority: body.priority || 'warm',
      assigned_to: body.assigned_to || null,
      assigned_at: body.assigned_to ? new Date().toISOString() : null,
      project_type: body.project_type || null,
      budget_range: body.budget_range || null,
      timeline: body.timeline || null,
      requirements: body.requirements || null,
      tags: body.tags || [],
      created_by: user.id,
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select(
        `
        *,
        assigned_user:users!assigned_to(id, name, email)
      `
      )
      .single();

    if (error) {
      // Check for duplicate constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A lead with this phone, email, or social handle already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: lead }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}