'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import type { Task, TaskFilters } from '@/types';

interface UseTasksOptions {
  filters?: TaskFilters;
  view?: 'today' | 'overdue' | 'upcoming' | 'all';
  leadId?: string;
  autoFetch?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  fetchTasks: () => Promise<void>;
  refetch: () => Promise<void>;
  completeTask: (taskId: string) => Promise<boolean>;
  reopenTask: (taskId: string) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { filters = {}, view = 'all', leadId, autoFetch = true } = options;
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { user } = useUser();
  const filterString = JSON.stringify(filters);
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['tasks', { view, leadId, filters: filterString }],
    queryFn: async () => {
      const currentFilters = JSON.parse(filterString);
      let query = supabase
        .from('tasks')
        .select(
          `
          *,
          lead:leads(id, name, phone, company_name, status, priority),
          assigned_user:users!assigned_to(id, name, email, avatar_url)
        `,
          { count: 'exact' }
        )
        .order('due_date', { ascending: true })
        .order('priority', { ascending: false });

      if (view === 'today') {
        query = query.eq('due_date', today).eq('status', 'pending');
      } else if (view === 'overdue') {
        query = query.lt('due_date', today).eq('status', 'pending');
      } else if (view === 'upcoming') {
        query = query.gt('due_date', today).eq('status', 'pending');
      }

      if (currentFilters.status && currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status);
      }
      if (currentFilters.type && currentFilters.type !== 'all') {
        query = query.eq('type', currentFilters.type);
      }
      if (currentFilters.assigned_to && currentFilters.assigned_to !== 'all') {
        query = query.eq('assigned_to', currentFilters.assigned_to);
      }
      if (currentFilters.priority && currentFilters.priority !== 'all') {
        query = query.eq('priority', currentFilters.priority);
      }
      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { tasks: data || [], count: count || 0 };
    },
    enabled: autoFetch && !!user,
  });

  const tasks = data?.tasks || [];
  const totalCount = data?.count || 0;
  const loading = isLoading;
  const error = queryError ? (queryError as Error).message : null;

  // Computed task groups
  const overdueTasks = tasks.filter(
    (t) => t.status === 'pending' && t.due_date < today
  );

  const todayTasks = tasks.filter(
    (t) => t.status === 'pending' && t.due_date === today
  );

  const upcomingTasks = tasks.filter(
    (t) => t.status === 'pending' && t.due_date > today
  );

  // Complete a task
  const completeTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', taskId);

        if (error) throw error;

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task-stats'] });

        return true;
      } catch (err) {
        console.error('Error completing task:', err);
        return false;
      }
    },
    [supabase]
  );

  // Reopen a task
  const reopenTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'pending',
            completed_at: null,
          })
          .eq('id', taskId);

        if (error) throw error;

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task-stats'] });

        return true;
      } catch (err) {
        console.error('Error reopening task:', err);
        return false;
      }
    },
    [supabase]
  );

  // Delete a task
  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);

        if (error) throw error;

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task-stats'] });

        return true;
      } catch (err) {
        console.error('Error deleting task:', err);
        return false;
      }
    },
    [supabase]
  );

  // Update a task
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', taskId);

        if (error) throw error;

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task-stats'] });

        return true;
      } catch (err) {
        console.error('Error updating task:', err);
        return false;
      }
    },
    [supabase]
  );

  return {
    tasks,
    loading,
    error,
    totalCount,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    fetchTasks: async () => { await refetch(); },
    refetch: async () => { await refetch(); },
    completeTask,
    reopenTask,
    deleteTask,
    updateTask,
  };
}

// Hook for single task
export function useTask(id: string) {
  const supabase = createClient();
  const { user } = useUser();

  const { data: task, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `
          *,
          lead:leads(id, name, phone, company_name, status),
          assigned_user:users!assigned_to(id, name, email, avatar_url),
          created_by_user:users!created_by(id, name)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Task;
    },
    enabled: !!id && !!user,
  });

  const error = queryError ? (queryError as Error).message : null;

  return {
    task: task || null,
    loading,
    error,
    refetch: async () => { await refetch(); },
  };
}

// Hook for task stats
export function useTaskStats(userId?: string) {
  const supabase = createClient();
  const { user } = useUser();
  const today = new Date().toISOString().split('T')[0];

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['task-stats', userId],
    queryFn: async () => {
      const baseMatch = userId ? { assigned_to: userId } : {};

      const [
        { count: total },
        { count: pending },
        { count: completed },
        { count: overdue },
        { count: todayCount },
        { count: completedToday }
      ] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }).match(baseMatch),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending').match(baseMatch),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed').match(baseMatch),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', today).match(baseMatch),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('due_date', today).match(baseMatch),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed').eq('due_date', today).match(baseMatch)
      ]);

      return {
        total: total || 0,
        pending: pending || 0,
        completed: completed || 0,
        overdue: overdue || 0,
        todayCount: todayCount || 0,
        completedToday: completedToday || 0,
      };
    },
    enabled: !!user,
  });

  const defaultStats = {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    todayCount: 0,
    completedToday: 0,
  };

  return { stats: stats || defaultStats, loading };
}
