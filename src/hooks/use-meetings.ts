'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Meeting, MeetingFormData, RSVPStatus } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface MeetingsFilters {
    status?: string;
    date_from?: string;
    date_to?: string;
    organizer_id?: string;
    view?: 'today' | 'upcoming' | 'past' | 'all';
}

export function useMeetings(filters: MeetingsFilters = {}) {
    return useQuery({
        queryKey: ['meetings', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.organizer_id) params.append('organizer_id', filters.organizer_id);
            if (filters.view) params.append('view', filters.view);

            const response = await fetch(`/api/meetings?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch meetings');
            const data = await response.json();
            return data.data as Meeting[];
        },
    });
}

export function useMeeting(id: string | null) {
    return useQuery({
        queryKey: ['meetings', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await fetch(`/api/meetings/${id}`);
            if (!response.ok) throw new Error('Failed to fetch meeting');
            const data = await response.json();
            return data.data as Meeting;
        },
        enabled: !!id,
    });
}

export function useCreateMeeting() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: MeetingFormData) => {
            const response = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create meeting');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast({
                title: 'Meeting Scheduled',
                description: 'Your meeting has been scheduled successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useUpdateMeeting(id: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: Partial<MeetingFormData> & { status?: string }) => {
            const response = await fetch(`/api/meetings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update meeting');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast({
                title: 'Meeting Updated',
                description: 'Meeting details have been updated.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useDeleteMeeting() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/meetings/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete meeting');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast({
                title: 'Meeting Cancelled',
                description: 'The meeting has been cancelled.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useRSVP(meetingId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (rsvp_status: RSVPStatus) => {
            const response = await fetch(`/api/meetings/${meetingId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rsvp_status }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update RSVP');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast({
                title: 'RSVP Updated',
                description: 'Your response has been recorded.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useGoogleCalendarConnection() {
    return useQuery({
        queryKey: ['google-calendar-status'],
        queryFn: async () => {
            const response = await fetch('/api/auth/google/status');
            if (!response.ok) return { isConnected: false };
            return response.json() as Promise<{ isConnected: boolean }>;
        },
    });
}


