import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { StatsCards, StatsCardsSkeleton } from '@/components/dashboard/stats-cards';
import { HotLeads, HotLeadsSkeleton } from '@/components/dashboard/hot-leads';
import { LeadFunnel, LeadFunnelSkeleton } from '@/components/dashboard/lead-funnel';
import { TeamActivity, TeamActivitySkeleton } from '@/components/dashboard/team-activity';
import { UpcomingMeetings, UpcomingMeetingsSkeleton } from '@/components/dashboard/upcoming-meetings';
import { FollowUpHub, FollowUpHubSkeleton } from '@/components/dashboard/follow-up-hub';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { getGreeting } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard | Ekodrix CRM',
  description: 'Overview of your CRM activities',
};

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    scope?: string;
    campaign_id?: string;
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const supabase = await createClient();
  
  // Get active session user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  const sParams = await searchParams;
  const scope = sParams.scope || 'my';
  const campaignId = sParams.campaign_id || 'all';

  // Apply filters
  const filterUserId = scope === 'my' ? currentUserId : undefined;

  // Fetch campaigns for dropdown filter
  const { data: campaigns = [] } = await supabase
    .from('campaigns')
    .select('id, name')
    .order('name');

  return (
    <div className="space-y-6 w-full px-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {user?.user_metadata?.name || 'Agent'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Here's what's happening today, {today}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters campaigns={campaigns || []} />

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards userId={filterUserId} campaignId={campaignId} />
      </Suspense>

      {/* Main Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Actionable Follow-Up Hub (Primary priority) */}
          <Suspense fallback={<FollowUpHubSkeleton />}>
            <FollowUpHub userId={filterUserId} campaignId={campaignId} />
          </Suspense>


          {/* Team Standing & Activity */}
          <Suspense fallback={<TeamActivitySkeleton />}>
            <TeamActivity campaignId={campaignId} />
          </Suspense>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <Suspense fallback={<UpcomingMeetingsSkeleton />}>
            <UpcomingMeetings userId={filterUserId} />
          </Suspense>

          {/* Hot Leads */}
          <Suspense fallback={<HotLeadsSkeleton />}>
            <HotLeads userId={filterUserId} campaignId={campaignId} />
          </Suspense>

          {/* Lead Funnel */}
          <Suspense fallback={<LeadFunnelSkeleton />}>
            <LeadFunnel userId={filterUserId} campaignId={campaignId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}