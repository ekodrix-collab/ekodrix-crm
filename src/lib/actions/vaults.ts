'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { VaultType } from '@/types/hub';
import { VAULT_TYPES } from '@/lib/vault-config';

export async function saveVaultItemAction(payload: {
  id?: string;
  project_id: string;
  vault_type: VaultType;
  label?: string;
  url?: string;
  username?: string;
  password_encrypted?: string;
  api_key?: string;
  access_token?: string;
  ssh_key?: string;
  notes?: string;
  is_required?: boolean;
}) {
  try {
    const supabase = await createClient();

    const config = VAULT_TYPES[payload.vault_type] || { label: payload.vault_type };
    const label = payload.label || config.label;

    // Check if filled
    const isFilled = !!(
      (payload.username && payload.password_encrypted) ||
      (payload.api_key && payload.access_token) ||
      (payload.password_encrypted && payload.url) ||
      (payload.api_key && payload.url) ||
      (payload.ssh_key && payload.username) ||
      payload.url ||
      payload.api_key ||
      payload.password_encrypted
    );

    const record: any = {
      project_id: payload.project_id,
      vault_type: payload.vault_type,
      label,
      url: payload.url || null,
      username: payload.username || null,
      password_encrypted: payload.password_encrypted || null,
      api_key: payload.api_key || null,
      access_token: payload.access_token || null,
      ssh_key: payload.ssh_key || null,
      notes: payload.notes || null,
      is_required: payload.is_required ?? true,
      is_filled: isFilled,
    };

    let vaultId = payload.id;

    if (vaultId) {
      const { data, error } = await supabase
        .from('project_vaults')
        .update(record)
        .eq('id', vaultId)
        .select()
        .single();

      if (error) throw error;
      vaultId = data.id;
    } else {
      const { data, error } = await supabase
        .from('project_vaults')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      vaultId = data.id;
    }

    revalidatePath(`/projects/${payload.project_id}`);
    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, vaultId, error: null };
  } catch (err: any) {
    console.error('Error saving vault item:', err);
    return { success: false, vaultId: null, error: err.message };
  }
}

export async function deleteVaultItemAction(id: string, projectId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('project_vaults').delete().eq('id', id);

    if (error) throw error;

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleVaultRequiredAction(
  id: string,
  projectId: string,
  isRequired: boolean
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('project_vaults')
      .update({ is_required: isRequired })
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
