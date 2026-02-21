'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  cn,
  formatDateTime,
  formatRelativeTime,
  getInitials,
  getAvatarColor,
} from '@/lib/utils';
import { INTERACTION_TYPES, INTERACTION_OUTCOMES, LEAD_STATUSES } from '@/lib/constants';
import type { Interaction } from '@/types';

interface InteractionTimelineProps {
  interactions: Interaction[];
  maxItems?: number;
}

const iconMap: Record<string, React.ReactNode> = {
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

const outcomeIcons: Record<string, React.ReactNode> = {
  positive: <ThumbsUp className="w-3 h-3 text-green-500" />,
  negative: <ThumbsDown className="w-3 h-3 text-red-500" />,
  neutral: <Minus className="w-3 h-3 text-gray-500" />,
  no_answer: <Phone className="w-3 h-3 text-yellow-500" />,
  callback_requested: <Clock className="w-3 h-3 text-blue-500" />,
  follow_up_needed: <Clock className="w-3 h-3 text-orange-500" />,
};

export function InteractionTimeline({
  interactions,
  maxItems,
}: InteractionTimelineProps) {
  const displayInteractions = maxItems
    ? interactions.slice(0, maxItems)
    : interactions;

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">No interactions yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Log your first call, message, or meeting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayInteractions.map((interaction, index) => {
        const typeConfig = INTERACTION_TYPES[interaction.type as keyof typeof INTERACTION_TYPES];
        const outcomeConfig = interaction.outcome
          ? INTERACTION_OUTCOMES[interaction.outcome as keyof typeof INTERACTION_OUTCOMES]
          : null;

        return (
          <div key={interaction.id} className="relative pl-8">
            {/* Timeline line */}
            {index < displayInteractions.length - 1 && (
              <div className="absolute left-[15px] top-10 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
            )}

            {/* Timeline dot */}
            <div
              className={cn(
                'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center',
                typeConfig?.bgColor || 'bg-slate-100 dark:bg-slate-800',
                typeConfig?.color || 'text-slate-500'
              )}
            >
              {iconMap[interaction.type] || <MessageCircle className="w-4 h-4" />}
            </div>

            {/* Content */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {typeConfig?.label || interaction.type}
                  </span>
                  {interaction.direction && (
                    <Badge variant="outline" className="text-[10px]">
                      {interaction.direction === 'inbound' ? '← In' : '→ Out'}
                    </Badge>
                  )}
                  {outcomeConfig && (
                    <span className="flex items-center gap-1 text-xs">
                      {outcomeIcons[interaction.outcome!]}
                      <span className={outcomeConfig.color}>{outcomeConfig.label}</span>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(interaction.created_at)}
                </span>
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {interaction.summary}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                {/* User */}
                {interaction.user && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback
                        className={cn(
                          getAvatarColor(interaction.user.name),
                          'text-white text-[8px]'
                        )}
                      >
                        {getInitials(interaction.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{interaction.user.name}</span>
                  </div>
                )}

                {/* Call duration */}
                {interaction.call_duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(interaction.call_duration / 60)}m{' '}
                    {interaction.call_duration % 60}s
                  </span>
                )}

                {/* Status change */}
                {interaction.status_before &&
                  interaction.status_after &&
                  interaction.status_before !== interaction.status_after && (
                    <span className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] px-1">
                        {LEAD_STATUSES[interaction.status_before as keyof typeof LEAD_STATUSES]?.label}
                      </Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge className="text-[10px] px-1 bg-green-500 text-white">
                        {LEAD_STATUSES[interaction.status_after as keyof typeof LEAD_STATUSES]?.label}
                      </Badge>
                    </span>
                  )}

                {/* Full timestamp */}
                <span className="ml-auto hidden sm:block">
                  {formatDateTime(interaction.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Show more */}
      {maxItems && interactions.length > maxItems && (
        <div className="text-center pt-2">
          <span className="text-sm text-slate-500">
            +{interactions.length - maxItems} more interactions
          </span>
        </div>
      )}
    </div>
  );
}