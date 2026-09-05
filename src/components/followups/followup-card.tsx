'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Followup } from '@/types/hub';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  MessageCircle,
  Video,
  Mail,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Building,
  Check,
} from 'lucide-react';
import { toggleFollowupCompletedAction, rescheduleFollowupAction } from '@/lib/actions/followups';
import { cn } from '@/lib/utils';

interface FollowupCardProps {
  followup: Followup;
  onEdit?: (followup: Followup) => void;
  showClientLink?: boolean;
}

const channelIcons: Record<string, { icon: any; label: string; color: string }> = {
  call: { icon: Phone, label: 'Phone Call', color: 'text-emerald-500 bg-emerald-500/10' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-emerald-600 bg-emerald-500/15' },
  meeting: { icon: Users, label: 'In-person Meeting', color: 'text-blue-500 bg-blue-500/10' },
  video_call: { icon: Video, label: 'Video Call', color: 'text-purple-500 bg-purple-500/10' },
  email: { icon: Mail, label: 'Email', color: 'text-amber-500 bg-amber-500/10' },
  visit: { icon: Users, label: 'Client Visit', color: 'text-indigo-500 bg-indigo-500/10' },
};

const outcomeBadges: Record<string, { label: string; className: string }> = {
  interested: { label: '🟢 Interested', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  confirmed: { label: '✅ Confirmed', className: 'bg-emerald-600/15 text-emerald-700 font-bold border-emerald-300' },
  need_time: { label: '🟡 Needs Time', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  follow_later: { label: '⏰ Follow Later', className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  not_interested: { label: '🔴 Not Interested', className: 'bg-red-500/10 text-red-600 border-red-200' },
  closed: { label: '🏁 Closed', className: 'bg-slate-500/10 text-slate-600 border-slate-200' },
  completed: { label: '✅ Done', className: 'bg-slate-500/10 text-slate-600 border-slate-200' },
};

export function FollowupCard({
  followup,
  onEdit,
  showClientLink = true,
}: FollowupCardProps) {
  const [completed, setCompleted] = useState(followup.is_completed);
  const [loading, setLoading] = useState(false);

  const channel = channelIcons[followup.interaction_type] || channelIcons.call;
  const ChannelIcon = channel.icon;
  const outcome = outcomeBadges[followup.outcome] || outcomeBadges.interested;

  const dateFormatted = new Date(followup.followup_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleToggleCompleted = async () => {
    setLoading(true);
    const nextState = !completed;
    setCompleted(nextState);
    await toggleFollowupCompletedAction(followup.id, nextState);
    setLoading(false);
  };

  const isOverdue =
    followup.next_followup_date &&
    !completed &&
    new Date(followup.next_followup_date) < new Date(new Date().toISOString().split('T')[0]);

  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-4 transition-all duration-200 shadow-sm space-y-3.5',
        completed
          ? 'opacity-70 border-border/40 bg-muted/20'
          : isOverdue
          ? 'border-red-300 dark:border-red-900 bg-red-500/[0.02]'
          : 'border-border/80 hover:border-primary/40'
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', channel.color)}>
            <ChannelIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {channel.label}
              </span>
              <span className="text-[11px] text-muted-foreground">• {dateFormatted}</span>
            </div>
            {followup.done_by_user && (
              <p className="text-[10px] text-muted-foreground">
                Logged by: {followup.done_by_user.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[11px] font-medium px-2 py-0.5', outcome.className)}>
            {outcome.label}
          </Badge>
          {showClientLink && followup.client && (
            <Link
              href={`/clients/${followup.client.id}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
            >
              {followup.client.name}
            </Link>
          )}
        </div>
      </div>

      {/* Discussion Body */}
      <div className="space-y-2 text-xs">
        {/* What was discussed */}
        <div className="p-2.5 bg-muted/40 rounded-lg space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1 text-[11px] text-primary">
            💬 Discussion Summary:
          </p>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {followup.discussion_notes}
          </p>
        </div>

        {/* Client response */}
        {followup.client_response && (
          <div className="p-2.5 bg-accent/30 rounded-lg space-y-0.5 border-l-2 border-amber-500">
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-[11px]">
              🗣️ Client Said:
            </p>
            <p className="text-muted-foreground italic">"{followup.client_response}"</p>
          </div>
        )}

        {/* Our commitment */}
        {followup.our_commitment && (
          <div className="p-2.5 bg-emerald-500/5 rounded-lg space-y-0.5 border-l-2 border-emerald-500">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
              🤝 We Committed / Promised:
            </p>
            <p className="text-muted-foreground">{followup.our_commitment}</p>
          </div>
        )}
      </div>

      {/* Next Followup / Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
        {followup.next_followup_date ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className={cn('w-3.5 h-3.5', isOverdue ? 'text-red-500' : 'text-primary')} />
            <span className={cn('font-medium', isOverdue ? 'text-red-600 font-bold' : 'text-foreground')}>
              Next Action: {followup.next_followup_date}
            </span>
            {followup.next_followup_notes && (
              <span className="text-muted-foreground truncate max-w-[220px]">
                - {followup.next_followup_notes}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">No next follow-up scheduled</span>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            variant={completed ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleToggleCompleted}
            disabled={loading}
            className="h-7 text-xs gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            {completed ? 'Marked Done' : 'Mark Done'}
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(followup)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
