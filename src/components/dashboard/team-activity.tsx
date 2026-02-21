import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  ChevronRight,
  Trophy,
  Target,
  TrendingUp,
  Star,
} from 'lucide-react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import type { User } from '@/types';

interface TeamMemberStats {
  user: User;
  totalLeads: number;
  convertedLeads: number;
  todayTasks: number;
  completedTasks: number;
  conversionRate: number;
}

async function getTeamActivity() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return { teamStats: [], totalLeadCount: 0 };
    }

    // Get total lead count (including unassigned)
    const { count: totalLeadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Get stats for each user
    const teamStats: TeamMemberStats[] = await Promise.all(
      users.map(async (user) => {
        // Get total leads assigned
        const { count: totalLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id);

        // Get converted leads
        const { count: convertedLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('status', 'converted');

        // Get today's tasks
        const { count: todayTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('due_date', today);

        // Get completed tasks today
        const { count: completedTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('due_date', today)
          .eq('status', 'completed');

        const total = totalLeads || 0;
        const converted = convertedLeads || 0;
        const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

        return {
          user,
          totalLeads: total,
          convertedLeads: converted,
          todayTasks: todayTasks || 0,
          completedTasks: completedTasks || 0,
          conversionRate,
        };
      })
    );

    // Sort by conversion rate (descending)
    return {
      teamStats: teamStats.sort((a, b) => b.conversionRate - a.conversionRate),
      totalLeadCount: totalLeadCount || 0
    };
  } catch (error) {
    console.error('Error in getTeamActivity:', error);
    return { teamStats: [], totalLeadCount: 0 };
  }
}

export async function TeamActivity() {
  const { teamStats, totalLeadCount } = await getTeamActivity();

  // Find top performer
  const topPerformer = teamStats.length > 0 ? teamStats[0] : null;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          Team Activity
        </CardTitle>
        <Link href="/settings/team">
          <Button variant="ghost" size="sm" className="text-slate-500">
            Manage
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        {teamStats.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No team members yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Add team members to track activity
            </p>
          </div>
        ) : (
          <>
            {/* Top Performer Highlight */}
            {topPerformer && topPerformer.conversionRate > 0 && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback
                      className={cn(
                        getAvatarColor(topPerformer.user.name),
                        'text-white'
                      )}
                    >
                      {getInitials(topPerformer.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-amber-900" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    🏆 Top Performer
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {topPerformer.user.name} • {topPerformer.conversionRate}%
                    conversion
                  </p>
                </div>
              </div>
            )}

            {/* Team Member List */}
            <div className="space-y-3">
              {teamStats.map((stats, index) => (
                <TeamMemberItem
                  key={stats.user.id}
                  stats={stats}
                  rank={index + 1}
                />
              ))}
            </div>

            {/* Team Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {totalLeadCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {teamStats.reduce((sum, s) => sum + s.convertedLeads, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Converted</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">
                    {teamStats.reduce((sum, s) => sum + s.todayTasks, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Today's Tasks</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TeamMemberItem({
  stats,
  rank,
}: {
  stats: TeamMemberStats;
  rank: number;
}) {
  const { user, totalLeads, todayTasks, completedTasks, conversionRate } = stats;
  const taskProgress =
    todayTasks > 0 ? Math.round((completedTasks / todayTasks) * 100) : 0;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
      {/* Rank */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
          rank === 1
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
            : rank === 2
              ? 'bg-accent text-muted-foreground'
              : rank === 3
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                : 'bg-accent/50 text-muted-foreground'
        )}
      >
        {rank}
      </div>

      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback
          className={cn(getAvatarColor(user.name), 'text-primary-foreground text-xs')}
        >
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] ml-2 flex-shrink-0',
              conversionRate >= 10
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                : ''
            )}
          >
            {conversionRate}%
          </Badge>
        </div>

        {/* Task Progress */}
        <div className="flex items-center gap-2 mt-1">
          <Progress value={taskProgress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {completedTasks}/{todayTasks} tasks
          </span>
        </div>
      </div>
    </div>
  );
}

export function TeamActivitySkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full mb-4 rounded-lg" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}