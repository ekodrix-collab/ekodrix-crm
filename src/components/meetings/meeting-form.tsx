'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, Loader2, Video, Zap } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Meeting, User } from '@/types';
import {
    MEETING_COLORS,
    RECURRENCE_OPTIONS,
    MEETING_DURATIONS,
} from '@/lib/constants';
import { ParticipantSelector } from './participant-selector';
import { useCreateMeeting, useUpdateMeeting } from '@/hooks/use-meetings';
import { useToast } from '@/components/ui/use-toast';

const meetingSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    start_date: z.string().min(1, 'Date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    duration: z.string(),
    timezone: z.string(),
    generate_meet_link: z.boolean(),
    location: z.string().optional(),
    color: z.string(),
    recurrence: z.enum(['none', 'daily', 'weekly', 'bi_weekly', 'monthly']),
    lead_id: z.string().optional(),
    participants: z.array(z.any()),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
    users: User[];
    meeting?: Meeting;
    leadId?: string;
    isGoogleConnected?: boolean;
    onSuccess?: (meeting: Meeting) => void;
    onCancel?: () => void;
}

export function MeetingForm({
    users,
    meeting,
    leadId,
    isGoogleConnected,
    onSuccess,
    onCancel,
}: MeetingFormProps) {
    const { toast } = useToast();
    const createMeeting = useCreateMeeting();
    const updateMeeting = useUpdateMeeting(meeting?.id || '');

    const form = useForm<MeetingFormValues>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            title: meeting?.title || '',
            description: meeting?.description || '',
            start_date: meeting?.start_time ? format(new Date(meeting.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            start_time: meeting?.start_time
                ? format(new Date(meeting.start_time), 'HH:mm')
                : (() => {
                    const now = new Date();
                    const minutes = now.getMinutes();
                    const roundedMinutes = Math.ceil(minutes / 30) * 30;
                    now.setMinutes(roundedMinutes, 0, 0);
                    return format(now, 'HH:mm');
                })(),
            end_time: meeting?.end_time
                ? format(new Date(meeting.end_time), 'HH:mm')
                : (() => {
                    const now = new Date();
                    const minutes = now.getMinutes();
                    const roundedMinutes = (Math.ceil(minutes / 30) * 30) + 30;
                    now.setMinutes(roundedMinutes, 0, 0);
                    return format(now, 'HH:mm');
                })(),
            duration: meeting?.start_time && meeting?.end_time
                ? String(differenceInMinutes(new Date(meeting.end_time), new Date(meeting.start_time)))
                : '30',
            timezone: meeting?.timezone || 'Asia/Kolkata',
            generate_meet_link: meeting ? !!meeting.meeting_link : true,
            location: meeting?.location || '',
            color: meeting?.color || '#3b82f6',
            recurrence: meeting?.recurrence || 'none',
            lead_id: meeting?.lead_id || leadId || '',
            participants: meeting?.participants
                ? meeting.participants
                    .filter(p => p.role !== 'organizer')
                    .map(p => ({
                        user_id: p.user_id,
                        email: p.email,
                        name: p.name,
                        role: p.role || 'required',
                    }))
                : [],
        },
    });

    const isLoading = createMeeting.isPending || updateMeeting.isPending;

    const onSubmit = async (data: MeetingFormValues) => {
        try {
            if (meeting) {
                updateMeeting.mutate(data, {
                    onSuccess: (res) => {
                        toast({ title: 'Success', description: 'Meeting updated successfully.' });
                        onSuccess?.(res.data);
                    },
                });
            } else {
                createMeeting.mutate(data as any, {
                    onSuccess: (res) => {
                        toast({ title: 'Success', description: 'Meeting scheduled successfully.' });
                        onSuccess?.(res.data);
                    },
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to save meeting.',
                variant: 'destructive',
            });
        }
    };

    const handleDurationChange = (durationMins: string) => {
        const mins = parseInt(durationMins);
        const startTime = form.getValues('start_time');
        if (!startTime) return;

        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + mins);

        form.setValue('end_time', format(date, 'HH:mm'));
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Project Discovery Call" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Discuss project requirements and timeline..."
                                            className="resize-none h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date: Date | undefined) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                    disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                handleDurationChange(val);
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MEETING_DURATIONS.map((d) => (
                                                    <SelectItem key={d.value} value={d.value.toString()}>
                                                        {d.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Time</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="time"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        // Automatically update end time based on current duration
                                                        const duration = form.getValues('duration');
                                                        if (duration) handleDurationChange(duration);
                                                    }}
                                                />
                                                <Clock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Time</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="time" {...field} />
                                                <Clock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="participants"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Participants</FormLabel>
                                    <FormControl>
                                        <ParticipantSelector
                                            users={users}
                                            selectedParticipants={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Add team members or external guests via email.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                            <FormField
                                control={form.control}
                                name="generate_meet_link"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col space-y-3 rounded-xl border border-border p-3 shadow-sm bg-card text-card-foreground">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-blue-500" />
                                                    <FormLabel>Google Meet Link</FormLabel>
                                                </div>
                                                <FormDescription className="text-[10px]">
                                                    Automatically generate a Meet link for this session.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </div>
                                        {field.value && !isGoogleConnected && (
                                            <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                                                <Zap className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span>
                                                    Google Calendar not connected. Link will NOT be generated.
                                                    Please connect in the meetings header first.
                                                </span>
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="recurrence"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Repeat</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Recurrence" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {RECURRENCE_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Event Color</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: field.value }} />
                                                            <SelectValue placeholder="Color" />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {MEETING_COLORS.map((c) => (
                                                        <SelectItem key={c.value} value={c.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                                                                {c.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {meeting ? 'Update Meeting' : 'Schedule Meeting'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
