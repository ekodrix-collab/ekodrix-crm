'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-foreground mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground max-w-sm mx-auto mb-4">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick}>
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}