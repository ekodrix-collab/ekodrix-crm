'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Search,
  Users as UsersIcon,
  Video,
  Clock,
  Filter,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  Zap
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Meeting, User, MeetingStatus, RSVPStatus } from '@/types';
import { useMeetings, useRSVP, useDeleteMeeting, useGoogleCalendarConnection } from '@/hooks/use-meetings';
import { useUser } from '@/hooks/use-user';
import { MeetingCard } from '@/components/meetings/meeting-card';
import { MeetingForm } from '@/components/meetings/meeting-form';
import { MeetingDetailDialog } from '@/components/meetings/meeting-detail-dialog';
import { useQueryClient } from '@tanstack/react-query';

type ViewType = 'week' | 'month' | 'list';

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useUser();
  const supabase = createClient();

  // State
  const [view, setView] = useState<ViewType>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Data Fetching
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser,
  });

  const { data: meetings = [], isLoading } = useMeetings({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const deleteMeeting = useDeleteMeeting();
  const rsvpMutation = useRSVP(selectedMeeting?.id || '');
  const { data: googleStatus } = useGoogleCalendarConnection();


  // Computed Data
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.organizer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      return matchesSearch;
    });
  }, [meetings, searchQuery]);

  const calendarDays = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else if (view === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
    return [];
  }, [currentDate, view]);

  // Handlers
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    setShowCreateDialog(false);
  };

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    setEditingMeeting(null);
    setSelectedMeeting(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to cancel this meeting?')) {
      deleteMeeting.mutate(id);
    }
  };

  const handleRSVP = (status: RSVPStatus) => {
    if (selectedMeeting) {
      rsvpMutation.mutate(status, {
        onSuccess: () => {
          setSelectedMeeting(null);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Meetings
          </h1>
          <p className="text-muted-foreground">
            Schedule, manage and join your team calls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!googleStatus?.isConnected && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-primary text-primary" />
              Connect Google
            </Button>
          )}

          {googleStatus?.isConnected && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hidden sm:flex"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-primary text-primary" />
              Google Synced
            </Button>
          )}

          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>



      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Today</p>
              <p className="text-xl font-bold">{meetings.filter(m => isToday(new Date(m.start_time))).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Upcoming</p>
              <p className="text-xl font-bold">{meetings.filter(m => new Date(m.start_time) > new Date()).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-emerald-700 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-primary/80">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Team Activity</p>
              <p className="text-xl font-bold">{users.length} Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Navigation */}
      <div className="bg-card p-2 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          {view !== 'list' && (
            <div className="flex items-center gap-1 bg-accent p-1 rounded-lg">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleNavigate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-bold px-2 min-w-[120px] text-center">
                {view === 'week'
                  ? `${format(calendarDays[0], 'MMM d')} - ${format(calendarDays[6], 'MMM d')}`
                  : format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleNavigate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-accent/50 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-3 text-xs", view === 'week' && "bg-background shadow-sm")}
              onClick={() => setView('week')}
            >
              <CalendarRange className="w-3.5 h-3.5 mr-1.5" />
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-3 text-xs", view === 'month' && "bg-background shadow-sm")}
              onClick={() => setView('month')}
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-3 text-xs", view === 'list' && "bg-background shadow-sm")}
              onClick={() => setView('list')}
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map(m => (
              <MeetingCard
                key={m.id}
                meeting={m}
                onEdit={setEditingMeeting}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-accent/20 rounded-3xl border-2 border-dashed border-border">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No meetings found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Schedule your first meeting to start collaborating with your team.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="mt-6">
                Schedule Now
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Calendar Grid Views (simplified for now, focusing on List first but this provides the structure) */
        <Card className="overflow-hidden border-0 shadow-xl bg-card">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b dark:border-slate-800">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest border-r last:border-r-0 border-border">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr min-h-[500px]">
              {calendarDays.map((day, i) => {
                const dayMeetings = meetings.filter(m => isSameDay(new Date(m.start_time), day));
                const isCurrent = isToday(day);

                return (
                  <div
                    key={i}
                    className={cn(
                      "p-2 border-r border-b border-border min-h-[120px] transition-colors hover:bg-accent/30",
                      !isSameDay(day, currentDate) && view === 'month' && "bg-accent/10 opacity-40",
                      isCurrent && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full",
                        isCurrent ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayMeetings.map(m => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMeeting(m)}
                          className="group relative cursor-pointer"
                        >
                          <div
                            className="h-1.5 w-full rounded-full transition-all group-hover:h-3"
                            style={{ backgroundColor: m.color }}
                          />
                          <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                            {format(new Date(m.start_time), 'h:mm a')} {m.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Meeting</DialogTitle>
            <DialogDescription>
              Create a calendar event and optionally generate a Google Meet link.
            </DialogDescription>
          </DialogHeader>
          <MeetingForm
            users={users}
            isGoogleConnected={googleStatus?.isConnected}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMeeting} onOpenChange={(open) => !open && setEditingMeeting(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>
              Update meeting details and participants.
            </DialogDescription>
          </DialogHeader>
          {editingMeeting && (
            <MeetingForm
              users={users}
              meeting={editingMeeting}
              isGoogleConnected={googleStatus?.isConnected}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setEditingMeeting(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <MeetingDetailDialog
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onOpenChange={(open) => !open && setSelectedMeeting(null)}
        onEdit={setEditingMeeting}
        onRSVP={handleRSVP}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}