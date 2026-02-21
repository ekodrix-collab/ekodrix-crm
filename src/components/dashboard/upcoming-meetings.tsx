'use client';

import Link from 'next/link';
import { format, isPast, isToday, parseISO, differenceInMinutes } from 'date-fns';
import {
    Calendar,
    Video,
    ChevronRight,
    Clock,
    Plus,
    Zap,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { useMeetings } from '@/hooks/use-meetings';

export function UpcomingMeetings() {
    const { data: meetings = [], isLoading } = useMeetings({ view: 'upcoming' });

    // Show first 4 upcoming meetings
    const upcoming = meetings.slice(0, 4);

    // If still loading, show skeleton
    if (isLoading) {
        return <UpcomingMeetingsSkeleton />;
    }

    // If no upcoming meetings at all, return null to hide from dashboard
    if (upcoming.length === 0) {
        return null;
    }

    // Count today's meetings for the header badge
    const todayCount = upcoming.filter(m => isToday(parseISO(m.start_time))).length;

    return (
        <Card className="overflow-hidden border-0 shadow-xl bg-card flex flex-col h-full">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base font-bold">Upcoming Meetings</CardTitle>
                    {todayCount > 0 && (
                        <Badge className="bg-emerald-500 text-white border-0 text-[10px] h-5 px-1.5 animate-pulse">
                            {todayCount} Today
                        </Badge>
                    )}
                </div>
                <Link href="/meetings">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:text-primary/80 hover:bg-primary/5">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col">
                <div className="divide-y border-border">
                    {upcoming.map((meeting) => {
                        const start = parseISO(meeting.start_time);
                        const end = parseISO(meeting.end_time);
                        const isNow = isPast(start) && !isPast(end);
                        const isMeetingToday = isToday(start);
                        const startsSoon = !isPast(start) && differenceInMinutes(start, new Date()) <= 15;

                        return (
                            <div
                                key={meeting.id}
                                className={cn(
                                    "p-4 transition-colors group relative",
                                    isMeetingToday
                                        ? "bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                        : "hover:bg-accent",
                                    isNow && "ring-1 ring-inset ring-red-200 dark:ring-red-800"
                                )}
                            >
                                {/* Today indicator stripe */}
                                {isMeetingToday && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                                )}

                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            "flex flex-col items-center justify-center min-w-[50px] py-1 rounded-lg border-l-4",
                                            isMeetingToday
                                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                : "bg-accent"
                                        )}
                                        style={{ borderLeftColor: meeting.color }}
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            {format(start, 'h:mm')}
                                        </span>
                                        <span className="text-[8px] text-muted-foreground font-medium">
                                            {format(start, 'a')}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <h4 className={cn(
                                                "text-sm font-semibold truncate transition-colors",
                                                isMeetingToday
                                                    ? "text-emerald-800 dark:text-emerald-300 group-hover:text-emerald-900"
                                                    : "group-hover:text-primary"
                                            )}>
                                                {meeting.title}
                                            </h4>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {isNow && (
                                                    <Badge className="text-[8px] h-3.5 px-1 bg-red-500 text-white animate-pulse border-0">LIVE</Badge>
                                                )}
                                                {startsSoon && !isNow && (
                                                    <Badge className="text-[8px] h-3.5 px-1 bg-amber-500 text-white border-0">
                                                        <Zap className="w-2 h-2 mr-0.5" />SOON
                                                    </Badge>
                                                )}
                                                {isMeetingToday && !isNow && !startsSoon && (
                                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-emerald-300 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                                                        Today
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex -space-x-1.5">
                                                {meeting.participants?.slice(0, 3).map((p) => (
                                                    <Avatar key={p.id} className="w-5 h-5 border border-white dark:border-slate-900">
                                                        <AvatarImage src={p.user?.avatar_url || undefined} />
                                                        <AvatarFallback className={cn(getAvatarColor(p.name || 'P'), 'text-[6px] text-white')}>
                                                            {getInitials(p.name || 'P')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {isMeetingToday ? format(start, 'h:mm a') : format(start, 'MMM d')}
                                            </span>
                                        </div>
                                    </div>

                                    {meeting.meeting_link && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn(
                                                "h-8 w-8",
                                                isMeetingToday
                                                    ? "text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                                    : "text-primary hover:bg-primary/10"
                                            )}
                                            asChild
                                        >
                                            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                                <Video className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export function UpcomingMeetingsSkeleton() {
    return (
        <Card className="h-full border-0 shadow-lg bg-card text-card-foreground">
            <CardHeader className="p-4 border-b">
                <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
