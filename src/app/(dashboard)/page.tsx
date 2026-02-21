import { Suspense } from 'react';
import { Metadata } from 'next';
import { StatsCards, StatsCardsSkeleton } from '@/components/dashboard/stats-cards';
import { TodayTasks, TodayTasksSkeleton } from '@/components/dashboard/today-tasks';
import { HotLeads, HotLeadsSkeleton } from '@/components/dashboard/hot-leads';
import { LeadFunnel, LeadFunnelSkeleton } from '@/components/dashboard/lead-funnel';
import { TeamActivity, TeamActivitySkeleton } from '@/components/dashboard/team-activity';
import { UpcomingMeetings, UpcomingMeetingsSkeleton } from '@/components/dashboard/upcoming-meetings';
import { getGreeting } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your CRM activities',
};

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening today, {today}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Main Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Suspense fallback={<UpcomingMeetingsSkeleton />}>
          <UpcomingMeetings />
        </Suspense>

        {/* Today's Tasks */}
        <Suspense fallback={<TodayTasksSkeleton />}>
          <TodayTasks />
        </Suspense>

        {/* Hot Leads */}
        <Suspense fallback={<HotLeadsSkeleton />}>
          <HotLeads />
        </Suspense>

        {/* Lead Funnel */}
        <Suspense fallback={<LeadFunnelSkeleton />}>
          <LeadFunnel />
        </Suspense>

        {/* Team Activity */}
        <Suspense fallback={<TeamActivitySkeleton />}>
          <TeamActivity />
        </Suspense>
      </div>
    </div>
  );
}