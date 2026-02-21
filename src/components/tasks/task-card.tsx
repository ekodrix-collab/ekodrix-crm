'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Building,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  CalendarClock,
} from 'lucide-react';
import {
  cn,
  formatDate,
  formatPhoneNumber,
  isOverdue,
  isDueToday,
  getInitials,
  getAvatarColor,
  openPhoneDialer,
  openWhatsApp,
} from '@/lib/utils';
import { TASK_TYPES, TASK_STATUSES } from '@/lib/constants';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => Promise<boolean>;
  onReopen?: (taskId: string) => Promise<boolean>;
  onDelete?: (taskId: string) => Promise<boolean>;
  onEdit?: (task: Task) => void;
  showLead?: boolean;
}

const taskIcons: Record<string, React.ReactNode> = {
  follow_up_call: <Phone className="w-5 h-5" />,
  follow_up_message: <MessageSquare className="w-5 h-5" />,
  meeting: <Calendar className="w-5 h-5" />,
  demo: <Calendar className="w-5 h-5" />,
  send_proposal: <FileText className="w-5 h-5" />,
  send_contract: <FileText className="w-5 h-5" />,
  collect_payment: <FileText className="w-5 h-5" />,
  other: <CheckSquare className="w-5 h-5" />,
};

export function TaskCard({
  task,
  onComplete,
  onReopen,
  onDelete,
  onEdit,
  showLead = true,
}: TaskCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const typeConfig = TASK_TYPES[task.type as keyof typeof TASK_TYPES];
  const isTaskOverdue = isOverdue(task.due_date);
  const isToday = isDueToday(task.due_date);
  const isCompleted = task.status === 'completed';

  const handleToggleComplete = async () => {
    setIsUpdating(true);

    try {
      let success = false;

      if (isCompleted && onReopen) {
        success = await onReopen(task.id);
      } else if (!isCompleted && onComplete) {
        success = await onComplete(task.id);
      }

      if (success) {
        toast({
          title: isCompleted ? 'Task Reopened' : 'Task Completed',
          description: task.title,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsUpdating(true);

    try {
      const success = await onDelete(task.id);

      if (success) {
        toast({
          title: 'Task Deleted',
          description: 'The task has been removed',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isTaskOverdue && !isCompleted
          ? 'border-destructive/30 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10'
          : isToday && !isCompleted
            ? 'border-amber-500/30 bg-amber-500/5 dark:border-amber-500/30 dark:bg-amber-500/10'
            : isCompleted
              ? 'border-border bg-muted/30 opacity-70'
              : 'border-border hover:border-primary/50'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-1 flex-shrink-0">
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={handleToggleComplete}
                className={cn(
                  'w-5 h-5',
                  isTaskOverdue && !isCompleted && 'border-destructive'
                )}
              />
            )}
          </div>

          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              isCompleted
                ? 'bg-muted text-muted-foreground'
                : isTaskOverdue
                  ? 'bg-destructive/10 text-destructive'
                  : isToday
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-primary/10 text-primary'
            )}
          >
            {taskIcons[task.type] || <CheckSquare className="w-5 h-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className={cn(
                    'font-semibold text-foreground',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Type Badge */}
                  <Badge variant="secondary" className="text-xs">
                    {typeConfig?.label || task.type}
                  </Badge>

                  {/* Priority Badge */}
                  {task.priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      High Priority
                    </Badge>
                  )}

                  {/* Overdue Badge */}
                  {isTaskOverdue && !isCompleted && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      Overdue
                    </Badge>
                  )}

                  {/* Today Badge */}
                  {isToday && !isCompleted && (
                    <Badge className="text-xs bg-amber-500">Due Today</Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleToggleComplete}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {isCompleted ? 'Reopen Task' : 'Mark Complete'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(task)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(task)}>
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                  {task.lead && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/leads/${task.lead.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Lead
                        </Link>
                      </DropdownMenuItem>
                      {task.lead.phone && (
                        <DropdownMenuItem
                          onClick={() => openPhoneDialer(task.lead!.phone!)}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Lead
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              {/* Due Date & Time */}
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  isTaskOverdue && !isCompleted
                    ? 'text-destructive font-medium'
                    : isToday && !isCompleted
                      ? 'text-amber-600 font-medium'
                      : 'text-muted-foreground'
                )}
              >
                <Clock className="w-4 h-4" />
                <span>{formatDate(task.due_date)}</span>
                {task.due_time && (
                  <span className="text-slate-400">
                    at {task.due_time.slice(0, 5)}
                  </span>
                )}
              </div>

              {/* Assigned To */}
              {task.assigned_user && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarImage
                      src={task.assigned_user.avatar_url || undefined}
                    />
                    <AvatarFallback
                      className={cn(
                        getAvatarColor(task.assigned_user.name),
                        'text-white text-[8px]'
                      )}
                    >
                      {getInitials(task.assigned_user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">
                    {task.assigned_user.name.split(' ')[0]}
                  </span>
                </div>
              )}

              {/* Lead Info */}
              {showLead && task.lead && (
                <Link
                  href={`/leads/${task.lead.id}`}
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80"
                >
                  <User className="w-4 h-4" />
                  <span>{task.lead.name}</span>
                  {task.lead.company_name && (
                    <span className="text-muted-foreground/60 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {task.lead.company_name}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Quick Actions for Lead */}
            {showLead && task.lead && task.lead.phone && !isCompleted && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPhoneDialer(task.lead!.phone!)}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openWhatsApp(task.lead!.phone!)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  WhatsApp
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}