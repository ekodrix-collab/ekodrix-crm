'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquareText,
  Phone,
  MessageCircle,
  Video,
  Mail,
  Users,
  MapPin,
  Loader2,
  Calendar,
} from 'lucide-react';
import { saveFollowupAction } from '@/lib/actions/followups';
import { Client, Followup, InteractionType, FollowupOutcome } from '@/types/hub';

interface FollowupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Client[];
  defaultClient?: Client | null;
  defaultProjectId?: string | null;
  followup?: Followup | null;
}

export function FollowupFormModal({
  open,
  onOpenChange,
  clients = [],
  defaultClient,
  defaultProjectId,
  followup,
}: FollowupFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState<string>(
    followup?.client_id || defaultClient?.id || (clients.length > 0 ? clients[0].id : '')
  );
  const [projectId, setProjectId] = useState<string>(
    followup?.project_id || defaultProjectId || ''
  );
  const [interactionType, setInteractionType] = useState<InteractionType>(
    followup?.interaction_type || 'call'
  );
  const [discussionNotes, setDiscussionNotes] = useState(
    followup?.discussion_notes || ''
  );
  const [clientResponse, setClientResponse] = useState(
    followup?.client_response || ''
  );
  const [ourCommitment, setOurCommitment] = useState(
    followup?.our_commitment || ''
  );
  const [outcome, setOutcome] = useState<FollowupOutcome>(
    followup?.outcome || 'interested'
  );
  const [nextFollowupDate, setNextFollowupDate] = useState(
    followup?.next_followup_date || ''
  );
  const [nextFollowupNotes, setNextFollowupNotes] = useState(
    followup?.next_followup_notes || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client');
      return;
    }
    if (!discussionNotes.trim()) {
      setError('Discussion notes (what did you talk about?) is required');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await saveFollowupAction({
      id: followup?.id,
      client_id: clientId,
      project_id: projectId || null,
      interaction_type: interactionType,
      discussion_notes: discussionNotes.trim(),
      client_response: clientResponse.trim() || undefined,
      our_commitment: ourCommitment.trim() || undefined,
      outcome,
      next_followup_date: nextFollowupDate || undefined,
      next_followup_notes: nextFollowupNotes.trim() || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onOpenChange(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquareText className="w-5 h-5 text-primary" />
            {followup ? 'Edit Follow-up & Discussion' : '💬 Log New Follow-up'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CLIENT & INTERACTION TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Client / Enquiry *</Label>
              {defaultClient ? (
                <div className="p-2.5 bg-muted/60 rounded-md text-sm font-medium text-foreground">
                  {defaultClient.name} {defaultClient.company ? `(${defaultClient.company})` : ''}
                </div>
              ) : (
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Interaction Channel *</Label>
              <Select
                value={interactionType}
                onValueChange={(v) => setInteractionType(v as InteractionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Phone Call</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="meeting">👥 In-person Meeting</SelectItem>
                  <SelectItem value="video_call">🎥 Video Call (Google Meet/Zoom)</SelectItem>
                  <SelectItem value="email">✉️ Email</SelectItem>
                  <SelectItem value="visit">🏢 Client Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* WHAT WAS DISCUSSED SECTION */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              ⭐ What was discussed & promised
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="discussionNotes">
                💬 Discussion Notes * (What did you talk about?)
              </Label>
              <Textarea
                id="discussionNotes"
                placeholder="e.g. Discussed the new mobile app requirements. Client wants delivery tracking and payment gateway integration..."
                value={discussionNotes}
                onChange={(e) => setDiscussionNotes(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientResponse">
                🗣️ Client's Response / What client said:
              </Label>
              <Textarea
                id="clientResponse"
                placeholder="e.g. 'Need it delivered before Diwali. Budget is flexible but need clear milestones.'"
                value={clientResponse}
                onChange={(e) => setClientResponse(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ourCommitment">
                🤝 What we committed / promised:
              </Label>
              <Textarea
                id="ourCommitment"
                placeholder="e.g. Will share detailed quote and UI wireframe mockup by Sep 8th 3:00 PM."
                value={ourCommitment}
                onChange={(e) => setOurCommitment(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* OUTCOME & NEXT ACTION */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Outcome & Next Action
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Outcome</Label>
                <Select value={outcome} onValueChange={(v) => setOutcome(v as FollowupOutcome)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">🟢 Interested & Moving Forward</SelectItem>
                    <SelectItem value="confirmed">✅ Confirmed / Deal Closed</SelectItem>
                    <SelectItem value="need_time">🟡 Client Needs Time to Review</SelectItem>
                    <SelectItem value="follow_later">⏰ Follow-up Later</SelectItem>
                    <SelectItem value="not_interested">🔴 Not Interested</SelectItem>
                    <SelectItem value="closed">📁 Closed / Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nextFollowupDate">Next Follow-up Date</Label>
                <Input
                  id="nextFollowupDate"
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nextFollowupNotes">Next Action Goal / Notes</Label>
                <Input
                  id="nextFollowupNotes"
                  placeholder="e.g. Send revised commercial proposal & schedule demo call"
                  value={nextFollowupNotes}
                  onChange={(e) => setNextFollowupNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {followup ? 'Update Follow-up' : 'Save Follow-up Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
