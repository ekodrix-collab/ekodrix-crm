'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Followup, InteractionType, FollowupOutcome } from '@/types/hub';

export async function getFollowupsAction(filters?: {
  tab?: 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'all' | 'completed';
  clientId?: string;
  type?: string;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('followups')
      .select(`
        *,
        client:client_id (
          id,
          name,
          company,
          phone,
          status
        ),
        project:project_id (
          id,
          project_name
        ),
        done_by_user:done_by (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .order('followup_date', { ascending: false });

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('interaction_type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching followups:', error);
      return { followups: [], error: error.message };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekLaterStr = weekLater.toISOString().split('T')[0];

    let list = (data as Followup[]) || [];

    if (filters?.tab === 'today') {
      list = list.filter((f) => f.next_followup_date === todayStr && !f.is_completed);
    } else if (filters?.tab === 'tomorrow') {
      list = list.filter((f) => f.next_followup_date === tomorrowStr && !f.is_completed);
    } else if (filters?.tab === 'this_week') {
      list = list.filter((f) => {
        if (!f.next_followup_date || f.is_completed) return false;
        return f.next_followup_date >= todayStr && f.next_followup_date <= weekLaterStr;
      });
    } else if (filters?.tab === 'overdue') {
      list = list.filter((f) => {
        if (!f.next_followup_date || f.is_completed) return false;
        return f.next_followup_date < todayStr;
      });
    } else if (filters?.tab === 'completed') {
      list = list.filter((f) => f.is_completed);
    }

    return { followups: list, error: null };
  } catch (err: any) {
    return { followups: [], error: err.message };
  }
}

export async function saveFollowupAction(payload: {
  id?: string;
  client_id: string;
  project_id?: string | null;
  interaction_type: InteractionType;
  discussion_notes: string;
  client_response?: string;
  our_commitment?: string;
  outcome: FollowupOutcome;
  next_followup_date?: string;
  next_followup_notes?: string;
  is_completed?: boolean;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const record: any = {
      client_id: payload.client_id,
      project_id: payload.project_id || null,
      interaction_type: payload.interaction_type,
      discussion_notes: payload.discussion_notes,
      client_response: payload.client_response || null,
      our_commitment: payload.our_commitment || null,
      outcome: payload.outcome || 'interested',
      next_followup_date: payload.next_followup_date || null,
      next_followup_notes: payload.next_followup_notes || null,
      is_completed: payload.is_completed ?? false,
      done_by: user?.id || null,
      followup_date: new Date().toISOString(),
    };

    let resultId = payload.id;

    if (resultId) {
      const { data, error } = await supabase
        .from('followups')
        .update(record)
        .eq('id', resultId)
        .select()
        .single();
      if (error) throw error;
      resultId = data.id;
    } else {
      const { data, error } = await supabase
        .from('followups')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      resultId = data.id;
    }

    revalidatePath('/followups');
    revalidatePath(`/clients/${payload.client_id}`);
    revalidatePath('/');

    return { success: true, id: resultId, error: null };
  } catch (err: any) {
    console.error('Error saving followup:', err);
    return { success: false, id: null, error: err.message };
  }
}

export async function toggleFollowupCompletedAction(id: string, isCompleted: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('followups')
      .update({ is_completed: isCompleted })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/followups');
    revalidatePath('/');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rescheduleFollowupAction(id: string, nextDate: string, notes?: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('followups')
      .update({
        next_followup_date: nextDate,
        next_followup_notes: notes || undefined,
        is_completed: false,
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/followups');
    revalidatePath('/');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
