import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flame,
  Phone,
  MessageCircle,
  ChevronRight,
  Building,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  getInitials,
  getAvatarColor,
} from '@/lib/utils';
import { LEAD_STATUSES, PRIORITIES } from '@/lib/constants';
import { LeadActionButtons } from './lead-action-buttons';
import type { Lead } from '@/types';

async function getHotLeads() {
  const supabase = await createClient();

  try {
    // Try to get hot leads first
    let { data: leads, error } = await supabase
      .from('leads')
      .select(
        `
        *,
        assigned_user:users!assigned_to(id, name)
      `
      )
      .in('status', ['interested', 'negotiating'])
      .order('priority', { ascending: false })
      .order('last_contacted_at', { ascending: true, nullsFirst: true })
      .limit(5);

    if (error) {
      console.error('Error fetching hot leads:', error);
    }

    // If no hot leads, get most recent leads
    if (!leads || leads.length === 0) {
      const { data: recentLeads, error: recentError } = await supabase
        .from('leads')
        .select(
          `
          *,
          assigned_user:users!assigned_to(id, name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Error fetching recent leads:', recentError);
        return { leads: [], title: 'Hot Leads' };
      }

      return {
        leads: recentLeads || [],
        title: recentLeads && recentLeads.length > 0 ? 'Recent Leads' : 'Hot Leads',
      };
    }

    return { leads, title: 'Hot Leads' };
  } catch (error) {
    console.error('Error in getHotLeads:', error);
    return { leads: [], title: 'Hot Leads' };
  }
}

export async function HotLeads() {
  const { leads, title } = await getHotLeads();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          {title}
        </CardTitle>
        <Link href="/leads">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-3">
        {leads.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
              <Flame className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Add your first lead to get started!
            </p>
            <Link href="/leads/new">
              <Button variant="outline" size="sm" className="mt-4">
                Add New Lead
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {leads.map((lead: Lead) => (
              <LeadItem key={lead.id} lead={lead} />
            ))}

            {/* View All Link */}
            <Link href="/leads" className="block">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View all leads
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LeadItem({ lead }: { lead: Lead }) {
  const status = LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES];
  // const priority = PRIORITIES[lead.priority as keyof typeof PRIORITIES];

  return (
    <Link href={`/leads/${lead.id}`}>
      <div className="flex items-start gap-4 p-3 rounded-xl border border-border hover:bg-accent transition-colors cursor-pointer group">
        {/* Avatar with priority indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-10 h-10 shadow-sm border border-border bg-green-400 flex items-center justify-center">
            <AvatarFallback
              className={cn(getAvatarColor(lead.name), 'text-white font-bold text-sm w-full h-full flex items-center justify-center')}
            >
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Lead Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {lead.name}
            </p>
            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0 border-0',
                'bg-[#10b981] hover:bg-[#10b981]/90',
                lead.status === 'new' ? 'text-black' : 'text-white'
              )}
            >
              {status?.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {lead.company_name && (
              <span className="flex items-center gap-1 truncate">
                <Building className="w-3 h-3 flex-shrink-0" />
                {lead.company_name}
              </span>
            )}
            {lead.deal_value && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(lead.deal_value)}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lead.last_contacted_at
              ? `Last contact: ${formatRelativeTime(lead.last_contacted_at)}`
              : 'Not contacted yet'}
          </p>
        </div>

        {/* Quick Actions */}
        <LeadActionButtons
          phone={lead.phone}
          whatsappNumber={lead.whatsapp_number}
        />
      </div>
    </Link>
  );
}

export function HotLeadsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}