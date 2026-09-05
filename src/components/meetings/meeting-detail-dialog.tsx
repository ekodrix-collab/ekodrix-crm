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
    Calendar,
    Clock,
    Video,
    MapPin,
    Users as UsersIcon,
    CheckCircle,
    XCircle,
    HelpCircle,
    Clock3,
    Copy,
    Check,
    Building,
    ExternalLink,
    Edit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Meeting, RSVPStatus } from '@/types';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

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
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    if (!meeting) return null;

    const startTime = parseISO(meeting.start_time);
    const endTime = parseISO(meeting.end_time);

    const currentUserParticipant = meeting.participants?.find(p => p.user_id === currentUserId);
    const isOrganizer = meeting.organizer_id === currentUserId;

    const copyMeetingLink = () => {
        if (!meeting.meeting_link) return;
        navigator.clipboard.writeText(meeting.meeting_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: 'Meeting Link Copied',
            description: 'Link copied to clipboard.',
        });
    };

    const getRSVPIcon = (status: RSVPStatus) => {
        switch (status) {
            case 'accepted': return <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />;
            case 'declined': return <XCircle className="w-4 h-4 text-red-500 fill-red-500/20" />;
            case 'tentative': return <HelpCircle className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
            default: return <Clock3 className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden gap-0 rounded-2xl">
                <div
                    className="h-2 w-full"
                    style={{ backgroundColor: meeting.color || '#10b981' }}
                />

                <div className="p-6">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    {meeting.title}
                                </DialogTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-bold text-xs uppercase tracking-wider bg-muted/60">
                                        {meeting.status}
                                    </Badge>
                                    {meeting.recurrence !== 'none' && (
                                        <Badge variant="secondary" className="text-xs font-semibold text-primary">
                                            Repeats {meeting.recurrence.replace('_', ' ')}
                                        </Badge>
                                    )}
                                    {meeting.lead && (
                                        <Badge variant="outline" className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                            <Building className="w-3 h-3" />
                                            {meeting.lead.company_name || meeting.lead.name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            {isOrganizer && onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-semibold h-8 gap-1.5 border-border/80"
                                    onClick={() => onEdit(meeting)}
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                            {/* Time & Location */}
                            <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border/70">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs text-foreground">{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
                                        <span className="text-muted-foreground text-[10px]">Date</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs text-foreground">
                                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                        </span>
                                        <span className="text-muted-foreground text-[10px]">{meeting.timezone}</span>
                                    </div>
                                </div>

                                {meeting.meeting_link && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center justify-between flex-1 gap-1 min-w-0">
                                            <span className="font-bold text-xs text-emerald-600 truncate">
                                                Google Meet
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                                                onClick={copyMeetingLink}
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copied ? 'Copied' : 'Copy'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {meeting.location && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs text-foreground">{meeting.location}</span>
                                            <span className="text-muted-foreground text-[10px]">Location</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {meeting.description && (
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agenda / Notes</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-xl border border-border/70">
                                        {meeting.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <UsersIcon className="w-3.5 h-3.5" />
                                    Participants ({meeting.participants?.length || 0})
                                </h4>
                            </div>

                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                {meeting.participants?.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="relative">
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage src={p.user?.avatar_url || undefined} />
                                                <AvatarFallback className={cn(getAvatarColor(p.name || 'P'), 'text-[9px] text-white font-bold')}>
                                                    {getInitials(p.name || 'P')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full border border-border">
                                                {getRSVPIcon(p.rsvp_status)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-xs font-bold text-foreground truncate">{p.name || p.email}</span>
                                                {p.role === 'organizer' && (
                                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-full font-extrabold">
                                                        HOST
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground truncate">{p.email}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* RSVP Actions for current user if not organizer */}
                            {currentUserParticipant && !isOrganizer && onRSVP && (
                                <div className="pt-3 border-t border-border/70 space-y-2">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Your RSVP</h4>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "flex-1 h-8 text-xs font-bold",
                                                currentUserParticipant.rsvp_status === 'accepted'
                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    : "bg-muted text-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                                            )}
                                            onClick={() => onRSVP('accepted')}
                                            variant={currentUserParticipant.rsvp_status === 'accepted' ? 'default' : 'outline'}
                                        >
                                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "flex-1 h-8 text-xs font-bold",
                                                currentUserParticipant.rsvp_status === 'declined'
                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                    : "bg-muted text-foreground hover:bg-red-500/10 hover:text-red-600"
                                            )}
                                            onClick={() => onRSVP('declined')}
                                            variant={currentUserParticipant.rsvp_status === 'declined' ? 'default' : 'outline'}
                                        >
                                            <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/40 p-3.5 border-t border-border/70 flex sm:justify-between items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <div className="flex items-center gap-2">
                        {meeting.meeting_link && (
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 gap-1.5 shadow-sm" asChild>
                                <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                    <Video className="w-4 h-4" />
                                    Join Google Meet
                                </a>
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
