'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, User, Megaphone, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
}

interface DashboardFiltersProps {
  campaigns: Campaign[];
}

export function DashboardFilters({ campaigns }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentScope = searchParams.get('scope') || 'my';
  const currentCampaign = searchParams.get('campaign_id') || 'all';

  const handleScopeChange = (scope: 'my' | 'all') => {
    const params = new URLSearchParams(window.location.search);
    params.set('scope', scope);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleCampaignChange = (campaignId: string) => {
    const params = new URLSearchParams(window.location.search);
    if (campaignId === 'all') {
      params.delete('campaign_id');
    } else {
      params.set('campaign_id', campaignId);
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(window.location.pathname);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
      {/* Scope Toggles */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
        <button
          onClick={() => handleScopeChange('my')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
            currentScope === 'my'
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Space</span>
        </button>
        <button
          onClick={() => handleScopeChange('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
            currentScope === 'all'
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Space</span>
        </button>
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Campaign:</span>
        </div>

        <Select value={currentCampaign} onValueChange={handleCampaignChange}>
          <SelectTrigger className="w-[180px] h-9 text-xs border-border bg-transparent rounded-lg">
            <SelectValue placeholder="Filter by Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns?.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(currentScope !== 'my' || currentCampaign !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
