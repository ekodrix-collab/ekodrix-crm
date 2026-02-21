import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckSquare,
  Phone,
  MessageSquare,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

// Task type icons mapping
const taskIcons: Record<string, React.ReactNode> = {
  follow_up_call: <Phone className="w-4 h-4" />,
  follow_up_message: <MessageSquare className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  demo: <Calendar className="w-4 h-4" />,
  send_proposal: <FileText className="w-4 h-4" />,
  send_contract: <FileText className="w-4 h-4" />,
  other: <CheckSquare className="w-4 h-4" />,
};

async function getTodayTasks() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        lead:leads(id, name, phone, company_name, priority),
        assigned_user:users!assigned_to(id, name)
      `
      )
      .lte('due_date', today)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return tasks || [];
  } catch (error) {
    console.error('Error in getTodayTasks:', error);
    return [];
  }
}

export async function TodayTasks() {
  const tasks = await getTodayTasks();
  const today = new Date().toISOString().split('T')[0];

  // Separate overdue and today's tasks
  const overdueTasks = tasks.filter((task) => task.due_date < today);
  const todayTasks = tasks.filter((task) => task.due_date === today);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          Today's Tasks
        </CardTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              No pending tasks for today
            </p>
          </div>
        ) : (
          <>
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                    Overdue ({overdueTasks.length})
                  </span>
                </div>
                {overdueTasks.map((task) => (
                  <TaskItem key={task.id} task={task} isOverdue />
                ))}
              </div>
            )}

            {/* Today's Tasks */}
            {todayTasks.length > 0 && (
              <div className="space-y-2">
                {overdueTasks.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Today ({todayTasks.length})
                    </span>
                  </div>
                )}
                {todayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}

            {/* Show more link if there are more tasks */}
            {tasks.length >= 8 && (
              <Link href="/tasks" className="block">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Show more tasks
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TaskItem({ task, isOverdue = false }: { task: Task; isOverdue?: boolean }) {
  const Icon = taskIcons[task.type] || <CheckSquare className="w-4 h-4" />;
  const priority = task.lead?.priority;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        isOverdue
          ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20'
          : 'border-border hover:bg-accent transition-colors'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
          isOverdue
            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
            : 'bg-primary/10 text-primary'
        )}
      >
        {Icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{task.title}</p>
          {priority === 'hot' && <span className="text-xs">🔥</span>}
        </div>
        {task.lead && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3" />
            {task.lead.name}
            {task.lead.company_name && ` • ${task.lead.company_name}`}
          </p>
        )}
      </div>

      {/* Time & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.due_time && (
          <Badge variant="outline" className="text-xs font-normal">
            <Clock className="w-3 h-3 mr-1" />
            {task.due_time.slice(0, 5)}
          </Badge>
        )}
        <Link href={task.lead ? `/leads/${task.lead.id}` : '/tasks'}>
          <Button
            size="sm"
            variant={isOverdue ? 'destructive' : 'outline'}
            className="h-8"
          >
            {isOverdue ? 'Do Now' : 'View'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TodayTasksSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}