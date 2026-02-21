'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES, PROJECT_TYPES } from '@/lib/constants';
import type { User } from '@/types';

interface LeadFiltersProps {
  className?: string;
}

export function LeadFilters({ className }: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get current filter values from URL
  const currentStatus = searchParams.get('status') || 'all';
  const currentSource = searchParams.get('source') || 'all';
  const currentAssigned = searchParams.get('assigned_to') || 'all';
  const currentPriority = searchParams.get('priority') || 'all';
  const currentProjectType = searchParams.get('project_type') || 'all';
  const currentSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(currentSearch);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch team members for assignment filter
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');
      setUsers((data as any) || []);
    };
    fetchUsers();
  }, [supabase]);

  // Count active filters
  const activeFiltersCount = [
    currentStatus !== 'all',
    currentSource !== 'all',
    currentAssigned !== 'all',
    currentPriority !== 'all',
    currentProjectType !== 'all',
  ].filter(Boolean).length;

  // Update URL with new params
  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      // Reset to page 1 when filters change
      params.delete('page');

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: any) => {
      updateFilters('search', value);
    }, 500),
    [updateFilters]
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    router.push(pathname);
  };

  // Quick status filter buttons
  const quickFilters = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'interested', label: 'Interested' },
    { key: 'follow_up_later', label: 'Follow-up' },
    { key: 'no_reply', label: 'No Reply' },
    { key: 'converted', label: 'Converted' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            type="text"
            placeholder="Search by name, email, phone, company..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                updateFilters('search', '');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'gap-2',
            activeFiltersCount > 0 && 'border-primary text-primary'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-primary">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Quick Status Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.key}
            variant={currentStatus === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters('status', filter.key)}
            className="h-8"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-card rounded-lg border border-border shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={currentStatus}
              onValueChange={(value) => updateFilters('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(LEAD_STATUSES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Select
              value={currentSource}
              onValueChange={(value) => updateFilters('source', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(LEAD_SOURCES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Assigned To
            </label>
            <Select
              value={currentAssigned}
              onValueChange={(value) => updateFilters('assigned_to', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Priority Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select
              value={currentPriority}
              onValueChange={(value) => updateFilters('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.entries(PRIORITIES).map(([key, { label, emoji }]) => (
                  <SelectItem key={key} value={key}>
                    {emoji} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Project Type</label>
            <Select
              value={currentProjectType}
              onValueChange={(value) => updateFilters('project_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROJECT_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="sm:col-span-2 lg:col-span-5 pt-2 border-t border-border mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-destructive h-8 px-2"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}