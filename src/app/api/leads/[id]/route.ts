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

    // Sanitize UUID fields (convert empty strings to null)
    const uuidFields = ['assigned_to', 'created_by', 'campaign_id'];
    uuidFields.forEach(field => {
      if (updateData[field as keyof Lead] === '' as any) {
        (updateData as any)[field] = null;
      }
    });

    // If assigning to someone new, update assigned_at
    if (updateData.assigned_to && updateData.assigned_to !== currentLead?.assigned_to) {
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

    // WORKFLOW AUTOMATION: Lead qualification triggers (Interested, Negotiating, Converted)
    try {
      const isNowQualified = ['interested', 'negotiating', 'converted'].includes(body.status);
      const wasAlreadyQualified = currentLead && ['interested', 'negotiating', 'converted'].includes(currentLead.status);
      
      if (isNowQualified && !wasAlreadyQualified && lead) {
        const assignedToId = lead.assigned_to || user.id;
        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 2); // 2 days from now
        
        // 1. Create a follow-up reminder task automatically
        const taskData = {
          lead_id: lead.id,
          assigned_to: assignedToId,
          created_by: user.id,
          type: 'follow_up_call',
          title: `Follow up: Lead qualified (${lead.name})`,
          description: `Automated introductory/follow-up call task generated on lead qualification. Source: ${lead.source}. Requirements: ${lead.requirements || 'No details provided.'}`,
          due_date: dueDate.toISOString().split('T')[0],
          due_time: '11:00:00',
          priority: 'high',
          status: 'pending'
        };
        
        await supabase.from('tasks').insert([taskData]);

        // 2. Auto-create a Deal entry if no deals exist yet
        if (body.status === 'interested' || body.status === 'negotiating') {
          const { data: existingDeals } = await supabase
            .from('deals')
            .select('id')
            .eq('lead_id', lead.id);
            
          if (!existingDeals || existingDeals.length === 0) {
            const dealData = {
              lead_id: lead.id,
              title: `${lead.company_name || lead.name} - CRM Pipeline`,
              description: `Automated deal generated on lead qualification. Lead Name: ${lead.name}`,
              deal_value: Number(lead.deal_value) || Number(body.deal_value) || 50000,
              currency: lead.country === 'IN' || lead.country === 'India' ? 'INR' : 'USD',
              stage: body.status === 'negotiating' ? 'negotiation' : 'proposal',
              probability: body.status === 'negotiating' ? 70 : 50,
              owner_id: assignedToId,
              expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days out
            };
            
            await supabase.from('deals').insert([dealData]);
          }
        }

        // 3. Trigger an in-app notification for the assignee
        if (lead.assigned_to) {
          await supabase.from('notifications').insert([{
            user_id: lead.assigned_to,
            title: `Lead Qualified: ${lead.name}`,
            message: `The lead "${lead.name}" is now qualified as "${body.status}". A follow-up task and deal have been automatically created in your workflow.`,
            type: 'lead',
            read: false,
            related_id: lead.id
          }]);
        }
      }
    } catch (autoErr) {
      console.error('Workflow automation failed silently to avoid interrupting lead update:', autoErr);
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