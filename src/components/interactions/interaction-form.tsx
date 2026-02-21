'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { interactionSchema, type InteractionFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import {
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Mail,
  Users,
  Video,
  FileText,
  StickyNote,
  Loader2,
  Calendar,
} from 'lucide-react';
import { INTERACTION_TYPES, INTERACTION_OUTCOMES, LEAD_STATUSES } from '@/lib/constants';
import type { Interaction, LeadStatus, Lead } from '@/types';

interface InteractionFormProps {
  leadId: string;
  currentStatus: LeadStatus;
  onSuccess: (interaction: Interaction) => void;
  onCancel: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  instagram_dm: <Instagram className="w-4 h-4" />,
  facebook_message: <Facebook className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  video_call: <Video className="w-4 h-4" />,
  proposal_sent: <FileText className="w-4 h-4" />,
  note: <StickyNote className="w-4 h-4" />,
};

export function InteractionForm({
  leadId,
  currentStatus,
  onSuccess,
  onCancel,
}: InteractionFormProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema) as Resolver<InteractionFormValues>,
    defaultValues: {
      lead_id: leadId,
      type: 'call',
      direction: 'outbound',
      summary: '',
      outcome: undefined,
      call_duration: undefined,
      new_status: undefined,
      schedule_follow_up: false,
      follow_up_date: '',
    },
  });

  const watchType = form.watch('type');
  const watchScheduleFollowUp = form.watch('schedule_follow_up');

  const onSubmit = async (data: InteractionFormValues) => {
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create interaction
      const interactionData = {
        lead_id: data.lead_id,
        user_id: user.id,
        type: data.type,
        direction: data.direction,
        summary: data.summary,
        outcome: data.outcome,
        call_duration: data.call_duration,
        status_before: currentStatus,
        status_after: data.new_status || currentStatus,
      };

      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert([interactionData])
        .select(
          `
          *,
          user:users!user_id(id, name, avatar_url)
        `
        )
        .single();

      if (interactionError) {
        throw interactionError;
      }

      // Update lead if status changed or follow-up scheduled
      const leadUpdates: Partial<Lead> = {
        last_contacted_at: new Date().toISOString(),
      };

      if (data.new_status && data.new_status !== currentStatus) {
        leadUpdates.status = data.new_status;
      }

      if (data.schedule_follow_up && data.follow_up_date) {
        leadUpdates.next_follow_up_date = data.follow_up_date;
      }

      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadUpdates),
      });

      // Create follow-up task if scheduled
      if (data.schedule_follow_up && data.follow_up_date) {
        await supabase.from('tasks').insert([
          {
            lead_id: leadId,
            assigned_to: user.id,
            created_by: user.id,
            type: 'follow_up_call',
            title: `Follow up: ${data.summary.substring(0, 50)}...`,
            due_date: data.follow_up_date,
            priority: 'medium',
          },
        ]);
      }

      onSuccess(interaction);
    } catch (error) {
      console.error('Error recording interaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record interaction';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Selection */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {Object.entries(INTERACTION_TYPES).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => form.setValue('type', key as Interaction['type'])}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${watchType === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <span className={watchType === key ? 'text-blue-600' : 'text-slate-500'}>
                {typeIcons[key]}
              </span>
              <span className="text-xs font-medium">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Direction */}
        {watchType !== 'note' && (
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound (You contacted them)</SelectItem>
                    <SelectItem value="inbound">Inbound (They contacted you)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        {/* Summary */}
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What was discussed? Any key takeaways?"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Outcome */}
        <FormField
          control={form.control}
          name="outcome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outcome</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(INTERACTION_OUTCOMES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Call Duration (for calls) */}
        {(watchType === 'call' || watchType === 'video_call') && (
          <FormField
            control={form.control}
            name="call_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Call Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 15"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) * 60 || undefined)}
                    value={field.value ? Math.floor(field.value / 60) : ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Status Change */}
        <FormField
          control={form.control}
          name="new_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Lead Status</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Keep current ({LEAD_STATUSES[currentStatus]?.label})</SelectItem>
                  {Object.entries(LEAD_STATUSES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Schedule Follow-up */}
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <FormField
            control={form.control}
            name="schedule_follow_up"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="!mt-0">Schedule Follow-up</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {watchScheduleFollowUp && (
            <FormField
              control={form.control}
              name="follow_up_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="date" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Log Interaction'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}