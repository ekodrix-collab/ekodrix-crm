'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import type { Deal } from '@/types';

interface UseDealsOptions {
  stage?: string;
  ownerId?: string;
  autoFetch?: boolean;
}

interface DealStats {
  totalValue: number;
  wonValue: number;
  lostValue: number;
  pendingValue: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  pendingDeals: number;
  avgDealValue: number;
  winRate: number;
}

export function useDeals(options: UseDealsOptions = {}) {
  const { stage, ownerId, autoFetch = true } = options;
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { user } = useUser();

  const { data: deals = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['deals', { stage, ownerId }],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(
          `
          *,
          lead:leads(id, name, phone, company_name, email),
          owner:users!owner_id(id, name, email, avatar_url)
        `
        )
        .order('created_at', { ascending: false });

      if (stage && stage !== 'all') {
        query = query.eq('stage', stage);
      }

      if (ownerId && ownerId !== 'all') {
        query = query.eq('owner_id', ownerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: autoFetch && !!user,
  });

  const error = queryError ? (queryError as Error).message : null;

  // Group deals by stage
  const dealsByStage = {
    proposal: deals.filter((d) => d.stage === 'proposal'),
    negotiation: deals.filter((d) => d.stage === 'negotiation'),
    contract_sent: deals.filter((d) => d.stage === 'contract_sent'),
    won: deals.filter((d) => d.stage === 'won'),
    lost: deals.filter((d) => d.stage === 'lost'),
  };

  // Calculate stats
  const stats: DealStats = {
    totalValue: deals.reduce((sum, d) => sum + d.deal_value, 0),
    wonValue: dealsByStage.won.reduce((sum, d) => sum + d.deal_value, 0),
    lostValue: dealsByStage.lost.reduce((sum, d) => sum + d.deal_value, 0),
    pendingValue: deals
      .filter((d) => !['won', 'lost'].includes(d.stage))
      .reduce((sum, d) => sum + d.deal_value, 0),
    totalDeals: deals.length,
    wonDeals: dealsByStage.won.length,
    lostDeals: dealsByStage.lost.length,
    pendingDeals: deals.filter((d) => !['won', 'lost'].includes(d.stage)).length,
    avgDealValue: deals.length > 0
      ? deals.reduce((sum, d) => sum + d.deal_value, 0) / deals.length
      : 0,
    winRate: deals.filter((d) => ['won', 'lost'].includes(d.stage)).length > 0
      ? (dealsByStage.won.length / deals.filter((d) => ['won', 'lost'].includes(d.stage)).length) * 100
      : 0,
  };

  // Update deal stage
  const updateDealStage = useCallback(
    async (dealId: string, newStage: string, lostReason?: string): Promise<boolean> => {
      try {
        const updateData: Partial<Deal> = { stage: newStage as any };

        if (newStage === 'lost' && lostReason) {
          updateData.lost_reason = lostReason;
        }

        const response = await fetch(`/api/deals/${dealId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error('Failed to update deal');
        }

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['deals'] });

        return true;
      } catch (err) {
        console.error('Error updating deal stage:', err);
        return false;
      }
    },
    []
  );

  // Delete deal
  const deleteDeal = useCallback(
    async (dealId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/deals/${dealId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete deal');
        }

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['deals'] });

        return true;
      } catch (err) {
        console.error('Error deleting deal:', err);
        return false;
      }
    },
    []
  );

  return {
    deals,
    loading,
    error,
    dealsByStage,
    stats,
    fetchDeals: async () => { await refetch(); },
    refetch: async () => { await refetch(); },
    updateDealStage,
    deleteDeal,
  };
}