import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { phone, email, instagram_handle, whatsapp_number, exclude_id } = body;

    // Build OR conditions for duplicate check
    const conditions: string[] = [];

    if (phone && phone.trim()) {
      conditions.push(`phone.eq.${phone.trim()}`);
    }
    if (email && email.trim()) {
      conditions.push(`email.eq.${email.trim().toLowerCase()}`);
    }
    if (instagram_handle && instagram_handle.trim()) {
      // Remove @ if present
      const handle = instagram_handle.trim().replace('@', '');
      conditions.push(`instagram_handle.eq.${handle}`);
    }
    if (whatsapp_number && whatsapp_number.trim()) {
      conditions.push(`whatsapp_number.eq.${whatsapp_number.trim()}`);
    }

    // If no fields to check, return no duplicate
    if (conditions.length === 0) {
      return NextResponse.json({ isDuplicate: false });
    }

    // Build query
    let query = supabase
      .from('leads')
      .select(
        `
        id,
        name,
        phone,
        email,
        instagram_handle,
        whatsapp_number,
        status,
        company_name,
        assigned_to,
        assigned_user:users!assigned_to(id, name)
      `
      )
      .or(conditions.join(','))
      .limit(1);

    // Exclude current lead if editing
    if (exclude_id) {
      query = query.neq('id', exclude_id);
    }

    const { data: duplicates, error } = await query;

    if (error) {
      console.error('Error checking duplicates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (duplicates && duplicates.length > 0) {
      const existingLead = duplicates[0];

      // Determine which field matched
      let matchedField = '';
      if (phone && existingLead.phone === phone.trim()) {
        matchedField = 'phone number';
      } else if (email && existingLead.email === email.trim().toLowerCase()) {
        matchedField = 'email';
      } else if (instagram_handle && existingLead.instagram_handle === instagram_handle.trim().replace('@', '')) {
        matchedField = 'Instagram handle';
      } else if (whatsapp_number && existingLead.whatsapp_number === whatsapp_number.trim()) {
        matchedField = 'WhatsApp number';
      }

      const assignedTo = existingLead.assigned_user;
      const assignedToName = Array.isArray(assignedTo)
        ? (assignedTo[0] as any)?.name
        : (assignedTo as any)?.name || 'Unassigned';

      return NextResponse.json({
        isDuplicate: true,
        existingLead: {
          id: existingLead.id,
          name: existingLead.name,
          phone: existingLead.phone,
          email: existingLead.email,
          status: existingLead.status,
          company_name: existingLead.company_name,
          assigned_to: existingLead.assigned_to,
          assigned_user: existingLead.assigned_user,
        },
        matchedField,
        message: `A lead with this ${matchedField} already exists: "${existingLead.name}"${existingLead.assigned_user ? ` (assigned to ${assignedToName})` : ''
          }`,
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (error) {
    console.error('Error in POST /api/leads/check-duplicate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}