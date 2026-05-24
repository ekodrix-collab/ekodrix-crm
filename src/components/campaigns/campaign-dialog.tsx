'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations';
import { useCampaignMutations } from '@/hooks/use-campaigns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { Campaign } from '@/types';

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  onSuccess?: () => void;
}

export function CampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CampaignDialogProps) {
  const { toast } = useToast();
  const { createCampaign, updateCampaign } = useCampaignMutations();
  const isEdit = !!campaign;

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      type: '',
      source: '',
      status: 'active',
      start_date: '',
      end_date: '',
      notes: '',
    },
  });

  // Sync details when opening for edit
  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name || '',
        type: campaign.type || '',
        source: campaign.source || '',
        status: campaign.status || 'active',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        notes: campaign.notes || '',
      });
    } else {
      form.reset({
        name: '',
        type: '',
        source: '',
        status: 'active',
        start_date: '',
        end_date: '',
        notes: '',
      });
    }
  }, [campaign, open, form]);

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      if (isEdit && campaign) {
        await updateCampaign.mutate({ id: campaign.id, data });
        toast({
          title: 'Campaign Updated',
          description: `Campaign "${data.name}" has been updated successfully.`,
        });
      } else {
        await createCampaign.mutate(data);
        toast({
          title: 'Campaign Created',
          description: `Campaign "${data.name}" has been launched successfully.`,
        });
      }
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error saving campaign',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = createCampaign.loading || updateCampaign.loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modify the details of your existing campaign'
              : 'Add a new marketing campaign to group and track incoming leads'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., May eCommerce Ads" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="e.g. Landing Page" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eCommerce">eCommerce</SelectItem>
                        <SelectItem value="Website redesign">Website redesign</SelectItem>
                        <SelectItem value="Branding">Branding</SelectItem>
                        <SelectItem value="Landing pages">Landing pages</SelectItem>
                        <SelectItem value="Business websites">Business websites</SelectItem>
                        <SelectItem value="Industry specific">Industry specific</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source / Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="e.g. Meta Ads" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="meta_ads">Meta Ads</SelectItem>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="instagram">Instagram Ads</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Ads</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                        <SelectItem value="organic">Organic / Other</SelectItem>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add targets, spend details, or context here..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Launch Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
