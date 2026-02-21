'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Phone,
  MessageCircle,
  Mail,
  Video,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { openPhoneDialer, openWhatsApp, openEmailClient } from '@/lib/utils';
import type { Lead, Interaction } from '@/types';

interface QuickActionsProps {
  lead: Lead;
  onInteractionLogged?: (interaction: Interaction) => void;
}

type QuickActionType = 'call' | 'whatsapp' | 'email';

export function QuickActions({ lead, onInteractionLogged }: QuickActionsProps) {
  const { toast } = useToast();
  const supabase = createClient();

  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogType, setQuickLogType] = useState<QuickActionType>('call');
  const [quickNote, setQuickNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  // Handle quick action click
  const handleQuickAction = (type: QuickActionType) => {
    // Open the communication channel
    switch (type) {
      case 'call':
        if (lead.phone) openPhoneDialer(lead.phone);
        break;
      case 'whatsapp':
        if (lead.whatsapp_number || lead.phone) {
          openWhatsApp(lead.whatsapp_number || lead.phone!);
        }
        break;
      case 'email':
        if (lead.email) {
          openEmailClient(
            lead.email,
            `Following up - ${lead.company_name || lead.name}`
          );
        }
        break;
    }

    // Show quick log dialog
    setQuickLogType(type);
    setQuickNote('');
    setShowQuickLog(true);
  };

  // Log quick interaction
  const handleQuickLog = async () => {
    if (!quickNote.trim()) {
      toast({
        title: 'Note Required',
        description: 'Please add a quick note about the interaction',
        variant: 'destructive',
      });
      return;
    }

    setIsLogging(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const interactionType = quickLogType === 'call' ? 'call' : quickLogType === 'whatsapp' ? 'whatsapp' : 'email';

      const { data: interaction, error } = await supabase
        .from('interactions')
        .insert([
          {
            lead_id: lead.id,
            user_id: user.id,
            type: interactionType,
            direction: 'outbound',
            summary: quickNote,
            outcome: 'neutral',
            status_before: lead.status,
            status_after: lead.status,
          },
        ])
        .select(
          `
          *,
          user:users!user_id(id, name, avatar_url)
        `
        )
        .single();

      if (error) throw error;

      // Update lead's last_contacted_at
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_contacted_at: new Date().toISOString(),
        }),
      });

      toast({
        title: 'Interaction Logged',
        description: 'Quick note has been saved',
      });

      setShowQuickLog(false);
      setQuickNote('');

      if (onInteractionLogged && interaction) {
        onInteractionLogged(interaction);
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to log interaction',
        variant: 'destructive',
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Skip logging
  const handleSkipLog = () => {
    setShowQuickLog(false);
    setQuickNote('');
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            {/* Call Button */}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px] h-14 flex-col gap-1"
              onClick={() => handleQuickAction('call')}
              disabled={!lead.phone}
            >
              <Phone className="w-5 h-5 text-primary" />
              <span className="text-xs">Call</span>
            </Button>

            {/* WhatsApp Button */}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px] h-14 flex-col gap-1"
              onClick={() => handleQuickAction('whatsapp')}
              disabled={!lead.whatsapp_number && !lead.phone}
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            {/* Email Button */}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px] h-14 flex-col gap-1"
              onClick={() => handleQuickAction('email')}
              disabled={!lead.email}
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs">Email</span>
            </Button>

            {/* Video Call Button (placeholder) */}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px] h-14 flex-col gap-1"
              disabled
            >
              <Video className="w-5 h-5 text-muted-foreground/50" />
              <span className="text-xs">Video Call</span>
            </Button>

            {/* Send Proposal Button (placeholder) */}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px] h-14 flex-col gap-1"
              disabled
            >
              <FileText className="w-5 h-5 text-muted-foreground/50" />
              <span className="text-xs">Proposal</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Log Dialog */}
      <Dialog open={showQuickLog} onOpenChange={setShowQuickLog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {quickLogType === 'call' && <Phone className="w-5 h-5 text-primary" />}
              {quickLogType === 'whatsapp' && <MessageCircle className="w-5 h-5 text-emerald-500" />}
              {quickLogType === 'email' && <Mail className="w-5 h-5 text-muted-foreground" />}
              Log {quickLogType === 'call' ? 'Call' : quickLogType === 'whatsapp' ? 'WhatsApp' : 'Email'}
            </DialogTitle>
            <DialogDescription>
              Add a quick note about your {quickLogType} with {lead.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="What was discussed? Any outcome?"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              rows={4}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleSkipLog}>
                Skip
              </Button>
              <Button onClick={handleQuickLog} disabled={isLogging}>
                {isLogging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Log It
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}