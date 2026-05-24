'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useUser } from '@/hooks/use-user';
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
import { Loader2, Plus, Phone, User, MessageSquare, Megaphone, Globe } from 'lucide-react';
import { LEAD_SOURCES, COUNTRIES, PRIORITIES } from '@/lib/constants';
import { COUNTRY_CODES } from '@/lib/country-codes';
import ReactCountryFlag from 'react-country-flag';
import { useRouter } from 'next/navigation';

// Simplified validation schema
const quickLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits'),
  source: z.enum([
    'instagram',
    'facebook',
    'whatsapp',
    'call',
    'referral',
    'website',
    'linkedin',
    'email',
    'meta_ads',
    'other',
  ]),
  requirements: z.string().max(1000).optional(),
  campaign_id: z.string().optional().or(z.literal('')),
  country: z.string(),
  priority: z.enum(['hot', 'warm', 'cold']),
});

type QuickLeadFormValues = z.infer<typeof quickLeadSchema>;

interface QuickAddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newLead: any) => void;
  defaultCampaignId?: string;
}

export function QuickAddLeadModal({
  open,
  onOpenChange,
  onSuccess,
  defaultCampaignId = '',
}: QuickAddLeadModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const { campaigns } = useCampaigns();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuickLeadFormValues>({
    resolver: zodResolver(quickLeadSchema),
    defaultValues: {
      name: '',
      phone: '',
      source: 'whatsapp',
      requirements: '',
      campaign_id: defaultCampaignId,
      country: 'IN',
      priority: 'warm',
    },
  });

  // Sync default values when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        phone: '',
        source: 'whatsapp',
        requirements: '',
        campaign_id: defaultCampaignId,
        country: 'IN',
        priority: 'warm',
      });
    }
  }, [open, defaultCampaignId, form]);

  const onSubmit = async (data: QuickLeadFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        status: 'new',
        assigned_to: user?.id || null, // Auto-assign to current creator for zero-friction
      };

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create lead');
      }

      const result = await response.json();
      toast({
        title: 'Lead Added Instantly! ⚡',
        description: `Lead for "${data.name}" has been registered successfully.`,
      });

      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast({
        title: 'Failed to add lead',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-t-xl sm:rounded-xl p-6 gap-3">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-sm">⚡</span>
            Quick Add Lead
          </DialogTitle>
          <DialogDescription className="text-xs">
            Complete core details in 15 seconds. Rich fields can be progressive-disclosed later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Lead Full Name" className="pl-10 h-10 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => {
                const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
                const found = sortedCodes.find(c => field.value?.startsWith(c.code));
                const currentCode = found?.code || '+91';
                const currentNumber = field.value?.startsWith(currentCode) ? field.value.slice(currentCode.length) : (field.value || '');

                return (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Select
                          value={currentCode}
                          onValueChange={(newCode) => {
                            const val = field.value?.startsWith(currentCode) ? field.value.slice(currentCode.length) : (field.value || '');
                            field.onChange(newCode + val);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[100px] shrink-0 h-10 text-xs px-2.5">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={`${c.iso}-${c.code}`} value={c.code}>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <ReactCountryFlag
                                    countryCode={c.iso}
                                    svg
                                    style={{ width: '1.2em', height: '1.2em' }}
                                  />
                                  <span>{c.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Mobile / Dial code"
                            className="pl-10 h-10 text-sm"
                            value={currentNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              field.onChange(val ? currentCode + val : '');
                            }}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Lead Source *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LEAD_SOURCES).map(([key, { label }]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaign_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Megaphone className="w-3 h-3 text-blue-500" /> Optional Campaign
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Select Campaign" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          No Campaign
                        </SelectItem>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}
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
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {COUNTRIES.map(({ value, label }) => (
                          <SelectItem key={value} value={value} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cold" className="text-xs">❄️ Cold</SelectItem>
                        <SelectItem value="warm" className="text-xs">☀️ Warm</SelectItem>
                        <SelectItem value="hot" className="text-xs">🔥 Hot</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Requirements / Short Note</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Textarea
                        placeholder="Project needs, timelines, WhatsApp note, etc."
                        className="pl-10 h-16 text-sm resize-none pt-2.5"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex sm:flex-row flex-col gap-2 pt-2">
              <Button type="button" variant="outline" className="h-10 text-xs" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="h-10 text-xs" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Register Lead ⚡
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
