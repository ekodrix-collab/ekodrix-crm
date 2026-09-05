'use client';

import { useState } from 'react';
import { format, isPast, differenceInMinutes, parseISO, isToday, isTomorrow } from 'date-fns';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  XCircle,
  HelpCircle,
  Copy,
  Edit,
  Trash2,
  Users as UsersIcon,
  Check,
  Building,
  Radio,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { Meeting, RSVPStatus } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (id: string) => void;
  onRSVP?: (id: string, status: RSVPStatus) => void;
  onView?: (meeting: Meeting) => void;
}

const statusBadges: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  },
  in_progress: {
    label: 'Live Now',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
  },
  rescheduled: {
    label: 'Rescheduled',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  },
};

export function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onRSVP,
  onView,
}: MeetingCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const startTime = parseISO(meeting.start_time);
  const endTime = parseISO(meeting.end_time);
  const isStarted = isPast(startTime) && !isPast(endTime);
  const isFinished = isPast(endTime);
  const duration = differenceInMinutes(endTime, startTime);
  const isMeetingToday = isToday(startTime);
  const isMeetingTomorrow = isTomorrow(startTime);

  const statusInfo = isStarted
    ? statusBadges.in_progress
    : statusBadges[meeting.status] || statusBadges.scheduled;

  const copyMeetingLink = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!meeting.meeting_link) return;
    navigator.clipboard.writeText(meeting.meeting_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link Copied',
      description: 'Meeting URL copied to clipboard.',
    });
  };

  const getRSVPIcon = (status: RSVPStatus) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-3 h-3 text-emerald-500 fill-emerald-500/20" />;
      case 'declined':
        return <XCircle className="w-3 h-3 text-red-500 fill-red-500/20" />;
      case 'tentative':
        return <HelpCircle className="w-3 h-3 text-amber-500 fill-amber-500/20" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <Card
      onClick={() => onView?.(meeting)}
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-md border border-border/80 bg-card rounded-2xl group cursor-pointer relative',
        isStarted && 'ring-2 ring-emerald-500/80 ring-offset-2 border-emerald-400/80 bg-emerald-500/[0.02]',
        isFinished && 'opacity-80 hover:opacity-100 bg-muted/[0.15]'
      )}
    >
      {/* Top indicator strip for color coding */}
      <div
        className="h-1.5 w-full transition-all group-hover:h-2"
        style={{ backgroundColor: meeting.color || (isStarted ? '#10b981' : '#3b82f6') }}
      />

      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Block: Date/Time Badge & Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Calendar Leaf / Date & Time Pill */}
            <div className="flex flex-col items-center justify-center min-w-[84px] p-2.5 bg-gradient-to-b from-muted/80 to-muted/40 dark:from-muted/50 dark:to-muted/20 border border-border/70 rounded-xl flex-shrink-0 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {format(startTime, 'MMM')}
              </span>
              <span className="text-2xl font-black text-foreground leading-none my-1 tracking-tight">
                {format(startTime, 'dd')}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                {format(startTime, 'EEE')}
              </span>
              <div className="w-full h-px bg-border/70 my-1.5" />
              <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                <Clock className="w-3 h-3 text-muted-foreground" />
                {format(startTime, 'h:mm a')}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {duration > 0 ? `${duration}m` : '30m'}
              </span>
            </div>

            {/* Middle: Details & Meta */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {meeting.title}
                </h3>

                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1',
                    statusInfo.className
                  )}
                >
                  {isStarted && <Radio className="w-3 h-3 text-emerald-600 animate-ping" />}
                  {statusInfo.label}
                </Badge>

                {/* Today / Tomorrow Indicator */}
                {isMeetingToday && !isStarted && (
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Today
                  </Badge>
                )}
                {isMeetingTomorrow && (
                  <Badge variant="secondary" className="font-semibold text-[10px] px-2 py-0.5 rounded-full">
                    Tomorrow
                  </Badge>
                )}
              </div>

              {/* Client or Lead Association if available */}
              {meeting.lead && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/90 bg-primary/5 border border-primary/20 px-2.5 py-0.5 rounded-lg w-fit">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>{meeting.lead.company_name || meeting.lead.name}</span>
                </div>
              )}

              {/* Description Preview */}
              {meeting.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {meeting.description}
                </p>
              )}

              {/* Meta: Organizer & Location */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground pt-0.5">
                {meeting.organizer && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5 border border-border">
                      <AvatarImage src={meeting.organizer.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                        {getInitials(meeting.organizer.name || 'H')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      Host: <strong className="text-foreground">{meeting.organizer.name}</strong>
                    </span>
                  </div>
                )}

                {meeting.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {meeting.location}
                  </span>
                ) : meeting.meeting_link ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Video className="w-3.5 h-3.5" />
                    Google Meet
                  </span>
                ) : null}
              </div>

              {/* Participants / Guests */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {meeting.participants?.slice(0, 4).map((p) => (
                      <TooltipProvider key={p.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Avatar className="w-6 h-6 border-2 border-background shadow-xs">
                                <AvatarImage src={p.user?.avatar_url || undefined} />
                                <AvatarFallback
                                  className={cn(
                                    getAvatarColor(p.name || 'P'),
                                    'text-[9px] text-white font-bold'
                                  )}
                                >
                                  {getInitials(p.name || 'P')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                                {getRSVPIcon(p.rsvp_status)}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">{p.name || p.email}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              RSVP: {p.rsvp_status}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {(meeting.participants?.length || 0) > 4 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        +{(meeting.participants?.length || 0) - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium pl-1">
                    {meeting.participants?.length || 0} {meeting.participants?.length === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Direct Actions */}
          <div
            className="flex items-center gap-2 self-end lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50 w-full lg:w-auto justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {meeting.meeting_link && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground border-border/80"
                      onClick={copyMeetingLink}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Meet Link</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {meeting.meeting_link ? (
              <Button
                asChild
                size="sm"
                className={cn(
                  'h-9 px-4 text-xs font-bold gap-1.5 text-white shadow-sm transition-all',
                  isStarted
                    ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse shadow-emerald-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Video className="w-4 h-4" />
                  Join Call
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-semibold gap-1.5 text-muted-foreground"
                onClick={() => onEdit?.(meeting)}
              >
                <Video className="w-3.5 h-3.5" />
                Add Link
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView?.(meeting)} className="text-xs cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(meeting)} className="text-xs cursor-pointer">
                    <Edit className="w-3.5 h-3.5 mr-2" />
                    Edit Meeting
                  </DropdownMenuItem>
                )}
                {meeting.meeting_link && (
                  <DropdownMenuItem onClick={copyMeetingLink} className="text-xs cursor-pointer">
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copy Meet Link
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs text-red-600 dark:text-red-400 cursor-pointer focus:bg-red-500/10"
                      onClick={() => onDelete(meeting.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Cancel Meeting
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
