import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LeadTable } from '@/components/leads/lead-table';
import { LeadFilters } from '@/components/leads/lead-filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Download, Upload } from 'lucide-react';
import { normalizeBudget } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Leads',
  description: 'Manage your leads',
};

export const dynamic = 'force-dynamic';

interface LeadsPageProps {
  searchParams: {
    status?: string;
    source?: string;
    assigned_to?: string;
    priority?: string;
    project_type?: string;
    budget?: string;
    search?: string;
    page?: string;
  };
}

async function getLeads(searchParams: LeadsPageProps['searchParams']) {
  const supabase = await createClient();

  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;

  // We fetch without pagination first if we need to filter by budget in JS
  // Or we fetch all and then paginate. Given the scale, fetching all is safer for correct count.
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

  // Apply basic filters in the database
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.source && searchParams.source !== 'all') {
    query = query.eq('source', searchParams.source);
  }

  if (searchParams.assigned_to && searchParams.assigned_to !== 'all') {
    if (searchParams.assigned_to === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', searchParams.assigned_to);
    }
  }

  if (searchParams.priority && searchParams.priority !== 'all') {
    query = query.eq('priority', searchParams.priority);
  }

  if (searchParams.project_type && searchParams.project_type !== 'all') {
    query = query.eq('project_type', searchParams.project_type);
  }

  if (searchParams.search) {
    query = query.or(
      `name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%,company_name.ilike.%${searchParams.search}%,instagram_handle.ilike.%${searchParams.search}%`
    );
  }

  // Fetch all matching leads for the current filters (except budget)
  const { data: allLeads, error } = await query;

  if (error) {
    console.error('Error fetching leads:', error);
    return { leads: [], count: 0, page, pageSize };
  }

  let filteredLeads = allLeads || [];

  // Apply Budget Filter in JavaScript for robust parsing
  if (searchParams.budget && searchParams.budget !== 'all') {
    console.log(`--- BUDGET FILTER DEBUG: ${searchParams.budget} ---`);
    filteredLeads = filteredLeads.filter(lead => {
      // Use budget_custom if available (numeric), otherwise normalize budget_range string
      // Note: budget_custom might not exist in some environments yet
      const budgetValue = (lead as any).budget_custom ?? normalizeBudget(lead.budget_range);
      
      let matches = false;
      if (searchParams.budget === 'under_10k') {
        matches = budgetValue > 0 && budgetValue < 10000;
      } else if (searchParams.budget === '10k_50k') {
        matches = budgetValue >= 10000 && budgetValue <= 50000;
      } else if (searchParams.budget === 'above_50k') {
        matches = budgetValue > 50000;
      }

      // Log for verification
      if (lead.budget_range || (lead as any).budget_custom) {
        console.log(`Lead: ${lead.name.padEnd(20)} | Raw: ${String(lead.budget_range).padEnd(10)} | Normalized: ${String(budgetValue).padEnd(8)} | Matches: ${matches}`);
      }

      return matches;
    });
    console.log('--- END BUDGET DEBUG ---');
  }

  // Manual Pagination
  const totalCount = filteredLeads.length;
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const leads = filteredLeads.slice(from, to);

  return {
    leads: leads || [],
    count: totalCount,
    page,
    pageSize,
  };
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const sParams = await searchParams;
  const { leads, count, page, pageSize } = await getLeads(sParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Leads
          </h1>
          <p className="text-muted-foreground">
            Manage and track all your leads ({count} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/leads/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <LeadFilters />

      {/* Lead Table */}
      <Suspense fallback={<LeadTableSkeleton />}>
        <LeadTable
          leads={leads}
          totalCount={count}
          currentPage={page}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}

function LeadTableSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}