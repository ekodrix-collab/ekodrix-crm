'use client';

import { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { dealSchema, type DealFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
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
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, IndianRupee, Calendar } from 'lucide-react';
import { DEAL_STAGES } from '@/lib/constants';
import type { Deal, User, Lead } from '@/types';

interface DealFormProps {
  leadId?: string;
  leadName?: string;
  users: User[];
  onSuccess: (deal: Deal) => void;
  onCancel: () => void;
}

export function DealForm({
  leadId,
  leadName,
  users,
  onSuccess,
  onCancel,
}: DealFormProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema) as Resolver<DealFormValues>,
    defaultValues: {
      lead_id: leadId || '',
      title: leadName ? `Deal with ${leadName}` : '',
      description: '',
      deal_value: 0,
      currency: 'INR',
      stage: 'proposal',
      probability: 50,
      expected_close_date: '',
      owner_id: '',
    },
  });

  const watchProbability = form.watch('probability');

  // Fetch leads for selection
  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, name, company_name, source, status, priority, follow_up_count, created_at, updated_at')
        .in('status', ['interested', 'negotiating'])
        .order('name');
      setLeads(data || []);
    };

    if (!leadId) {
      fetchLeads();
    }
  }, [supabase, leadId]);

  const onSubmit = async (data: DealFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deal');
      }

      const { data: deal } = await response.json();
      onSuccess(deal);
    } catch (error) {
      console.error('Error creating deal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create deal';
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
        {/* Lead Selection (if not pre-selected) */}
        {!leadId && (
          <FormField
            control={form.control}
            name="lead_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  defaultValue={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No lead</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                        {lead.company_name && ` - ${lead.company_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Website Development for Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Deal details..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Deal Value */}
        <FormField
          control={form.control}
          name="deal_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Value *</FormLabel>
              <FormControl>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="10000"
                    className="pl-10"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stage */}
        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DEAL_STAGES)
                    .filter(([key]) => !['won', 'lost'].includes(key))
                    .map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Probability */}
        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Win Probability: {watchProbability}%</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 50]}
                  onValueChange={(value) => field.onChange(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </FormControl>
              <FormDescription>
                How likely are you to win this deal?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expected Close Date */}
        <FormField
          control={form.control}
          name="expected_close_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Close Date</FormLabel>
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

        {/* Owner */}
        <FormField
          control={form.control}
          name="owner_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Owner</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign owner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Deal'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}