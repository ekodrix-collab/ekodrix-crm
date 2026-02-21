'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
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
    AreaChart,
    Area,
} from 'recharts';
import {
    TrendingUp,
    Users,
    IndianRupee,
    CheckCircle2,
    Calendar,
    Layers,
    BarChart3,
    Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

export default function ReportsPage() {
    const { user } = useUser();
    const supabase = createClient();

    // Fetch all necessary data for reports
    const { data: reportsData, isLoading } = useQuery({
        queryKey: ['reports-data'],
        queryFn: async () => {
            const [
                { data: leads },
                { data: deals },
                { data: tasks },
                { data: users },
            ] = await Promise.all([
                supabase.from('leads').select('status, created_at, deal_value'),
                supabase.from('deals').select('stage, deal_value, created_at'),
                supabase.from('tasks').select('status, type, created_at'),
                supabase.from('users').select('id, name'),
            ]);

            return { leads, deals, tasks, users };
        },
        enabled: !!user,
    });

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const { leads = [], deals = [], tasks = [], users = [] } = reportsData || {};

    // 1. Lead Conversion Data
    const leadStatuses = (leads || []).reduce((acc: any, lead) => {
        if (!lead || !lead.status) return acc;
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {});

    const conversionData = Object.entries(leadStatuses).map(([name, value]) => ({
        name: (name || '').replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
    }));

    // 2. Revenue pipeline by stage
    const dealsByStage = (deals || []).reduce((acc: any, deal) => {
        if (!deal || !deal.stage) return acc;
        acc[deal.stage] = (acc[deal.stage] || 0) + (deal.deal_value || 0);
        return acc;
    }, {});

    const pipelineData = Object.entries(dealsByStage).map(([name, value]) => ({
        name: (name || '').charAt(0).toUpperCase() + (name || '').slice(1),
        value,
    }));

    // 3. Monthly Revenue (Mock for now since we don't have many months probably)
    const revenueByMonth = (deals || [])
        .filter((d) => d && d.stage === 'won')
        .reduce((acc: any, deal) => {
            if (!deal || !deal.created_at) return acc;
            const month = new Date(deal.created_at).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + (deal.deal_value || 0);
            return acc;
        }, {});

    const monthlyRevenueData = Object.entries(revenueByMonth).map(([name, revenue]) => ({
        name,
        revenue,
    }));

    // Summary stats
    const totalRevenue = (deals || []).filter((d) => d && d.stage === 'won').reduce((sum, d) => sum + (d.deal_value || 0), 0);
    const totalLeads = (leads || []).length;
    const wonDeals = (deals || []).filter((d) => d && d.stage === 'won').length;
    const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400">Comprehensive overview of your agency's performance.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-blue-600/80">From won deals</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-50">{conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-emerald-600/80">Leads to won deals</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Active Leads</CardTitle>
                        <Users className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-50">{totalLeads}</div>
                        <p className="text-xs text-amber-600/80">Total leads tracked</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Completed Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-50">
                            {(tasks || []).filter((t) => t && t.status === 'completed').length}
                        </div>
                        <p className="text-xs text-purple-600/80">Tasks finalized</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Monthly Revenue Chart */}
                <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Revenue Growth
                        </CardTitle>
                        <CardDescription>Monthly revenue from closed deals</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyRevenueData.length > 0 ? monthlyRevenueData : [{ name: 'No Data', revenue: 0 }]}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Distribution */}
                <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-emerald-600" />
                            Pipeline Distribution
                        </CardTitle>
                        <CardDescription>Deal value by stage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pipelineData.length > 0 ? pipelineData : [{ name: 'Empty', value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pipelineData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {pipelineData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Lead Funnel Chart */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-amber-600" />
                            Lead Funnel
                        </CardTitle>
                        <CardDescription>Number of leads by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={conversionData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Tasks Overview */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest task movements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(tasks || []).slice(0, 5).map((task: any, i) => (
                                <div key={i} className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{task.title || 'Untitled Task'}</p>
                                        <p className="text-xs text-slate-500">{new Date(task.created_at).toLocaleDateString()} • {task.type}</p>
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 uppercase">{task.status}</div>
                                </div>
                            ))}
                            {(tasks || []).length === 0 && (
                                <div className="text-center py-10 text-slate-400 italic font-light">No task activity yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
