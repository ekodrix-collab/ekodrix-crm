'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Phone, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { openWhatsApp, openPhoneDialer, cn } from '@/lib/utils';

interface FollowUpActionButtonsProps {
  leadId: string;
  phone?: string | null;
  whatsapp?: string | null;
}

export function FollowUpActionButtons({ leadId, phone, whatsapp }: FollowUpActionButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleMarkComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCompleting(true);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_follow_up_completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      toast({
        title: 'Task Done! 🎯',
        description: 'Follow-up marked as completed.',
        variant: 'default',
      });
      
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Could not mark complete',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      {phone && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
          onClick={() => openPhoneDialer(phone)}
          title="Call Lead"
        >
          <Phone className="w-3.5 h-3.5" />
        </Button>
      )}

      {(whatsapp || phone) && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg transition-colors"
          onClick={() => openWhatsApp(whatsapp || phone!)}
          title="WhatsApp Message"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </Button>
      )}

      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors",
          isCompleting && "animate-pulse text-emerald-600"
        )}
        onClick={handleMarkComplete}
        disabled={isCompleting}
        title="Mark as Completed"
      >
        <CheckCircle2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
