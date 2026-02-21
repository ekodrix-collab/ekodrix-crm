'use client';

import { useUserContext } from '@/components/providers/user-provider';
import type { User } from '@/types';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

export function useUser(): UseUserReturn {
  const context = useUserContext();

  return {
    user: context.user,
    loading: context.loading,
    error: context.error,
    refreshUser: context.refreshUser,
    signOut: context.signOut,
    isAdmin: context.isAdmin,
  };
}

// Hook to get current user (throws if not authenticated)
export function useRequireUser(): User {
  const { user, loading } = useUser();

  if (loading) {
    throw new Promise(() => { }); // Suspend while loading
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}

// Hook for checking specific permissions
export function usePermission(permission: string): boolean {
  const { user, isAdmin } = useUser();

  if (!user) return false;
  if (isAdmin) return true; // Admins have all permissions

  // Add specific permission checks here if needed
  const memberPermissions = ['leads', 'tasks', 'interactions', 'view_reports'];

  return memberPermissions.includes(permission);
}