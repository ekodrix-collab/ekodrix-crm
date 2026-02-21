'use client';

import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { LeadStatusBadge } from './lead-status-badge';
import type { Lead } from '@/types';

interface DuplicateAlertProps {
  existingLead: Partial<Lead> & { assigned_user?: { name: string } | null };
  matchedField: string;
  message: string;
  onDismiss?: () => void;
  onViewLead?: () => void;
}

export function DuplicateAlert({
  existingLead,
  matchedField,
  message,
  onDismiss,
  onViewLead,
}: DuplicateAlertProps) {
  return (
    <Alert variant="destructive" className="relative bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <AlertTriangle className="h-5 w-5 text-red-600" />

      <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
        Duplicate Lead Found!
      </AlertTitle>

      <AlertDescription className="mt-2">
        <p className="text-red-700 dark:text-red-300 mb-3">{message}</p>

        {/* Existing Lead Info */}
        <div className="bg-card text-card-foreground rounded-lg p-3 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {existingLead.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {existingLead.status && (
                  <LeadStatusBadge status={existingLead.status} size="sm" />
                )}
                {existingLead.company_name && (
                  <span className="text-xs text-slate-500">
                    {existingLead.company_name}
                  </span>
                )}
              </div>
              {existingLead.assigned_user && (
                <p className="text-xs text-slate-500 mt-1">
                  Assigned to: {existingLead.assigned_user.name}
                </p>
              )}
            </div>

            <Link href={`/leads/${existingLead.id}`} onClick={onViewLead}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Lead
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          The {matchedField} you entered already exists in the system.
        </p>
      </AlertDescription>
    </Alert>
  );
}