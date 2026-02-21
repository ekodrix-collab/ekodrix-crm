'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createUserAction(formData: {
    email: string;
    name: string;
    role: 'admin' | 'member';
    phone?: string;
}) {
    try {
        // 1. Verify the requester is an Admin
        const supabase = await createServerClient();
        const { data: { user: requester }, error: requesterError } = await supabase.auth.getUser();

        if (requesterError || !requester) {
            return { error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (profile?.role !== 'admin') {
            return { error: 'Only admins can create users' };
        }

        // 2. Create the user in Supabase Auth using the Admin Client
        const adminClient = createAdminClient();

        // We generate a temporary password or let them reset it
        // For now, we'll set a temporary one and trigger a reset or just let them know
        const tempPassword = Math.random().toString(36).slice(-10);

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: formData.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name: formData.name,
                role: formData.role,
            },
        });

        if (createError) {
            console.error('Error creating user in Auth:', createError);
            return { error: createError.message };
        }

        // Note: The public.users record is created automatically 
        // by the database trigger 'on_auth_user_created' in schema.sql

        // 3. Update the phone number in public.users if provided
        if (formData.phone && newUser.user) {
            const { error: updateError } = await adminClient
                .from('users')
                .update({ phone: formData.phone })
                .eq('id', newUser.user.id);

            if (updateError) {
                console.error('Error updating phone in public.users:', updateError);
            }
        }

        revalidatePath('/settings/team');
        return { success: true, tempPassword };

    } catch (error) {
        console.error('Unexpected error in createUserAction:', error);
        return { error: 'An unexpected error occurred' };
    }
}

/**
 * @deprecated Use self-signup flow instead
 */
export async function inviteUserAction(formData: {
    email: string;
    name: string;
    role: 'admin' | 'member';
}) {
    try {
        const supabase = await createServerClient();
        const { data: { user: requester } } = await supabase.auth.getUser();

        if (!requester) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (profile?.role !== 'admin') {
            return { error: 'Only admins can invite members' };
        }

        const adminClient = createAdminClient();

        // Use Supabase's invite system
        const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(formData.email, {
            data: {
                name: formData.name,
                role: formData.role,
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/set-password`,
        });

        if (inviteError) {
            console.error('Error in inviteUserAction:', inviteError);
            return { error: inviteError.message };
        }

        revalidatePath('/settings/team');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error in inviteUserAction:', error);
        return { error: 'An unexpected error occurred' };
    }
}

/**
 * Activates a user account (Admin only)
 */
export async function approveUserAction(userId: string) {
    const supabase = await createServerClient();

    // Check authorization
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' };
    }

    try {
        const { error } = await supabase
            .from('users')
            .update({ is_active: true })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error approving user:', error);
        return { error: error.message || 'Failed to approve user' };
    }
}

export async function deleteUserAction(userId: string) {
    try {
        const supabase = await createServerClient();
        const { data: { user: requester } } = await supabase.auth.getUser();

        if (!requester) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (profile?.role !== 'admin') {
            return { error: 'Unauthorized' };
        }

        const adminClient = createAdminClient();
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            return { error: deleteError.message };
        }

        // public.users record will be deleted by ON DELETE CASCADE if configured,
        // otherwise we handle it manually if needed. 
        // In our schema, we don't have CASCADE on users table from auth.users (different schemas).
        // So we manually delete it.
        await adminClient.from('users').delete().eq('id', userId);

        revalidatePath('/settings/team');
        return { success: true };
    } catch (error) {
        return { error: 'An unexpected error occurred' };
    }
}
