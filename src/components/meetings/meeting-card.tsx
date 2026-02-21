'use client';

import { format, isPast, isToday, differenceInMinutes, parseISO } from 'date-fns';
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
    Users as UsersIcon
} from 'lucide-react';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import {
    Badge
} from '@/components/ui/badge';
import {
    Button
} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { Meeting, RSVPStatus } from '@/types';
import { MEETING_STATUSES, RSVP_STATUSES } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

interface MeetingCardProps {
    meeting: Meeting;
    onEdit?: (meeting: Meeting) => void;
    onDelete?: (id: string) => void;
    onRSVP?: (id: string, status: RSVPStatus) => void;
}

export function MeetingCard({
    meeting,
    onEdit,
    onDelete,
    onRSVP,
}: MeetingCardProps) {
    const { toast } = useToast();
    const startTime = parseISO(meeting.start_time);
    const endTime = parseISO(meeting.end_time);
    const isStarted = isPast(startTime) && !isPast(endTime);
    const isFinished = isPast(endTime);
    const duration = differenceInMinutes(endTime, startTime);

    const copyMeetingLink = () => {
        if (!meeting.meeting_link) return;
        navigator.clipboard.writeText(meeting.meeting_link);
        toast({
            title: 'Link Copied',
            description: 'Google Meet link copied to clipboard.',
        });
    };

    const getRSVPIcon = (status: RSVPStatus) => {
        switch (status) {
            case 'accepted': return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'declined': return <XCircle className="w-3 h-3 text-red-500" />;
            case 'tentative': return <HelpCircle className="w-3 h-3 text-primary" />;
            default: return <Clock className="w-3 h-3 text-yellow-500" />;
        }
    };

    return (
        <Card className={cn(
            "overflow-hidden transition-all hover:shadow-md border-l-4",
            isFinished && "opacity-60",
            isStarted && "ring-2 ring-primary ring-offset-2"
        )} style={{ borderLeftColor: meeting.color }}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Time & Indicator */}
                    <div className="flex flex-col items-center justify-center min-w-[70px] py-1 bg-accent rounded-lg">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                            {format(startTime, 'h:mm')}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                            {format(startTime, 'a')}
                        </span>
                        <div className="w-1 h-6 bg-border my-1 rounded-full overflow-hidden">
                            {isStarted && <div className="w-full h-full bg-primary animate-pulse" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">
                            {duration}m
                        </span>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-semibold text-foreground truncate">
                                    {meeting.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-background text-foreground">
                                        {meeting.status}
                                    </Badge>
                                    {isStarted && (
                                        <Badge className="text-[10px] h-4 px-1 bg-red-500 text-white animate-pulse border-0">
                                            LIVE
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {meeting.meeting_link && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground/60 hover:text-primary"
                                                    onClick={copyMeetingLink}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy Link</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 text-muted-foreground">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {onEdit && (
                                            <DropdownMenuItem onClick={() => onEdit(meeting)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                            <DropdownMenuItem
                                                className="text-red-500"
                                                onClick={() => onDelete(meeting.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Cancel Meeting
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {meeting.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                {meeting.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            {/* Participants */}
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {meeting.participants?.slice(0, 3).map((p) => (
                                        <TooltipProvider key={p.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="relative">
                                                        <Avatar className="w-6 h-6 border-2 border-background">
                                                            <AvatarImage src={p.user?.avatar_url || undefined} />
                                                            <AvatarFallback className={cn(getAvatarColor(p.name || 'P'), 'text-[8px] text-primary-foreground')}>
                                                                {getInitials(p.name || 'P')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                                                            {getRSVPIcon(p.rsvp_status)}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-xs">
                                                        <p className="font-semibold">{p.name || p.email}</p>
                                                        <p className="text-[10px] opacity-70 capitalize">{p.rsvp_status}</p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                    {(meeting.participants?.length || 0) > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                            +{(meeting.participants?.length || 0) - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 font-medium ml-1">
                                    {(meeting.participants?.length || 0)} Guests
                                </span>
                            </div>

                            {/* Location/Link */}
                            <div className="flex items-center gap-3 ml-auto">
                                {meeting.meeting_link ? (
                                    <Button
                                        size="sm"
                                        className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                                        asChild
                                    >
                                        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                            <Video className="w-3.5 h-3.5" />
                                            Join
                                        </a>
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium px-2 py-1 bg-accent rounded-md border border-dashed">
                                        <Video className="w-3 h-3 opacity-50" />
                                        No Link
                                    </div>
                                )}
                                {meeting.location && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                                        <MapPin className="w-3 h-3" />
                                        {meeting.location}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
