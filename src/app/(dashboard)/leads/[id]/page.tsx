import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeadDetailView } from '@/components/leads/lead-detail';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: LeadPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('name, company_name')
    .eq('id', id)
    .single();

  if (!lead) {
    return { title: 'Lead Not Found' };
  }

  return {
    title: `${lead.name}${lead.company_name ? ` - ${lead.company_name}` : ''}`,
    description: `Lead details for ${lead.name}`,
  };
}

async function getLeadData(id: string) {
  const supabase = await createClient();

  // Fetch lead with related data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(
      `
      *,
      assigned_user:users!assigned_to(id, name, email, avatar_url, phone),
      created_by_user:users!created_by(id, name)
    `
    )
    .eq('id', id)
    .single();

  if (leadError || !lead) {
    return null;
  }

  // Fetch interactions
  const { data: interactions } = await supabase
    .from('interactions')
    .select(
      `
      *,
      user:users!user_id(id, name, avatar_url)
    `
    )
    .eq('lead_id', id)
    .order('created_at', { ascending: false });

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      `
      *,
      assigned_user:users!assigned_to(id, name)
    `
    )
    .eq('lead_id', id)
    .order('due_date', { ascending: true });

  // Fetch team members for assignment
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, role, is_active, daily_target, created_at, updated_at')
    .eq('is_active', true)
    .order('name');

  return {
    lead,
    interactions: interactions || [],
    tasks: tasks || [],
    users: users || [],
  };
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params;
  const data = await getLeadData(id);

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<LeadDetailSkeleton />}>
      <LeadDetailView
        lead={data.lead}
        interactions={data.interactions}
        tasks={data.tasks}
        users={data.users}
      />
    </Suspense>
  );
}

function LeadDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}