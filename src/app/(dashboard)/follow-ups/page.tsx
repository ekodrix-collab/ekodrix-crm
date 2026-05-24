import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Phone, MessageCircle, AlertCircle, CalendarRange, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FollowUpActionButtons } from '@/components/dashboard/follow-up-action-buttons';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Follow-Up Cockpit',
  description: 'Manage all your pending lead follow-ups in one Cockpit',
};

export const dynamic = 'force-dynamic';

interface FollowUpsPageProps {
  searchParams: {
    scope?: string;
    campaign_id?: string;
  };
}

async function getFollowUpLeads(searchParams: FollowUpsPageProps['searchParams']) {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let query = supabase
    .from('leads')
    .select('id, name, phone, whatsapp_number, email, company_name, next_follow_up_date, is_follow_up_completed, priority, status')
    .not('next_follow_up_date', 'is', null)
    .or('is_follow_up_completed.is.null,is_follow_up_completed.eq.false')
    .order('next_follow_up_date', { ascending: true });

  // Apply scope filtering (My Space vs. All Space)
  const scope = searchParams.scope || 'my';
  if (scope === 'my') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      query = query.eq('assigned_to', user.id);
    }
  }

  // Apply campaign filter
  if (searchParams.campaign_id && searchParams.campaign_id !== 'all') {
    query = query.eq('campaign_id', searchParams.campaign_id);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) {
      console.error('Error fetching follow-up leads:', error);
    }
    return {
      overdueLeads: [],
      todayLeads: [],
      tomorrowLeads: [],
      upcomingLeads: [],
      totalCount: 0,
    };
  }

  const leads = data;

  const overdueLeads: any[] = [];
  const todayLeads: any[] = [];
  const tomorrowLeads: any[] = [];
  const upcomingLeads: any[] = [];

  leads.forEach((lead) => {
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

  return {
    overdueLeads,
    todayLeads,
    tomorrowLeads,
    upcomingLeads,
    totalCount: leads.length,
  };
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const sParams = await searchParams;
  const { overdueLeads, todayLeads, tomorrowLeads, upcomingLeads, totalCount } = await getFollowUpLeads(sParams);

  const supabase = await createClient();
  const { data: campaigns = [] } = await supabase
    .from('campaigns')
    .select('id, name')
    .order('name');

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarRange className="w-8 h-8 text-primary" />
            Follow-Up Cockpit
          </h1>
          <p className="text-muted-foreground mt-1">
            Execute pending lead follow-ups quickly to accelerate conversions ({totalCount} total)
          </p>
        </div>
      </div>

      {/* Scope & Campaign Filters */}
      <DashboardFilters campaigns={campaigns || []} />

      {/* Cockpit Tabs */}
      <Tabs defaultValue={overdueLeads.length > 0 ? "overdue" : "today"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 p-1 mb-6 bg-slate-100/50 dark:bg-slate-900/50 border border-border">
          <TabsTrigger 
            value="overdue" 
            className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-rose-200 dark:data-[state=active]:border-rose-900/50"
          >
            <AlertCircle className={cn("w-4 h-4", overdueLeads.length > 0 ? "text-rose-500" : "text-muted-foreground")} />
            Overdue
            <Badge variant="secondary" className={cn("ml-1 px-1.5 py-0", overdueLeads.length > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-muted text-muted-foreground")}>
              {overdueLeads.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="today" 
            className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-amber-200 dark:data-[state=active]:border-amber-900/50"
          >
            <Clock className={cn("w-4 h-4", todayLeads.length > 0 ? "text-amber-500" : "text-muted-foreground")} />
            Today
            <Badge variant="secondary" className={cn("ml-1 px-1.5 py-0", todayLeads.length > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground")}>
              {todayLeads.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="tomorrow" 
            className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-blue-200 dark:data-[state=active]:border-blue-900/50"
          >
            <Calendar className={cn("w-4 h-4", tomorrowLeads.length > 0 ? "text-blue-500" : "text-muted-foreground")} />
            Tomorrow
            <Badge variant="secondary" className={cn("ml-1 px-1.5 py-0", tomorrowLeads.length > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-muted text-muted-foreground")}>
              {tomorrowLeads.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="upcoming" 
            className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-slate-300 dark:data-[state=active]:border-slate-700"
          >
            <CalendarRange className="w-4 h-4 text-slate-500" />
            Upcoming
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {upcomingLeads.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overdue" className="mt-0 outline-none">
            <FollowUpList leads={overdueLeads} type="overdue" emptyMessage="No overdue actions! Great job." />
          </TabsContent>
          <TabsContent value="today" className="mt-0 outline-none">
            <FollowUpList leads={todayLeads} type="today" emptyMessage="No actions scheduled for today." />
          </TabsContent>
          <TabsContent value="tomorrow" className="mt-0 outline-none">
            <FollowUpList leads={tomorrowLeads} type="tomorrow" emptyMessage="No actions scheduled for tomorrow." />
          </TabsContent>
          <TabsContent value="upcoming" className="mt-0 outline-none">
            <FollowUpList leads={upcomingLeads} type="upcoming" emptyMessage="No upcoming actions scheduled." />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function FollowUpList({ leads, type, emptyMessage }: { leads: any[]; type: 'overdue' | 'today' | 'tomorrow' | 'upcoming'; emptyMessage: string }) {
  if (leads.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-24 border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/20 shadow-none">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mt-1">You're all caught up here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <FollowUpRow key={lead.id} lead={lead} type={type} />
      ))}
    </div>
  );
}

function FollowUpRow({ lead, type }: { lead: any; type: 'overdue' | 'today' | 'tomorrow' | 'upcoming' }) {
  const borderClass = {
    overdue: 'border-l-4 border-l-rose-500 hover:border-rose-400 dark:hover:border-rose-600',
    today: 'border-l-4 border-l-amber-500 hover:border-amber-400 dark:hover:border-amber-600',
    tomorrow: 'border-l-4 border-l-blue-500 hover:border-blue-400 dark:hover:border-blue-600',
    upcoming: 'border-l-4 border-l-slate-400 hover:border-slate-400 dark:hover:border-slate-500',
  }[type];

  const dateColorClass = {
    overdue: 'text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-md',
    today: 'text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-md',
    tomorrow: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-md',
    upcoming: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md',
  }[type];

  const formattedDate = new Date(lead.next_follow_up_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className={cn('flex flex-col md:flex-row md:items-center justify-between p-5 transition-all duration-200 hover:shadow-md bg-card overflow-hidden', borderClass)}>
      <div className="flex items-start md:items-center gap-4 mb-4 md:mb-0 min-w-0 flex-1">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {lead.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/leads/${lead.id}`} className="hover:underline font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-primary truncate">
              {lead.name}
            </Link>
            {lead.priority === 'hot' && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                🔥 Hot
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            {lead.company_name && (
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" /> 
                {lead.company_name}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border md:pl-6">
        <div className={cn("text-sm flex items-center gap-2 whitespace-nowrap", dateColorClass)}>
          <Calendar className="w-4 h-4" />
          Scheduled: {formattedDate}
        </div>

        <FollowUpActionButtons 
          leadId={lead.id} 
          phone={lead.phone} 
          whatsapp={lead.whatsapp_number} 
        />
      </div>
    </Card>
  );
}

