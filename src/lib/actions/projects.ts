'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Project, VaultType, ProjectVault } from '@/types/hub';
import { VAULT_TYPES } from '@/lib/vault-config';
import { calculateProjectHealth } from '@/lib/health';

export async function getProjectsAction(filters?: {
  status?: string;
  clientId?: string;
  techOwnerId?: string;
  search?: string;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:client_id (
          id,
          name,
          company,
          phone,
          status
        ),
        technical_owner:technical_owner_id (
          id,
          name,
          email,
          avatar_url
        ),
        vaults:project_vaults (*),
        payments:project_payments (*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.techOwnerId && filters.techOwnerId !== 'all') {
      query = query.eq('technical_owner_id', filters.techOwnerId);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const s = `%${filters.search.trim()}%`;
      query = query.or(`project_name.ilike.${s},description.ilike.${s}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return { projects: [], error: error.message };
    }

    const projectsWithHealth: Project[] = (data || []).map((p: any) => {
      const health = calculateProjectHealth(p.vaults || []);
      return {
        ...p,
        health,
      };
    });

    return { projects: projectsWithHealth, error: null };
  } catch (err: any) {
    return { projects: [], error: err.message };
  }
}

export async function getProjectByIdAction(id: string) {
  try {
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:client_id (
          id,
          name,
          company,
          phone,
          email,
          whatsapp,
          status
        ),
        technical_owner:technical_owner_id (
          id,
          name,
          email,
          avatar_url
        ),
        vaults:project_vaults (*),
        payments:project_payments (*),
        checklist:project_checklist (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { project: null, error: error.message };
    }

    const health = calculateProjectHealth(project.vaults || []);

    return {
      project: {
        ...project,
        health,
      } as Project,
      error: null,
    };
  } catch (err: any) {
    return { project: null, error: err.message };
  }
}

export async function saveProjectAction(projectData: {
  id?: string;
  client_id: string;
  project_name: string;
  project_type: string;
  status?: string;
  technical_owner_id?: string;
  start_date?: string;
  deadline?: string;
  deployment_date?: string;
  renewal_date?: string;
  domain_expiry_date?: string;
  quoted_amount?: number;
  final_amount?: number;
  monthly_infra_cost?: number;
  annual_amc?: number;
  payment_terms?: string;
  payment_notes?: string;
  description?: string;
  scope_of_work?: string;
  required_vault_types?: VaultType[];
}) {
  try {
    const supabase = await createClient();

    const payload: any = {
      client_id: projectData.client_id,
      project_name: projectData.project_name,
      project_type: projectData.project_type || 'website',
      status: projectData.status || 'active',
      technical_owner_id: projectData.technical_owner_id || null,
      start_date: projectData.start_date || new Date().toISOString().split('T')[0],
      deadline: projectData.deadline || null,
      deployment_date: projectData.deployment_date || null,
      renewal_date: projectData.renewal_date || null,
      domain_expiry_date: projectData.domain_expiry_date || null,
      quoted_amount: Number(projectData.quoted_amount) || 0,
      final_amount: Number(projectData.final_amount) || Number(projectData.quoted_amount) || 0,
      monthly_infra_cost: Number(projectData.monthly_infra_cost) || 0,
      annual_amc: Number(projectData.annual_amc) || 0,
      payment_terms: projectData.payment_terms || '50_50',
      payment_notes: projectData.payment_notes || null,
      description: projectData.description || null,
      scope_of_work: projectData.scope_of_work || null,
    };

    let projectId = projectData.id;

    if (projectId) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      projectId = data.id;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      projectId = data.id;

      // Auto-populate vault items selected or default required
      const vaultTypesToCreate = projectData.required_vault_types || [
        'website_admin',
        'business_email',
        'domain',
        'hosting',
        'github',
        'vercel',
      ];

      const vaultRecords = vaultTypesToCreate.map((vt) => {
        const config = VAULT_TYPES[vt as VaultType] || { label: vt, defaultRequired: true };
        return {
          project_id: projectId,
          vault_type: vt,
          label: config.label,
          is_required: true,
          is_filled: false,
        };
      });

      if (vaultRecords.length > 0) {
        await supabase.from('project_vaults').insert(vaultRecords);
      }

      // Populate default delivery checklist
      const defaultChecklist = [
        { project_id: projectId, item_name: 'Domain connected & DNS configured', is_required: true },
        { project_id: projectId, item_name: 'SSL Certificate active (HTTPS)', is_required: true },
        { project_id: projectId, item_name: 'Admin credentials created & verified', is_required: true },
        { project_id: projectId, item_name: 'Business email accounts tested', is_required: true },
        { project_id: projectId, item_name: 'Client training & handover completed', is_required: true },
      ];

      await supabase.from('project_checklist').insert(defaultChecklist);
    }

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');

    return { success: true, projectId, error: null };
  } catch (err: any) {
    console.error('Error saving project:', err);
    return { success: false, projectId: null, error: err.message };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath('/');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function logProjectPaymentAction(paymentData: {
  project_id: string;
  amount: number;
  payment_date?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
}) {
  try {
    const supabase = await createClient();

    const { error: insertError } = await supabase.from('project_payments').insert({
      project_id: paymentData.project_id,
      amount: Number(paymentData.amount),
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      payment_method: paymentData.payment_method || 'bank_transfer',
      transaction_id: paymentData.transaction_id || null,
      notes: paymentData.notes || null,
    });

    if (insertError) throw insertError;

    // Recalculate total paid
    const { data: allPayments } = await supabase
      .from('project_payments')
      .select('amount')
      .eq('project_id', paymentData.project_id);

    const totalPaid = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    await supabase
      .from('projects')
      .update({ paid_amount: totalPaid })
      .eq('id', paymentData.project_id);

    revalidatePath(`/projects/${paymentData.project_id}`);
    revalidatePath('/projects');

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleChecklistItemAction(
  id: string,
  projectId: string,
  isCompleted: boolean
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('project_checklist')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
