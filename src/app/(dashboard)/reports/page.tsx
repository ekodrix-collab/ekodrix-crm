import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ReportsClientView } from '@/components/reports/reports-client-view';

export const metadata: Metadata = {
  title: 'Reports & Analytics | Ekodrix Hub',
  description: 'Agency operations and performance overview',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();

  // Safely fetch data on server with graceful fallbacks
  let clientsData: any[] = [];
  let projectsData: any[] = [];
  let vaultsData: any[] = [];
  let followupsData: any[] = [];

  try {
    const [clientsRes, projectsRes, vaultsRes, followupsRes] = await Promise.all([
      supabase.from('clients').select('id, status, source, created_at'),
      supabase.from('projects').select('id, project_type, status, created_at'),
      supabase.from('project_vaults').select('id, is_filled, is_required'),
      supabase.from('followups').select('id, interaction_type, outcome, is_completed, followup_date'),
    ]);

    clientsData = clientsRes.data || [];
    projectsData = projectsRes.data || [];
    vaultsData = vaultsRes.data || [];
    followupsData = followupsRes.data || [];
  } catch (e) {
    console.error('Error fetching hub reports tables:', e);
  }

  // If clients table is not populated or not migrated yet, fallback to leads table so staff still sees pipeline data!
  if (clientsData.length === 0) {
    try {
      const { data: leads } = await supabase.from('leads').select('id, status, source, created_at');
      if (leads && leads.length > 0) {
        clientsData = leads.map((l) => ({
          id: l.id,
          status: l.status === 'new' ? 'enquiry' : l.status === 'contacted' ? 'discussion' : l.status,
          source: l.source,
          created_at: l.created_at,
        }));
      }
    } catch (e) {
      console.error('Fallback leads query error:', e);
    }
  }

  // 1. Client & Enquiry Pipeline Counts
  const statusCounts: Record<string, number> = clientsData.reduce((acc: any, c: any) => {
    const st = c.status || 'enquiry';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const pipelineStages = [
    { key: 'enquiry', label: 'Enquiries' },
    { key: 'discussion', label: 'In Discussion' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'lost', label: 'Lost' },
  ];

  const pipelineChartData = pipelineStages.map((st) => ({
    name: st.label,
    count: statusCounts[st.key] || 0,
  }));

  // 2. Enquiry Sources Distribution
  const sourceCounts: Record<string, number> = clientsData.reduce((acc: any, c: any) => {
    const src = c.source ? c.source.charAt(0).toUpperCase() + c.source.slice(1).replace('_', ' ') : 'Other';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const sourcesData = Object.entries(sourceCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 3. Project Types Breakdown
  const projectTypeCounts: Record<string, number> = projectsData.reduce((acc: any, p: any) => {
    const type = p.project_type ? p.project_type.charAt(0).toUpperCase() + p.project_type.slice(1).replace('_', ' ') : 'Website';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const projectTypesData = Object.entries(projectTypeCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // 4. Follow-up Channels Activity
  const channelCounts: Record<string, number> = followupsData.reduce((acc: any, f: any) => {
    const ch = f.interaction_type ? f.interaction_type.charAt(0).toUpperCase() + f.interaction_type.slice(1).replace('_', ' ') : 'Call';
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});

  const channelsData = Object.entries(channelCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Summary Metrics (Strictly Operational - NO REVENUE/PROFIT)
  const totalClients = clientsData.length;
  const activeProjects = projectsData.filter((p: any) => p.status === 'active').length;
  const completedFollowups = followupsData.filter((f: any) => f.is_completed).length;

  // Global Vault Health Percentage
  const requiredVaults = vaultsData.filter((v: any) => v.is_required);
  const filledVaults = requiredVaults.filter((v: any) => v.is_filled);
  const vaultHealthRate = requiredVaults.length > 0
    ? Math.round((filledVaults.length / requiredVaults.length) * 100)
    : 100;

  return (
    <ReportsClientView
      totalClients={totalClients}
      activeProjects={activeProjects}
      vaultHealthRate={vaultHealthRate}
      completedFollowups={completedFollowups}
      pipelineChartData={pipelineChartData}
      sourcesData={sourcesData}
      projectTypesData={projectTypesData}
      channelsData={channelsData}
    />
  );
}
