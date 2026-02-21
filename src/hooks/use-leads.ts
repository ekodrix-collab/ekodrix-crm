'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import type { Lead, LeadFilters } from '@/types';

interface UseLeadsOptions {
  filters?: LeadFilters;
  page?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  fetchLeads: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useLeads(options: UseLeadsOptions = {}): UseLeadsReturn {
  const { filters = {}, page = 1, pageSize = 20, autoFetch = true } = options;
  const supabase = createClient();
  const { user } = useUser();

  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['leads', { filters, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(
          `
          *,
          assigned_user:users!assigned_to(id, name, email, avatar_url)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }
      if (filters.assigned_to && filters.assigned_to !== 'all') {
        if (filters.assigned_to === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', filters.assigned_to);
        }
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { leads: data || [], count: count || 0 };
    },
    enabled: autoFetch && !!user,
  });

  const leads = data?.leads || [];
  const totalCount = data?.count || 0;
  const error = queryError ? (queryError as Error).message : null;

  return {
    leads,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    fetchLeads: async () => { await refetch(); },
    refetch: async () => { await refetch(); },
  };
}

export function useLead(id: string) {
  const supabase = createClient();
  const { user } = useUser();

  const { data: lead, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
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

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id && !!user,
  });

  const error = queryError ? (queryError as Error).message : null;

  return {
    lead: lead || null,
    loading,
    error,
    refetch: async () => { await refetch(); },
  };
}

// Hook for duplicate checking
export function useDuplicateCheck() {
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<{
    isDuplicate: boolean;
    existingLead?: Lead;
    matchedField?: string;
    message?: string;
  } | null>(null);

  const checkDuplicate = useCallback(
    async (data: {
      phone?: string;
      email?: string;
      instagram_handle?: string;
      whatsapp_number?: string;
      exclude_id?: string;
    }) => {
      // Only check if at least one field has value
      const hasValue = Object.values(data).some(
        (v) => v && v.trim() && v !== data.exclude_id
      );

      if (!hasValue) {
        setDuplicate(null);
        return null;
      }

      setChecking(true);

      try {
        const response = await fetch('/api/leads/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        setDuplicate(result);
        return result;
      } catch (error) {
        console.error('Error checking duplicate:', error);
        setDuplicate(null);
        return null;
      } finally {
        setChecking(false);
      }
    },
    []
  );

  const clearDuplicate = useCallback(() => {
    setDuplicate(null);
  }, []);

  return {
    checking,
    duplicate,
    checkDuplicate,
    clearDuplicate,
  };
}