import Link from 'next/link';
import { Client } from '@/types/hub';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  MessageCircle,
  Mail,
  Building,
  Calendar,
  ExternalLink,
  ChevronRight,
  FolderGit2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCardProps {
  client: Client;
  onOpenFollowup?: (client: Client) => void;
  onOpenNewProject?: (client: Client) => void;
}

const statusBadges: Record<
  string,
  { label: string; className: string; icon?: any }
> = {
  enquiry: {
    label: '🆕 Enquiry',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  },
  discussion: {
    label: '💬 In Discussion',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  },
  confirmed: {
    label: '✅ Confirmed',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  },
  active: {
    label: '🚀 Active Client',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  },
  completed: {
    label: '🏁 Completed',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  },
  lost: {
    label: '❌ Lost',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
  },
};

export function ClientCard({
  client,
  onOpenFollowup,
  onOpenNewProject,
}: ClientCardProps) {
  const statusInfo = statusBadges[client.status] || statusBadges.enquiry;
  const promisedItems = client.promised_items || [];

  return (
    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <Link
              href={`/clients/${client.id}`}
              className="text-base font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {client.name}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {client.company && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Building className="w-3.5 h-3.5" />
                {client.company}
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn('text-xs font-semibold px-2.5 py-0.5', statusInfo.className)}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Requirements Snippet */}
        {client.requirements && (
          <div className="p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground line-clamp-2 italic">
            "{client.requirements}"
          </div>
        )}

        {/* Promised Items Summary */}
        {promisedItems.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Promised Deliverables ({promisedItems.length})
            </span>
            <div className="space-y-1">
              {promisedItems.slice(0, 2).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1 px-2 bg-accent/40 rounded-md"
                >
                  <span className="font-medium truncate max-w-[180px]">{item.item}</span>
                  {item.deadline && (
                    <span className="text-[10px] text-muted-foreground">Due: {item.deadline}</span>
                  )}
                </div>
              ))}
              {promisedItems.length > 2 && (
                <p className="text-[10px] text-primary font-medium pl-1">
                  +{promisedItems.length - 2} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact Info Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2 py-1 rounded-md transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              {client.phone}
            </a>
          )}
          {client.whatsapp && (
            <a
              href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2 py-1 rounded-md transition-colors truncate max-w-[200px]"
            >
              <Mail className="w-3 h-3 text-blue-500" />
              {client.email}
            </a>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          {onOpenFollowup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenFollowup(client)}
              className="h-8 text-xs gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              Follow-up
            </Button>
          )}
          {onOpenNewProject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenNewProject(client)}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              + Project
            </Button>
          )}
        </div>

        <Button asChild size="sm" variant="default" className="h-8 text-xs">
          <Link href={`/clients/${client.id}`}>
            View Client
          </Link>
        </Button>
      </div>
    </div>
  );
}
