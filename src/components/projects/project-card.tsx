'use client';

import Link from 'next/link';
import { Project, ProjectVault } from '@/types/hub';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderGit2,
  Globe,
  Calendar,
  IndianRupee,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  Server,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VAULT_TYPES } from '@/lib/vault-config';

interface ProjectCardProps {
  project: Project;
}

const statusBadges: Record<string, { label: string; className: string }> = {
  planning: { label: '📝 Planning', className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  active: { label: '🚀 Active', className: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  on_hold: { label: '⏸️ On Hold', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  completed: { label: '🏁 Completed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  cancelled: { label: '❌ Cancelled', className: 'bg-red-500/10 text-red-600 border-red-200' },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const health = project.health || {
    percentage: 0,
    status: 'risk',
    color: 'red',
    filled: 0,
    total: 0,
    missing: [],
  };

  const statusInfo = statusBadges[project.status] || statusBadges.active;
  const vaults = project.vaults || [];

  const healthBadgeStyle =
    health.status === 'healthy'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
      : health.status === 'warning'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900'
      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900';

  const healthBarColor =
    health.status === 'healthy'
      ? 'bg-emerald-500'
      : health.status === 'warning'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4">
      {/* Header */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/projects/${project.id}`}
              className="text-base font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {project.project_name}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {project.client && (
              <p className="text-xs text-muted-foreground font-medium">
                Client: <span className="text-foreground">{project.client.name}</span>
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', statusInfo.className)}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Health Progress Bar */}
        <div className="space-y-1.5 p-3 bg-muted/40 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              {health.status === 'healthy' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-500" />
              )}
              Vault Health:
            </span>
            <Badge variant="outline" className={cn('text-[11px] font-bold px-1.5 py-0', healthBadgeStyle)}>
              {health.percentage}% ({health.filled}/{health.total} filled)
            </Badge>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', healthBarColor)}
              style={{ width: `${health.percentage}%` }}
            />
          </div>
          {health.missing && health.missing.length > 0 && (
            <p className="text-[10px] text-red-600 dark:text-red-400 truncate pt-0.5">
              ⚠️ Missing: {health.missing.slice(0, 3).join(', ')}
              {health.missing.length > 3 ? ` +${health.missing.length - 3} more` : ''}
            </p>
          )}
        </div>

        {/* Vault Status Tags */}
        {vaults.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {vaults.slice(0, 5).map((v) => {
              const cfg = VAULT_TYPES[v.vault_type] || { label: v.label };
              return (
                <span
                  key={v.id}
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border',
                    v.is_filled
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                      : v.is_required
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                      : 'bg-muted/40 text-muted-foreground border-border/60'
                  )}
                >
                  {v.is_filled ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-2.5 h-2.5 text-red-500" />
                  )}
                  {cfg.label.split(' ')[0]}
                </span>
              );
            })}
            {vaults.length > 5 && (
              <span className="text-[10px] text-muted-foreground self-center px-1 font-medium">
                +{vaults.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Meta Pills: Technical Owner, Expiry, Cost */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          {project.deadline && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span className="truncate">Due: {project.deadline}</span>
            </div>
          )}
          {project.technical_owner && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{project.technical_owner.name}</span>
            </div>
          )}
          {project.quoted_amount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-foreground">
                ₹{project.paid_amount.toLocaleString('en-IN')} / ₹{project.quoted_amount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
          {project.domain_expiry_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">Exp: {project.domain_expiry_date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <Button asChild size="sm" variant="default" className="w-full text-xs font-semibold gap-1.5 shadow-sm">
          <Link href={`/projects/${project.id}`}>
            <Key className="w-3.5 h-3.5" />
            Open Vault & Manage
          </Link>
        </Button>
      </div>
    </div>
  );
}
