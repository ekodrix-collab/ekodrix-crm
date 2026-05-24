import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Retrieve details for a single campaign
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching campaign details:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Get statistics
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, deal_value')
      .eq('campaign_id', id);

    if (leadsError) {
      console.error('Error fetching campaign leads:', leadsError);
    }

    const totalLeads = leads?.length || 0;
    const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
    const revenue = leads?.filter(l => l.status === 'converted').reduce((sum, l) => sum + Number(l.deal_value || 0), 0) || 0;

    const enrichedCampaign = {
      ...campaign,
      leads_count: totalLeads,
      converted_count: convertedLeads,
      total_revenue: revenue,
      conversion_rate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
    };

    return NextResponse.json({ data: enrichedCampaign });
  } catch (error) {
    console.error('Error in GET /api/campaigns/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign details
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const body = await request.json();

    const campaignData = {
      name: body.name,
      type: body.type,
      source: body.source,
      status: body.status,
      start_date: body.start_date,
      end_date: body.end_date,
      notes: body.notes,
    };

    // Filter out undefined values
    const cleanData = Object.entries(campaignData).reduce((acc: Record<string, any>, [key, val]) => {
      if (val !== undefined) acc[key] = val;
      return acc;
    }, {});

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Error in PUT /api/campaigns/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a campaign
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/campaigns/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
