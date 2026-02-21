import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all deals with filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const stage = searchParams.get('stage');
  const owner_id = searchParams.get('owner_id');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  try {
    let query = supabase
      .from('deals')
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name, email, status),
        owner:users!owner_id(id, name, email, avatar_url)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }

    if (owner_id && owner_id !== 'all') {
      query = query.eq('owner_id', owner_id);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: deals, error, count } = await query;

    if (error) {
      console.error('Error fetching deals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: deals,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Error in GET /api/deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new deal
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

    // Prepare deal data
    const dealData = {
      lead_id: body.lead_id || null,
      title: body.title,
      description: body.description || null,
      deal_value: body.deal_value,
      currency: body.currency || 'USD',
      stage: body.stage || 'proposal',
      probability: body.probability || 50,
      expected_close_date: body.expected_close_date || null,
      owner_id: body.owner_id || user.id,
    };

    const { data: deal, error } = await supabase
      .from('deals')
      .insert([dealData])
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name),
        owner:users!owner_id(id, name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If deal is from a lead, update lead status to 'negotiating'
    if (body.lead_id) {
      await supabase
        .from('leads')
        .update({ status: 'negotiating', deal_value: body.deal_value })
        .eq('id', body.lead_id);
    }

    return NextResponse.json({ data: deal }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}