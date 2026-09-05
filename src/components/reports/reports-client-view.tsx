'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  UserCheck,
  FolderGit2,
  ShieldCheck,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  MessageSquareText,
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

interface ReportsClientViewProps {
  totalClients: number;
  activeProjects: number;
  vaultHealthRate: number;
  completedFollowups: number;
  pipelineChartData: { name: string; count: number }[];
  sourcesData: { name: string; value: number }[];
  projectTypesData: { name: string; count: number }[];
  channelsData: { name: string; value: number }[];
}

export function ReportsClientView({
  totalClients,
  activeProjects,
  vaultHealthRate,
  completedFollowups,
  pipelineChartData,
  sourcesData,
  projectTypesData,
  channelsData,
}: ReportsClientViewProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
          Operations & Performance Reports
        </h1>
        <p className="text-muted-foreground text-sm">
          Overview of client pipeline, project delivery, credential health, and follow-up activities.
        </p>
      </div>

      {/* 4 Summary Cards (Strictly Operational Count & Health - NO REVENUE) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Clients & Enquiries
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{totalClients}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Across all pipeline stages</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Projects
            </CardTitle>
            <FolderGit2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-0.5">In active development</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vault Health Rate
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{vaultHealthRate}%</div>
            <p className="text-xs text-muted-foreground mt-0.5">Required credentials filled</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed Follow-ups
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{completedFollowups}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Client discussions finalized</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Client Pipeline & Source Distribution */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Pipeline Stage Distribution (Bar Chart of Counts) */}
        <Card className="lg:col-span-4 border-border/80 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Client & Enquiry Pipeline
            </CardTitle>
            <CardDescription>Number of clients and enquiries in each stage</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #88888830', backgroundColor: '#18181b', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources Distribution (Donut Chart) */}
        <Card className="lg:col-span-3 border-border/80 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
              Enquiry Sources Breakdown
            </CardTitle>
            <CardDescription>Where new enquiries are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcesData.length > 0 ? sourcesData : [{ name: 'No Data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {sourcesData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-semibold text-foreground">({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Project Solutions & Follow-up Channels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Types Distribution */}
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <FolderGit2 className="h-5 w-5 text-blue-600" />
              Project Solutions Breakdown
            </CardTitle>
            <CardDescription>Distribution of active and completed solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectTypesData.length > 0 ? projectTypesData : [{ name: 'None', count: 0 }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Interaction Channels */}
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <MessageSquareText className="h-5 w-5 text-purple-600" />
              Client Communication Channels
            </CardTitle>
            <CardDescription>Interaction volume across phone, WhatsApp, and meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelsData.length > 0 ? channelsData : [{ name: 'None', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelsData.map((entry, index) => (
                      <Cell key={`cell-ch-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {channelsData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-semibold text-foreground">({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
