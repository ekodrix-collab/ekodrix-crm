import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all campaigns with lead performance stats
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Fetch campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each campaign, count the leads and conversion analytics in JavaScript
    // to avoid complex JOIN aggregation over RLS policies
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, campaign_id, deal_value');

    if (leadsError) {
      console.error('Error fetching campaign leads count:', leadsError);
    }

    const leadsByCampaign = (leads || []).reduce((acc: Record<string, any>, lead) => {
      if (!lead.campaign_id) return acc;
      if (!acc[lead.campaign_id]) {
        acc[lead.campaign_id] = { total: 0, converted: 0, revenue: 0 };
      }
      acc[lead.campaign_id].total += 1;
      if (lead.status === 'converted') {
        acc[lead.campaign_id].converted += 1;
        acc[lead.campaign_id].revenue += Number(lead.deal_value || 0);
      }
      return acc;
    }, {});

    const enrichedCampaigns = (campaigns || []).map(campaign => {
      const stats = leadsByCampaign[campaign.id] || { total: 0, converted: 0, revenue: 0 };
      return {
        ...campaign,
        leads_count: stats.total,
        converted_count: stats.converted,
        total_revenue: stats.revenue,
        conversion_rate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0,
      };
    });

    return NextResponse.json({ data: enrichedCampaigns });
  } catch (error) {
    console.error('Error in GET /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new campaign
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();

    // Validate request
    if (!body.name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const campaignData = {
      name: body.name,
      type: body.type || null,
      source: body.source || null,
      status: body.status || 'active',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      notes: body.notes || null,
    };

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
