'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Client, PromisedItem } from '@/types/hub';

export async function getClientsAction(filters?: {
  status?: string;
  source?: string;
  search?: string;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('clients')
      .select(`
        *,
        assigned_user:assigned_to (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.source && filters.source !== 'all') {
      query = query.eq('source', filters.source);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const s = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${s},company.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return { clients: [], error: error.message };
    }

    return { clients: (data as Client[]) || [], error: null };
  } catch (err: any) {
    console.error('Exception fetching clients:', err);
    return { clients: [], error: err.message };
  }
}

export async function getClientByIdAction(id: string) {
  try {
    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        assigned_user:assigned_to (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { client: null, error: error.message };
    }

    // Fetch projects for this client
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        vaults:project_vaults (*),
        payments:project_payments (*)
      `)
      .eq('client_id', id)
      .order('created_at', { ascending: false });

    // Fetch followups for this client
    const { data: followups } = await supabase
      .from('followups')
      .select(`
        *,
        done_by_user:done_by (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('client_id', id)
      .order('followup_date', { ascending: false });

    return {
      client: client as Client,
      projects: projects || [],
      followups: followups || [],
      error: null,
    };
  } catch (err: any) {
    return { client: null, projects: [], followups: [], error: err.message };
  }
}

export async function saveClientAction(clientData: {
  id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  status?: string;
  source?: string;
  requirements?: string;
  promised_items?: PromisedItem[];
  notes?: string;
  assigned_to?: string;
  initial_followup_notes?: string;
  next_followup_date?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload: any = {
      name: clientData.name,
      company: clientData.company || null,
      phone: clientData.phone || null,
      email: clientData.email || null,
      whatsapp: clientData.whatsapp || clientData.phone || null,
      status: clientData.status || 'enquiry',
      source: clientData.source || 'other',
      requirements: clientData.requirements || null,
      promised_items: clientData.promised_items || [],
      notes: clientData.notes || null,
      assigned_to: clientData.assigned_to || user?.id || null,
    };

    if (clientData.status === 'confirmed' || clientData.status === 'active') {
      payload.confirmed_date = new Date().toISOString().split('T')[0];
    }

    let clientId = clientData.id;

    if (clientId) {
      // Update
      const { data, error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      clientId = data.id;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      clientId = data.id;

      // If initial discussion / next follow-up specified, create initial follow-up record
      if (clientData.initial_followup_notes || clientData.next_followup_date) {
        await supabase.from('followups').insert({
          client_id: clientId,
          interaction_type: 'call',
          discussion_notes: clientData.initial_followup_notes || 'Initial enquiry discussion',
          outcome: 'interested',
          next_followup_date: clientData.next_followup_date || null,
          done_by: user?.id || null,
        });
      }
    }

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/');
    revalidatePath('/followups');

    return { success: true, clientId, error: null };
  } catch (err: any) {
    console.error('Error saving client:', err);
    return { success: false, clientId: null, error: err.message };
  }
}

export async function deleteClientAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath('/');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
