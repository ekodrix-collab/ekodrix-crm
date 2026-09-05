import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getProjectsAction } from '@/lib/actions/projects';
import { getClientsAction } from '@/lib/actions/clients';
import { getFollowupsAction } from '@/lib/actions/followups';
import { HubHealthOverview } from '@/components/dashboard/hub-health-overview';
import { HubRiskProjects } from '@/components/dashboard/hub-risk-projects';
import { HubTodayFollowups } from '@/components/dashboard/hub-today-followups';
import { HubNewEnquiries } from '@/components/dashboard/hub-new-enquiries';
import { HubClientPipeline } from '@/components/dashboard/hub-client-pipeline';
import { HubQuickActions } from '@/components/dashboard/hub-quick-actions';
import { getGreeting } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Ekodrix Hub | Agency Management & Vault System',
  description: 'Project Vault, Client Management & Follow-ups tracking',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch users for modals
  const { data: usersData } = await supabase
    .from('users')
    .select('id, name')
    .order('name');
  const users = usersData || [];

  // Fetch hub data concurrently
  const [{ projects }, { clients }, { followups }] = await Promise.all([
    getProjectsAction(),
    getClientsAction(),
    getFollowupsAction({ tab: 'all' }),
  ]);

  return (
    <div className="space-y-6 w-full px-1 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-sm">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
            {greeting}, {user?.user_metadata?.name || 'Admin'}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ekodrix Hub Agency Overview • {today}
          </p>
        </div>

        <HubQuickActions clients={clients} users={users} />
      </div>

      {/* ⭐ 1. Project Health Overview Cards (NO REVENUE DISPLAYED) */}
      <HubHealthOverview projects={projects} />

      {/* 2-Column Grid: Left (Risk Projects + New Enquiries) | Right (Today's Follow-ups + Pipeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* 🚨 Projects at Risk (Unfilled Vault items) */}
          <HubRiskProjects projects={projects} />

          {/* ✨ New Enquiries This Week */}
          <HubNewEnquiries clients={clients} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 💬 Today's Follow-ups & Discussions */}
          <HubTodayFollowups followups={followups} />

          {/* 📊 Client Pipeline Breakdown */}
          <HubClientPipeline clients={clients} />
        </div>
      </div>
    </div>
  );
}