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
  Zap,
  Sparkles,
  ArrowRight,
  Radio,
  CalendarCheck,
  X,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  isPast,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
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
import { Meeting, User, RSVPStatus } from '@/types';
import { useMeetings, useRSVP, useDeleteMeeting, useGoogleCalendarConnection } from '@/hooks/use-meetings';
import { useUser } from '@/hooks/use-user';
import { MeetingCard } from '@/components/meetings/meeting-card';
import { MeetingForm } from '@/components/meetings/meeting-form';
import { MeetingDetailDialog } from '@/components/meetings/meeting-detail-dialog';
import { useQueryClient } from '@tanstack/react-query';

type ViewType = 'list' | 'week' | 'month';
type TimeTabType = 'all' | 'today' | 'upcoming' | 'past';

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useUser();
  const supabase = createClient();

  // State
  const [view, setView] = useState<ViewType>('list');
  const [timeTab, setTimeTab] = useState<TimeTabType>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  // Data Fetching
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').order('name');
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

  // Next imminent call (spotlight banner)
  const nextImminentCall = useMemo(() => {
    const now = new Date();
    const upcoming = meetings
      .filter((m) => {
        if (m.status === 'cancelled') return false;
        const start = parseISO(m.start_time);
        const end = parseISO(m.end_time);
        // Either live now or starts within next 24 hours
        return end > now;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return upcoming[0] || null;
  }, [meetings]);

  // Computed & Filtered Meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const start = parseISO(m.start_time);
      const end = parseISO(m.end_time);
      const now = new Date();

      // Time tab filter
      if (timeTab === 'today') {
        if (!isToday(start)) return false;
      } else if (timeTab === 'upcoming') {
        if (start < now || m.status === 'completed' || m.status === 'cancelled') return false;
      } else if (timeTab === 'past') {
        if (end > now && m.status !== 'completed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          m.title.toLowerCase().includes(query) ||
          m.organizer?.name?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.lead?.name?.toLowerCase().includes(query) ||
          m.lead?.company_name?.toLowerCase().includes(query) ||
          m.location?.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [meetings, searchQuery, timeTab]);

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
    setPrefilledDate(undefined);
  };

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    setEditingMeeting(null);
    setSelectedMeeting(null);
  };

  const handleDelete = (id: string) => {
    const m = meetings.find((x) => x.id === id);
    if (m) {
      setMeetingToDelete(m);
    } else {
      setMeetingToDelete({ id, title: 'this meeting' } as any);
    }
  };

  const handleConfirmCancelMeeting = () => {
    if (meetingToDelete) {
      deleteMeeting.mutate(meetingToDelete.id, {
        onSuccess: () => {
          setMeetingToDelete(null);
        },
      });
    }
  };

  const handleRSVP = (status: RSVPStatus) => {
    if (selectedMeeting) {
      rsvpMutation.mutate(status, {
        onSuccess: () => {
          setSelectedMeeting(null);
        },
      });
    }
  };

  // Metrics
  const todayCount = meetings.filter((m) => isToday(parseISO(m.start_time))).length;
  const upcomingCount = meetings.filter((m) => new Date(m.start_time) > new Date() && m.status !== 'cancelled').length;
  const completedCount = meetings.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              Meetings & Client Calls
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule, manage, and join your client briefings, project syncs, and team calls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {!googleStatus?.isConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20 gap-1.5 h-9 font-semibold"
              onClick={() => (window.location.href = '/api/auth/google')}
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              Connect Google Meet
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800 gap-1.5 py-1.5 px-3"
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              Google Calendar Synced
            </Badge>
          )}

          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-9 gap-1.5 shadow-sm"
            onClick={() => {
              setPrefilledDate(undefined);
              setShowCreateDialog(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Next Imminent Call Spotlight Banner (if exists) */}
      {nextImminentCall && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-5 shadow-md border border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
                  {isToday(parseISO(nextImminentCall.start_time))
                    ? 'Upcoming Call Today'
                    : `Next Up • ${format(parseISO(nextImminentCall.start_time), 'EEE, MMM d')}`}
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-300" />
                  {format(parseISO(nextImminentCall.start_time), 'h:mm a')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {nextImminentCall.title}
              </h2>
              {nextImminentCall.lead && (
                <p className="text-xs text-emerald-200/90 font-medium">
                  Client: {nextImminentCall.lead.company_name || nextImminentCall.lead.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-center">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-9"
                onClick={() => setSelectedMeeting(nextImminentCall)}
              >
                View Details
              </Button>
              {nextImminentCall.meeting_link && (
                <Button
                  asChild
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs h-9 gap-1.5 shadow-md"
                >
                  <a href={nextImminentCall.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Video className="w-4 h-4" />
                    Join Google Meet
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Cockpit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/80 shadow-xs bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Today's Calls
              </p>
              <p className="text-2xl font-black text-foreground">
                {todayCount}
              </p>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {todayCount === 1 ? '1 session today' : `${todayCount} sessions today`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Upcoming
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {upcomingCount}
              </p>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Future scheduled calls
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Completed
              </p>
              <p className="text-2xl font-black text-foreground">
                {completedCount}
              </p>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Concluded discussions
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Team Active
              </p>
              <p className="text-2xl font-black text-foreground">
                {users.length}
              </p>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Staff participants
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Time Tabs + Search + View Switcher */}
      <div className="bg-card p-3 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Time Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(
              [
                { id: 'all', label: 'All Calls', count: meetings.length },
                { id: 'today', label: 'Today', count: todayCount },
                { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
                { id: 'past', label: 'Past & Done', count: completedCount },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setTimeTab(tab.id)}
                className={cn(
                  'h-8 px-3 text-xs font-semibold rounded-lg transition-all',
                  timeTab === tab.id
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    timeTab === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </Button>
            ))}
          </div>

          {/* Right: View Switcher */}
          <div className="flex items-center gap-2 justify-between lg:justify-end">
            {view !== 'list' && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/70">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleNavigate('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold px-2 min-w-[130px] text-center">
                  {view === 'week'
                    ? `${format(calendarDays[0], 'MMM d')} - ${format(
                        calendarDays[6],
                        'MMM d'
                      )}`
                    : format(currentDate, 'MMMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleNavigate('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/70">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-3 text-xs font-semibold rounded-lg transition-all',
                  view === 'list' && 'bg-background font-bold shadow-xs text-foreground'
                )}
                onClick={() => setView('list')}
              >
                <List className="w-3.5 h-3.5 mr-1.5" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-3 text-xs font-semibold rounded-lg transition-all',
                  view === 'week' && 'bg-background font-bold shadow-xs text-foreground'
                )}
                onClick={() => setView('week')}
              >
                <CalendarRange className="w-3.5 h-3.5 mr-1.5" />
                Week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-3 text-xs font-semibold rounded-lg transition-all',
                  view === 'month' && 'bg-background font-bold shadow-xs text-foreground'
                )}
                onClick={() => setView('month')}
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                Month
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Search & Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-border/60">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings by title, host, client, or notes..."
              className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background/80 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background/80 rounded-xl">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">Active (Live)</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {filteredMeetings.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredMeetings.map((m) => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  onView={(meeting) => setSelectedMeeting(meeting)}
                  onEdit={setEditingMeeting}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-card rounded-3xl border-2 border-dashed border-border/80 p-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No meetings found
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1.5">
                {searchQuery || statusFilter !== 'all' || timeTab !== 'all'
                  ? 'No calls match your active filter criteria. Try resetting filters.'
                  : 'Schedule your first project briefing, discovery call, or team sync.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2.5">
                {(searchQuery || statusFilter !== 'all' || timeTab !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setTimeTab('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule Now
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Calendar Grid Views (Week & Month) */
        <Card className="overflow-hidden border border-border/80 shadow-xs bg-card rounded-2xl">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest border-r last:border-r-0 border-border"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr min-h-[550px]">
              {calendarDays.map((day, i) => {
                const dayMeetings = meetings.filter((m) =>
                  isSameDay(parseISO(m.start_time), day)
                );
                const isCurrent = isToday(day);

                return (
                  <div
                    key={i}
                    className={cn(
                      'p-2 border-r border-b border-border/70 min-h-[120px] transition-colors hover:bg-muted/30 group relative',
                      !isSameDay(day, currentDate) &&
                        view === 'month' &&
                        'bg-muted/10 opacity-50',
                      isCurrent && 'bg-emerald-500/[0.04]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          'flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full',
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Quick schedule button on hover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setPrefilledDate(format(day, 'yyyy-MM-dd'));
                          setShowCreateDialog(true);
                        }}
                      >
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>

                    <div className="space-y-1.5 overflow-hidden">
                      {dayMeetings.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMeeting(m)}
                          className="px-1.5 py-1 rounded-md text-[11px] font-semibold truncate cursor-pointer transition-all hover:scale-[1.02] border border-border/60 flex items-center gap-1.5 shadow-2xs"
                          style={{
                            backgroundColor: `${m.color || '#10b981'}15`,
                            borderColor: `${m.color || '#10b981'}40`,
                            color: m.color || '#10b981',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: m.color || '#10b981' }}
                          />
                          <span className="truncate">
                            {format(parseISO(m.start_time), 'h:mm a')} {m.title}
                          </span>
                        </div>
                      ))}

                      {dayMeetings.length > 3 && (
                        <p className="text-[10px] font-bold text-muted-foreground pl-1">
                          +{dayMeetings.length - 3} more
                        </p>
                      )}
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
            <DialogTitle className="text-xl font-bold">Schedule New Meeting</DialogTitle>
            <DialogDescription>
              Create a calendar event with agenda, participants, and automated Google Meet link.
            </DialogDescription>
          </DialogHeader>
          <MeetingForm
            users={users}
            isGoogleConnected={googleStatus?.isConnected}
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setShowCreateDialog(false);
              setPrefilledDate(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingMeeting}
        onOpenChange={(open) => !open && setEditingMeeting(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Meeting</DialogTitle>
            <DialogDescription>
              Update meeting title, timings, notes, and participants.
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

      {/* Modern Cancel Meeting Confirmation Dialog */}
      <AlertDialog
        open={!!meetingToDelete}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl p-6 border border-border/80 shadow-2xl bg-card">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Cancel Meeting?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {meetingToDelete ? (
                <>
                  Are you sure you want to cancel{' '}
                  <strong className="text-foreground font-semibold">
                    "{meetingToDelete.title}"
                  </strong>
                  {meetingToDelete.start_time && (
                    <>
                      {' '}scheduled for{' '}
                      <span className="text-foreground font-medium">
                        {format(parseISO(meetingToDelete.start_time), 'EEEE, MMMM d · h:mm a')}
                      </span>
                    </>
                  )}
                  ? This will revoke the Google Meet session and remove it from your calendar.
                </>
              ) : (
                'Are you sure you want to cancel this meeting?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={deleteMeeting.isPending}
              className="rounded-xl font-semibold text-xs h-9 border-border/80"
              onClick={() => setMeetingToDelete(null)}
            >
              Keep Meeting
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMeeting.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmCancelMeeting();
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              {deleteMeeting.isPending ? (
                'Cancelling...'
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Yes, Cancel Meeting
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}