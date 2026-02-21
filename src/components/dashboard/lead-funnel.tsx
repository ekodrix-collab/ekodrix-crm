import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, ChevronRight, TrendingUp, Users } from 'lucide-react';
import { cn, calculatePercentage } from '@/lib/utils';
import { LEAD_STATUSES } from '@/lib/constants';

interface FunnelData {
  status: string;
  count: number;
  percentage: number;
}

async function getFunnelData() {
  const supabase = await createClient();

  try {
    // Get lead counts by status
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status');

    if (error) {
      console.error('Error fetching funnel data:', error);
      return { funnelData: [], totalLeadCount: 0 };
    }

    if (!leads || leads.length === 0) {
      return { funnelData: [], totalLeadCount: 0 };
    }

    // Count leads by status
    const statusCounts: Record<string, number> = {};
    leads.forEach((lead) => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    const totalLeadCount = leads.length;

    // Define funnel stages in order
    const funnelStages = [
      'new',
      'contacted',
      'interested',
      'negotiating',
      'converted',
    ];

    const funnelData: FunnelData[] = funnelStages.map((status) => ({
      status,
      count: statusCounts[status] || 0,
      percentage: calculatePercentage(statusCounts[status] || 0, totalLeadCount),
    }));

    return { funnelData, totalLeadCount };
  } catch (error) {
    console.error('Error in getFunnelData:', error);
    return { funnelData: [], totalLeadCount: 0 };
  }
}

export async function LeadFunnel() {
  const { funnelData, totalLeadCount } = await getFunnelData();
  const funnelTotal = funnelData.reduce((sum, item) => sum + item.count, 0);

  // Calculate conversion rate
  // const newLeads = funnelData.find((f) => f.status === 'new')?.count || 0;
  const convertedLeads =
    funnelData.find((f) => f.status === 'converted')?.count || 0;
  const conversionRate = funnelTotal > 0 ? calculatePercentage(convertedLeads, funnelTotal) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          Lead Funnel
        </CardTitle>
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        {funnelData.length === 0 || totalLeadCount === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Add leads to see your funnel
            </p>
            <Link href="/leads/new">
              <Button variant="outline" size="sm" className="mt-4">
                Add First Lead
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Conversion Rate Highlight */}
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border border-emerald-200 dark:border-emerald-800">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {conversionRate}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-2">
              {funnelData.map((item, index) => {
                const status =
                  LEAD_STATUSES[item.status as keyof typeof LEAD_STATUSES];
                if (!status) return null;

                // Calculate width percentage (minimum 20% for visibility)
                const widthPercent = Math.max(
                  20,
                  item.count > 0
                    ? (item.count / Math.max(...funnelData.map((f) => f.count))) *
                    100
                    : 20
                );

                return (
                  <Link
                    key={item.status}
                    href={`/leads?status=${item.status}`}
                    className="block"
                  >
                    <div className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {status.label}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="relative h-8 bg-accent rounded-lg overflow-hidden">
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 rounded-lg transition-all duration-300 group-hover:opacity-80',
                            status.color
                          )}
                          style={{ width: `${widthPercent}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-xs font-semibold text-white drop-shadow-sm">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Total Leads Footer */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Leads</span>
                <span className="font-semibold text-foreground">{totalLeadCount}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function LeadFunnelSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full mb-4 rounded-lg" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-8 rounded-lg" style={{ width: `${100 - i * 15}%` }} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}