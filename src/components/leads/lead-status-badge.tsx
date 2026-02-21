'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LEAD_STATUSES } from '@/lib/constants';
import type { LeadStatus } from '@/types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function LeadStatusBadge({
  status,
  size = 'md',
  showDot = false,
  className,
}: LeadStatusBadgeProps) {
  const statusConfig = LEAD_STATUSES[status] || LEAD_STATUSES.new;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      className={cn(
        'font-medium border-0 transition-colors',
        statusConfig.bgLight,      // Dynamic light background
        statusConfig.textColor,    // Dynamic text color matching the status
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusConfig.color)} />
      )}
      {statusConfig.label}
    </Badge>
  );
}

// Variant with background color only (outline style)
export function LeadStatusBadgeOutline({
  status,
  size = 'md',
  className,
}: LeadStatusBadgeProps) {
  const statusConfig = LEAD_STATUSES[status] || LEAD_STATUSES.new;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        statusConfig.textColor,
        statusConfig.bgLight,
        'border-current/20',
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          statusConfig.color
        )}
      />
      {statusConfig.label}
    </Badge>
  );
}