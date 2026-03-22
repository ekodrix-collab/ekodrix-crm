'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Globe,
  Plus,
  Users,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  History,
} from 'lucide-react';
import {
  cn,
  formatDate,
  formatDateTime,
  formatPhoneNumber,
  getInitials,
  getAvatarColor,
  openWhatsApp,
  openPhoneDialer,
  openEmailClient,
} from '@/lib/utils';
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES } from '@/lib/constants';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadSourceIcon } from './lead-source-icon';
import { InteractionTimeline } from '../interactions/interaction-timeline';
import { InteractionForm } from '../interactions/interaction-form';
import { TaskList } from '../tasks/task-list';
import { TaskForm } from '../tasks/task-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import type { Lead, Interaction, Task, User as UserType } from '@/types';

interface LeadDetailViewProps {
  lead: Lead;
  interactions: Interaction[];
  tasks: Task[];
  users?: UserType[];
}

export function LeadDetailView({
  lead: initialLead,
  interactions: initialInteractions,
  tasks: initialTasks,
  users: initialUsers = [],
}: LeadDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [lead, setLead] = useState<Lead>(initialLead);
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Sync with props when they change
  useEffect(() => {
    setLead(initialLead);
    setInteractions(initialInteractions);
    setTasks(initialTasks);
  }, [initialLead, initialInteractions, initialTasks]);

  const handleInteractionAdded = (newInteraction: Interaction) => {
    setInteractions(prev => {
      const exists = prev.find(i => i.id === newInteraction.id);
      if (exists) {
        return prev.map(i => i.id === newInteraction.id ? newInteraction : i);
      }
      return [newInteraction, ...prev];
    });
    setShowInteractionDialog(false);
    setEditingInteraction(undefined);
    toast({
      title: editingInteraction ? 'Log Updated' : 'Interaction Logged',
      description: 'The interaction has been successfully recorded.',
    });
    router.refresh();
  };

  const handleTaskAdded = (newTask: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === newTask.id);
      if (exists) {
        return prev.map(t => t.id === newTask.id ? newTask : t);
      }
      return [newTask, ...prev];
    });
    setShowTaskDialog(false);
    setEditingTask(undefined);
    toast({
      title: editingTask ? 'Task Updated' : 'Task Created',
      description: 'The follow-up task has been successfully saved.',
    });
    router.refresh();
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    if (updatedTask.status as string === 'deleted') {
      setTasks(prevTasks => prevTasks.filter((t) => t.id !== updatedTask.id));
    } else {
      setTasks(prevTasks => prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    }
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setShowInteractionDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const statusConfig = LEAD_STATUSES[lead.status] || LEAD_STATUSES.new;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.name}</h1>
              <LeadStatusBadge status={lead.status} />
              {lead.priority === 'hot' && (
                <Badge variant="destructive" className="animate-pulse">
                  🔥 HOT
                </Badge>
              )}
            </div>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Building className="w-4 h-4" />
              {lead.company_name || 'Individual'} • Added on {formatDate(lead.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openPhoneDialer(lead.phone || '')} disabled={!lead.phone}>
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" size="sm" onClick={() => openWhatsApp(lead.whatsapp_number || lead.phone || '')} disabled={!lead.whatsapp_number && !lead.phone}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Link href={`/leads/${lead.id}/edit`}>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Lead
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3 text-lg font-semibold flex flex-row items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Lead Information
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Contact Details</p>
                <div className="space-y-2">
                  {lead.email && (
                    <div className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => openEmailClient(lead.email!)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{formatPhoneNumber(lead.phone)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => openPhoneDialer(lead.phone!)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {lead.whatsapp_number && (
                    <div className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{formatPhoneNumber(lead.whatsapp_number)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => openWhatsApp(lead.whatsapp_number!)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Company & Role</p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <p className="text-sm">{lead.company_name || 'Not specified'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-sm">{lead.designation || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Social Media</p>
                <div className="flex gap-2 pt-2">
                  {lead.instagram_handle && (
                    <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                      <a href={`https://instagram.com/${lead.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4 text-pink-500" />
                      </a>
                    </Button>
                  )}
                  {lead.facebook_url && (
                    <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                      <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer">
                        <Facebook className="w-4 h-4 text-blue-600" />
                      </a>
                    </Button>
                  )}
                  {lead.linkedin_url && (
                    <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                      <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 text-blue-700" />
                      </a>
                    </Button>
                  )}
                  {lead.website && (
                    <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 text-slate-500" />
                      </a>
                    </Button>
                  )}
                  {!lead.instagram_handle && !lead.facebook_url && !lead.linkedin_url && !lead.website && (
                    <p className="text-xs text-slate-400 italic">No social links added</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader className="pb-3 text-lg font-semibold flex flex-row items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              Project Details
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Type</p>
                  <p className="text-sm font-medium">{lead.project_type || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Budget</p>
                  <p className="text-sm font-medium">{lead.budget_range || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Timeline</p>
                  <p className="text-sm font-medium">{lead.timeline || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Source</p>
                  <div className="flex items-center gap-1.5">
                    <LeadSourceIcon source={lead.source} size="sm" />
                    <span className="text-sm font-medium leading-none capitalize">{lead.source}</span>
                  </div>
                </div>
              </div>

              {lead.requirements && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Requirements</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap pt-1">{lead.requirements}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader className="pb-3 text-lg font-semibold flex flex-row items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Assignment
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={lead.assigned_user?.avatar_url || undefined} />
                  <AvatarFallback
                    className={cn(
                      getAvatarColor(lead.assigned_user?.name || 'Unassigned'),
                      'text-white text-sm'
                    )}
                  >
                    {getInitials(lead.assigned_user?.name || '??')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Assigned To</p>
                  <p className="font-medium">{lead.assigned_user?.name || 'Unassigned'}</p>
                </div>
              </div>

              {/* Created By Info */}
              {lead.created_by_user && (
                <div className="pt-2 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                  <Avatar className="w-8 h-8 opacity-60">
                    <AvatarFallback
                      className={cn(
                        getAvatarColor(lead.created_by_user.name),
                        'text-white text-[10px]'
                      )}
                    >
                      {getInitials(lead.created_by_user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Created By</p>
                    <p className="text-xs font-medium">{lead.created_by_user.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="interactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="interactions" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Interactions
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Follow-up Tasks
              </TabsTrigger>
            </TabsList>

            {/* Interactions Tab */}
            <TabsContent value="interactions" className="mt-6">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Interactions ({interactions.length})
                  </CardTitle>
                  <Dialog open={showInteractionDialog} onOpenChange={(open) => {
                    setShowInteractionDialog(open);
                    if (!open) setEditingInteraction(undefined);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Log Interaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingInteraction ? 'Edit Log' : 'Log Interaction'}</DialogTitle>
                        <DialogDescription>
                          {editingInteraction ? 'Update the details for this log entry' : `Record a call, message, or note for ${lead.name}`}
                        </DialogDescription>
                      </DialogHeader>
                      <InteractionForm
                        leadId={lead.id}
                        currentStatus={lead.status}
                        initialData={editingInteraction}
                        onSuccess={handleInteractionAdded}
                        onCancel={() => {
                          setShowInteractionDialog(false);
                          setEditingInteraction(undefined);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <InteractionTimeline 
                      interactions={interactions} 
                      onEdit={handleEditInteraction}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Follow-up Tasks ({tasks.length})
                  </CardTitle>
                  <Dialog open={showTaskDialog} onOpenChange={(open) => {
                    setShowTaskDialog(open);
                    if (!open) setEditingTask(undefined);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
                        <DialogDescription>
                          {editingTask ? 'Update the details for this follow-up action' : `Assign a follow-up action for ${lead.name}`}
                        </DialogDescription>
                      </DialogHeader>
                      <TaskForm
                        leadId={lead.id}
                        users={initialUsers}
                        task={editingTask}
                        onSuccess={handleTaskAdded}
                        onCancel={() => {
                          setShowTaskDialog(false);
                          setEditingTask(undefined);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <TaskList 
                      tasks={tasks} 
                      onTaskUpdated={handleTaskUpdated}
                      onEditTask={handleEditTask}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}