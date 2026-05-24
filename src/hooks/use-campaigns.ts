'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Campaign, CampaignFormData } from '@/types';

// Fetch all campaigns with statistics
export function useCampaigns() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const json = await response.json();
      return (json.data || []) as Campaign[];
    },
  });

  return {
    campaigns: data || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

// Fetch single campaign by ID with statistics
export function useCampaign(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }
      const json = await response.json();
      return json.data as Campaign;
    },
    enabled: !!id,
  });

  return {
    campaign: data || null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

// Mutations for Campaigns (Create, Update, Delete)
export function useCampaignMutations() {
  const queryClient = useQueryClient();

  // Create Campaign
  const createCampaign = useMutation({
    mutationFn: async (newCampaign: CampaignFormData) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create campaign');
      }

      const json = await response.json();
      return json.data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  // Update Campaign
  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignFormData> }) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update campaign');
      }

      const json = await response.json();
      return json.data as Campaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
    },
  });

  // Delete Campaign
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete campaign');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  return {
    createCampaign: {
      mutate: createCampaign.mutateAsync,
      loading: createCampaign.isPending,
      error: createCampaign.error ? (createCampaign.error as Error).message : null,
    },
    updateCampaign: {
      mutate: updateCampaign.mutateAsync,
      loading: updateCampaign.isPending,
      error: updateCampaign.error ? (updateCampaign.error as Error).message : null,
    },
    deleteCampaign: {
      mutate: deleteCampaign.mutateAsync,
      loading: deleteCampaign.isPending,
      error: deleteCampaign.error ? (deleteCampaign.error as Error).message : null,
    },
  };
}
