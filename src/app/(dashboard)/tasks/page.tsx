'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskForm } from '@/components/tasks/task-form';
import { useTasks, useTaskStats } from '@/hooks/use-tasks';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_TYPES } from '@/lib/constants';
import type { User, Task } from '@/types';

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  const supabase = createClient();

  // State
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('view') || 'today'
  );
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch tasks based on active tab
  // Memoize filters to prevent infinite re-renders in useTasks
  const taskOptions = useMemo(() => ({
    view:
      activeTab === 'all'
        ? undefined
        : (['today', 'overdue', 'upcoming'].includes(activeTab)
          ? (activeTab as 'today' | 'overdue' | 'upcoming')
          : undefined),
    filters: {
      type: typeFilter !== 'all' ? (typeFilter as Task['type']) : undefined,
      assigned_to: assigneeFilter !== 'all' ? assigneeFilter : undefined,
    },
  }), [activeTab, typeFilter, assigneeFilter]);

  const {
    tasks,
    loading,
    error,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    refetch,
    completeTask,
    reopenTask,
    deleteTask,
  } = useTasks(taskOptions);

  // Task stats
  const { stats, loading: statsLoading } = useTaskStats(user?.id);

  // Fetch team members
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role, is_active, daily_target, created_at, updated_at')
        .eq('is_active', true)
        .order('name');
      setUsers(data || []);
    };
    fetchUsers();
  }, [supabase]);

  // Get tasks for current view
  const getDisplayTasks = (): Task[] => {
    let displayTasks: Task[] = [];

    switch (activeTab) {
      case 'overdue':
        displayTasks = overdueTasks;
        break;
      case 'today':
        displayTasks = todayTasks;
        break;
      case 'upcoming':
        displayTasks = upcomingTasks;
        break;
      case 'completed':
        displayTasks = tasks.filter((t) => t.status === 'completed');
        break;
      default:
        displayTasks = tasks;
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      displayTasks = displayTasks.filter((t) => t.type === typeFilter);
    }

    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      displayTasks = displayTasks.filter((t) => t.assigned_to === assigneeFilter);
    }

    return displayTasks;
  };

  // Handle task creation
  const handleTaskSuccess = (task: Task) => {
    setShowCreateDialog(false);
    setEditingTask(null);
    refetch();
    toast({
      title: editingTask ? 'Task Updated' : 'Task Created',
      description: task.title,
    });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/tasks?view=${value}`, { scroll: false });
  };

  const displayTasks = getDisplayTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage your follow-ups and to-dos
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <Button onClick={() => { setEditingTask(null); setShowCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update task details' : 'Schedule a new task or follow-up'}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              users={users}
              task={editingTask || undefined}
              onSuccess={handleTaskSuccess}
              onCancel={() => { setShowCreateDialog(false); setEditingTask(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overdue"
          value={statsLoading ? '-' : stats.overdue}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
          onClick={() => handleTabChange('overdue')}
          active={activeTab === 'overdue'}
        />
        <StatsCard
          title="Today"
          value={statsLoading ? '-' : stats.todayCount}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          onClick={() => handleTabChange('today')}
          active={activeTab === 'today'}
        />
        <StatsCard
          title="Upcoming"
          value={statsLoading ? '-' : stats.pending - stats.overdue - stats.todayCount}
          icon={<Calendar className="w-5 h-5" />}
          color="green"
          onClick={() => handleTabChange('upcoming')}
          active={activeTab === 'upcoming'}
        />
        <StatsCard
          title="Completed"
          value={statsLoading ? '-' : stats.completed}
          icon={<CheckSquare className="w-5 h-5" />}
          color="green"
          onClick={() => handleTabChange('completed')}
          active={activeTab === 'completed'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by:</span>
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Task Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TASK_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(typeFilter !== 'all' || assigneeFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setAssigneeFilter('all');
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}

        <div className="ml-auto">
          <Badge variant="secondary">
            {displayTasks.length} task{displayTasks.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overdue" className="gap-2">
            <AlertCircle className="w-4 h-4 hidden sm:block" />
            Overdue
            {stats.overdue > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {stats.overdue}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="w-4 h-4 hidden sm:block" />
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="w-4 h-4 hidden sm:block" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckSquare className="w-4 h-4 hidden sm:block" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {/* Task Content */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-5 h-5 rounded" />
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayTasks.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-4">
              {displayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onReopen={reopenTask}
                  onDelete={deleteTask}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setShowCreateDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon,
  color,
  onClick,
  active,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'red' | 'amber' | 'blue' | 'green';
  onClick: () => void;
  active: boolean;
}) {
  const colorClasses = {
    red: 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/30',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
    blue: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30',
    green: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30',
  };

  const iconBgClasses = {
    red: 'bg-destructive/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-primary/20',
    green: 'bg-primary/20',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        active && 'ring-2 ring-offset-2',
        active && color === 'red' && 'ring-red-500',
        active && color === 'amber' && 'ring-amber-500',
        active && color === 'blue' && 'ring-emerald-500',
        active && color === 'green' && 'ring-emerald-500'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              iconBgClasses[color]
            )}
          >
            <span className={colorClasses[color].split(' ')[1]}>{icon}</span>
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
    overdue: {
      title: 'No overdue tasks',
      description: "Great job! You're all caught up.",
      icon: <CheckSquare className="w-12 h-12 text-green-500" />,
    },
    today: {
      title: 'No tasks for today',
      description: 'Enjoy your free day or add a new task.',
      icon: <Calendar className="w-12 h-12 text-primary" />,
    },
    upcoming: {
      title: 'No upcoming tasks',
      description: 'Schedule some tasks to stay productive.',
      icon: <Calendar className="w-12 h-12 text-muted-foreground/40" />,
    },
    completed: {
      title: 'No completed tasks',
      description: 'Complete some tasks to see them here.',
      icon: <CheckSquare className="w-12 h-12 text-muted-foreground/40" />,
    },
    all: {
      title: 'No tasks found',
      description: 'Create your first task to get started.',
      icon: <CheckSquare className="w-12 h-12 text-muted-foreground/40" />,
    },
  };

  const message = messages[tab] || messages.all;

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
        {message.icon}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        {message.title}
      </h3>
      <p className="text-muted-foreground">{message.description}</p>
    </div>
  );
}