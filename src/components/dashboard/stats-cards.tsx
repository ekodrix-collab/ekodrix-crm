import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  CheckSquare,
  Calendar,
  IndianRupee,
  // TrendingUp,
  // TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  alert?: string;
  gradient: string;
}

async function getStats() {
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  try {
    // Get new leads this week
    const { count: newLeadsThisWeek } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    // Get new leads last week (for comparison)
    const { count: newLeadsLastWeek } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgo)
      .lt('created_at', weekAgo);

    // Get today's pending tasks
    const { count: todayTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('due_date', today)
      .eq('status', 'pending');

    // Get overdue tasks
    const { count: overdueTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .eq('status', 'pending');

    // Get today's meetings from the new meetings table
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: todayMeetings } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .neq('status', 'cancelled');

    // Get pipeline value (active deals: not won or lost)
    const { data: activeDeals } = await supabase
      .from('deals')
      .select('deal_value')
      .not('stage', 'in', '("won","lost")');

    const pipelineValue =
      activeDeals?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0;

    // Get last month's pipeline for comparison
    const { data: lastMonthDeals } = await supabase
      .from('deals')
      .select('deal_value')
      .eq('stage', 'won')
      .gte('won_date', monthAgo);

    const lastMonthRevenue =
      lastMonthDeals?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0;

    // Calculate lead trend
    const leadTrend =
      newLeadsLastWeek && newLeadsLastWeek > 0
        ? Math.round(
          ((newLeadsThisWeek || 0) - newLeadsLastWeek) / newLeadsLastWeek * 100
        )
        : 0;

    return {
      newLeads: newLeadsThisWeek || 0,
      leadTrend,
      todayTasks: todayTasks || 0,
      overdueTasks: overdueTasks || 0,
      todayMeetings: todayMeetings || 0,
      pipelineValue,
      lastMonthRevenue,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      newLeads: 0,
      leadTrend: 0,
      todayTasks: 0,
      overdueTasks: 0,
      todayMeetings: 0,
      pipelineValue: 0,
      lastMonthRevenue: 0,
    };
  }
}

export async function StatsCards() {
  const stats = await getStats();

  const cards: StatCard[] = [
    {
      title: 'New Leads',
      value: stats.newLeads,
      subtitle: 'This week',
      icon: <Users className="w-6 h-6" />,
      trend: {
        value: Math.abs(stats.leadTrend),
        isPositive: stats.leadTrend >= 0,
      },
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Tasks Today',
      value: stats.todayTasks,
      subtitle: 'Pending tasks',
      icon: <CheckSquare className="w-6 h-6" />,
      alert:
        stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : undefined,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Meetings',
      value: stats.todayMeetings,
      subtitle: 'Scheduled today',
      icon: <Calendar className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Pipeline',
      value: formatCurrencyCompact(stats.pipelineValue),
      subtitle: 'Active deals',
      icon: <IndianRupee className="w-6 h-6" />,
      trend:
        stats.lastMonthRevenue > 0
          ? {
            value: Math.round(
              (stats.pipelineValue / stats.lastMonthRevenue) * 100
            ),
            isPositive: true,
          }
          : undefined,
      gradient: 'from-emerald-700 to-green-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={cn(
            'relative overflow-hidden border-0 text-white',
            `bg-gradient-to-br ${card.gradient}`
          )}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

          <CardContent className="relative p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">{card.title}</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1">{card.value}</p>

                <div className="flex items-center gap-2 mt-2">
                  <p className="text-white/70 text-xs">{card.subtitle}</p>

                  {card.trend && (
                    <span
                      className={cn(
                        'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
                        card.trend.isPositive
                          ? 'bg-white/20 text-white'
                          : 'bg-red-500/30 text-red-100'
                      )}
                    >
                      {card.trend.isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {card.trend.value}%
                    </span>
                  )}

                  {card.alert && (
                    <span className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/30 text-red-100">
                      <AlertCircle className="w-3 h-3" />
                      {card.alert}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-0">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}