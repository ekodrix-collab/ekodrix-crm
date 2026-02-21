'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Button
} from '@/components/ui/button';
import {
    Badge
} from '@/components/ui/badge';
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from '@/components/ui/avatar';
import {
    Separator
} from '@/components/ui/separator';
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    Users as UsersIcon,
    CheckCircle,
    XCircle,
    HelpCircle,
    Clock3,
    Mail,
    ExternalLink,
    Edit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Meeting, RSVPStatus, ParticipantRole } from '@/types';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { RSVP_STATUSES, PARTICIPANT_ROLES } from '@/lib/constants';

interface MeetingDetailDialogProps {
    meeting: Meeting | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (meeting: Meeting) => void;
    onRSVP?: (status: RSVPStatus) => void;
    currentUserId?: string;
}

export function MeetingDetailDialog({
    meeting,
    open,
    onOpenChange,
    onEdit,
    onRSVP,
    currentUserId,
}: MeetingDetailDialogProps) {
    if (!meeting) return null;

    const startTime = parseISO(meeting.start_time);
    const endTime = parseISO(meeting.end_time);

    const currentUserParticipant = meeting.participants?.find(p => p.user_id === currentUserId);
    const isOrganizer = meeting.organizer_id === currentUserId;

    const getRSVPIcon = (status: RSVPStatus) => {
        switch (status) {
            case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'declined': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'tentative': return <HelpCircle className="w-4 h-4 text-blue-500" />;
            default: return <Clock3 className="w-4 h-4 text-yellow-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
                <div
                    className="h-2 w-full"
                    style={{ backgroundColor: meeting.color }}
                />

                <div className="p-6">
                    <DialogHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold">
                                    {meeting.title}
                                </DialogTitle>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Badge variant="secondary" className="font-medium">
                                        {meeting.status}
                                    </Badge>
                                    {meeting.recurrence !== 'none' && (
                                        <Badge variant="outline" className="text-blue-500">
                                            Repeats {meeting.recurrence.replace('_', ' ')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            {isOrganizer && onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(meeting)}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="space-y-6">
                            {/* Time & Location */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
                                        <span className="text-slate-500 text-xs">Date</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                        </span>
                                        <span className="text-slate-500 text-xs">{meeting.timezone}</span>
                                    </div>
                                </div>

                                {meeting.meeting_link && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <a
                                                href={meeting.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-blue-600 hover:underline truncate max-w-[150px]"
                                            >
                                                Google Meet Link
                                            </a>
                                            <Button asChild size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-700 ml-auto">
                                                <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                                    Join
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {meeting.location && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{meeting.location}</span>
                                            <span className="text-slate-500 text-xs">Location</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {meeting.description && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">About the meeting</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                                        {meeting.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4 text-slate-500" />
                                    Participants ({(meeting.participants?.length || 0)})
                                </h4>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {meeting.participants?.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="relative">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={p.user?.avatar_url || undefined} />
                                                <AvatarFallback className={cn(getAvatarColor(p.name || 'P'), 'text-[10px] text-white')}>
                                                    {getInitials(p.name || 'P')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full border border-border">
                                                {getRSVPIcon(p.rsvp_status)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-sm font-medium truncate">{p.name || p.email}</span>
                                                {p.role === 'organizer' && (
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
                                                        HOST
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 truncate">{p.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* RSVP Actions for current user if not organizer */}
                            {currentUserParticipant && !isOrganizer && onRSVP && (
                                <div className="pt-4 border-t space-y-3">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Your RSVP</h4>
                                    <div className="flex gap-2">
                                        <Button
                                            className={cn("flex-1 h-9", currentUserParticipant.rsvp_status === 'accepted' ? "bg-green-600 hover:bg-green-700" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-green-50")}
                                            onClick={() => onRSVP('accepted')}
                                            variant={currentUserParticipant.rsvp_status === 'accepted' ? 'default' : 'outline'}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Accept
                                        </Button>
                                        <Button
                                            className={cn("flex-1 h-9", currentUserParticipant.rsvp_status === 'declined' ? "bg-red-600 hover:bg-red-700" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50")}
                                            onClick={() => onRSVP('declined')}
                                            variant={currentUserParticipant.rsvp_status === 'declined' ? 'default' : 'outline'}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Decline
                                        </Button>
                                    </div>
                                    <Button
                                        className="w-full h-8 text-xs"
                                        variant="ghost"
                                        onClick={() => onRSVP('tentative')}
                                    >
                                        Maybe / Tentative
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 dark:bg-slate-900 p-4 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {meeting.lead_id && (
                        <Button variant="outline" asChild>
                            <a href={`/leads/${meeting.lead_id}`}>
                                View Associated Lead
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        </Button>
                    )}
                    {meeting.meeting_link && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                <Video className="w-4 h-4 mr-2" />
                                Join Google Meet
                            </a>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
