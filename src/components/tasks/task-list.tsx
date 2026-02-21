'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  Phone,
  MessageSquare,
  Calendar,
  FileText,
  CheckSquare,
  MoreVertical,
  Clock,
  User,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn, formatDate, isOverdue, isDueToday } from '@/lib/utils';
import { TASK_TYPES, TASK_STATUSES } from '@/lib/constants';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  compact?: boolean;
  onTaskUpdated?: (task: Task) => void;
}

const taskIcons: Record<string, React.ReactNode> = {
  follow_up_call: <Phone className="w-4 h-4" />,
  follow_up_message: <MessageSquare className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  demo: <Calendar className="w-4 h-4" />,
  send_proposal: <FileText className="w-4 h-4" />,
  send_contract: <FileText className="w-4 h-4" />,
  other: <CheckSquare className="w-4 h-4" />,
};

export function TaskList({ tasks, compact = false, onTaskUpdated }: TaskListProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Group tasks by status
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Toggle task completion
  const handleToggleComplete = async (task: Task) => {
    setUpdatingId(task.id);

    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: newStatus === 'completed' ? 'Task Completed' : 'Task Reopened',
        description: task.title,
      });

      if (onTaskUpdated && data) {
        onTaskUpdated(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    setUpdatingId(taskId);

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Task Deleted',
        description: 'The task has been removed',
      });

      // Remove from list
      if (onTaskUpdated) {
        onTaskUpdated({ id: taskId, status: 'deleted' } as any as Task);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-500">No tasks scheduled</p>
      </div>
    );
  }

  const renderTask = (task: Task) => {
    const typeConfig = TASK_TYPES[task.type as keyof typeof TASK_TYPES];
    const isTaskOverdue = isOverdue(task.due_date);
    const isToday = isDueToday(task.due_date);
    const isCompleted = task.status === 'completed';

    return (
      <div
        key={task.id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
          isTaskOverdue && !isCompleted
            ? 'border-destructive/30 bg-destructive/5'
            : isToday && !isCompleted
              ? 'border-amber-500/30 bg-amber-500/5'
              : isCompleted
                ? 'border-border bg-muted/30 opacity-60'
                : 'border-border hover:bg-accent/30'
        )}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0">
          {updatingId === task.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => handleToggleComplete(task)}
            />
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isCompleted
              ? 'bg-muted text-muted-foreground'
              : isTaskOverdue
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
          )}
        >
          {taskIcons[task.type] || <CheckSquare className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                isTaskOverdue && !isCompleted
                  ? 'text-red-600 font-medium'
                  : 'text-slate-500'
              )}
            >
              <Clock className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
            {task.due_time && (
              <span className="text-xs text-slate-400">
                {task.due_time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        {!compact && task.priority === 'high' && (
          <Badge variant="destructive" className="text-[10px]">
            High
          </Badge>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleToggleComplete(task)}>
              <CheckSquare className="w-4 h-4 mr-2" />
              {isCompleted ? 'Reopen' : 'Complete'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteTask(task.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {pendingTasks.length > 0 ? (
          pendingTasks.slice(0, 5).map(renderTask)
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            All tasks completed!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Pending ({pendingTasks.length})
          </h4>
          <div className="space-y-2">{pendingTasks.map(renderTask)}</div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Completed ({completedTasks.length})
          </h4>
          <div className="space-y-2">{completedTasks.slice(0, 3).map(renderTask)}</div>
        </div>
      )}
    </div>
  );
}