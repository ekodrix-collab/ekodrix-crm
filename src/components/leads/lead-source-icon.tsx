'use client';

import {
  Instagram,
  Facebook,
  MessageCircle,
  Phone,
  Users,
  Globe,
  Linkedin,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEAD_SOURCES } from '@/lib/constants';
import type { LeadSource } from '@/types';

interface LeadSourceIconProps {
  source: LeadSource;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBackground?: boolean;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
  call: Phone,
  referral: Users,
  website: Globe,
  linkedin: Linkedin,
  email: Mail,
  other: MoreHorizontal,
};

export function LeadSourceIcon({
  source,
  size = 'md',
  showLabel = false,
  showBackground = false,
  className,
}: LeadSourceIconProps) {
  const sourceConfig = LEAD_SOURCES[source] || LEAD_SOURCES.other;
  const Icon = iconMap[source] || MoreHorizontal;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const bgSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  if (showBackground) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          sourceConfig.bgColor,
          bgSizeClasses[size],
          className
        )}
      >
        <Icon className={cn(sizeClasses[size], sourceConfig.color)} />
      </div>
    );
  }

  if (showLabel) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <Icon className={cn(sizeClasses[size], sourceConfig.color)} />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {sourceConfig.label}
        </span>
      </div>
    );
  }

  return (
    <Icon
      className={cn(sizeClasses[size], sourceConfig.color, className)}
    />
  );
}

// Compact badge version
export function LeadSourceBadge({
  source,
  className,
}: {
  source: LeadSource;
  className?: string;
}) {
  const sourceConfig = LEAD_SOURCES[source] || LEAD_SOURCES.other;
  const Icon = iconMap[source] || MoreHorizontal;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        sourceConfig.bgColor,
        sourceConfig.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{sourceConfig.label}</span>
    </div>
  );
}