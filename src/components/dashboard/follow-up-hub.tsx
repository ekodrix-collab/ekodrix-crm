import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Phone, MessageCircle, CheckCircle, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FollowUpActionButtons } from './follow-up-action-buttons';

interface FollowUpHubProps {
  userId?: string;
  campaignId?: string;
}

export async function FollowUpHub({ userId, campaignId }: FollowUpHubProps) {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  try {
    let query = supabase
      .from('leads')
      .select('id, name, phone, whatsapp_number, email, company_name, next_follow_up_date, is_follow_up_completed, priority, status')
      .not('next_follow_up_date', 'is', null)
      .or('is_follow_up_completed.is.null,is_follow_up_completed.eq.false')
      .order('next_follow_up_date', { ascending: true });

    if (userId) {
      query = query.eq('assigned_to', userId);
    }
    if (campaignId && campaignId !== 'all') {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: leads = [] } = await query.limit(5);

    // Group leads by date status
    const overdueLeads: any[] = [];
    const todayLeads: any[] = [];
    const tomorrowLeads: any[] = [];
    const upcomingLeads: any[] = [];

    leads?.forEach((lead) => {
      if (!lead.next_follow_up_date) return;
      const fDate = lead.next_follow_up_date.split('T')[0];
      if (fDate < todayStr) {
        overdueLeads.push(lead);
      } else if (fDate === todayStr) {
        todayLeads.push(lead);
      } else if (fDate === tomorrowStr) {
        tomorrowLeads.push(lead);
      } else {
        upcomingLeads.push(lead);
      }
    });

    const totalPendingCount = leads?.length || 0;

    return (
      <Card className="h-auto border border-border shadow-xl hover:shadow-2xl transition-all duration-300 bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-slate-50/50 dark:bg-slate-900/20">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            Follow-Up Hub
            {totalPendingCount > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 font-semibold px-2 py-0.5">
                {totalPendingCount} Pending
              </Badge>
            )}
          </CardTitle>
          <Link href="/follow-ups">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/5">
              View Cockpit
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-4 space-y-5 flex-1 max-h-[480px] overflow-y-auto scrollbar-thin">
          {totalPendingCount === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                No pending follow-ups. Outstanding sales hustle!
              </p>
            </div>
          ) : (
            <>
              {/* Overdue */}
              {overdueLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Overdue ({overdueLeads.length})
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {overdueLeads.map((lead) => (
                      <FollowUpItem key={lead.id} lead={lead} type="overdue" />
                    ))}
                  </div>
                </div>
              )}

              {/* Today */}
              {todayLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Today ({todayLeads.length})
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {todayLeads.map((lead) => (
                      <FollowUpItem key={lead.id} lead={lead} type="today" />
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow */}
              {tomorrowLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Tomorrow ({tomorrowLeads.length})
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {tomorrowLeads.map((lead) => (
                      <FollowUpItem key={lead.id} lead={lead} type="tomorrow" />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcomingLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Upcoming ({upcomingLeads.length})
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {upcomingLeads.map((lead) => (
                      <FollowUpItem key={lead.id} lead={lead} type="upcoming" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('Error rendering Follow-Up Hub:', error);
    return null;
  }
}

function FollowUpItem({ lead, type }: { lead: any; type: 'overdue' | 'today' | 'tomorrow' | 'upcoming' }) {
  const borderClass = {
    overdue: 'border-rose-100 dark:border-rose-950/30 bg-rose-50/30 dark:bg-rose-950/5 hover:bg-rose-50 dark:hover:bg-rose-950/10',
    today: 'border-amber-100 dark:border-amber-950/30 bg-amber-50/30 dark:bg-amber-950/5 hover:bg-amber-50 dark:hover:bg-amber-950/10',
    tomorrow: 'border-blue-100 dark:border-blue-950/30 bg-blue-50/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/10',
    upcoming: 'border-slate-100 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50',
  }[type];

  const dateColorClass = {
    overdue: 'text-rose-600 dark:text-rose-400 font-semibold',
    today: 'text-amber-600 dark:text-amber-400 font-semibold',
    tomorrow: 'text-blue-600 dark:text-blue-400',
    upcoming: 'text-slate-500 dark:text-slate-400',
  }[type];

  const formattedDate = new Date(lead.next_follow_up_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group',
      borderClass
    )}>
      <div className="min-w-0 flex-1 mr-3">
        <div className="flex items-center gap-2">
          <Link href={`/leads/${lead.id}`} className="hover:underline font-semibold text-sm truncate text-slate-800 dark:text-slate-100 group-hover:text-primary">
            {lead.name}
          </Link>
          {lead.priority === 'hot' && <span className="text-xs">🔥</span>}
        </div>
        
        {lead.company_name && (
          <p className="text-xs text-muted-foreground truncate">{lead.company_name}</p>
        )}
        
        <p className={cn("text-[10px] flex items-center gap-1 mt-1", dateColorClass)}>
          <Calendar className="w-2.5 h-2.5 opacity-85" />
          Scheduled: {formattedDate}
        </p>
      </div>

      <FollowUpActionButtons 
        leadId={lead.id} 
        phone={lead.phone} 
        whatsapp={lead.whatsapp_number} 
      />
    </div>
  );
}

export function FollowUpHubSkeleton() {
  return (
    <Card className="h-auto border border-border shadow-lg bg-card">
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
