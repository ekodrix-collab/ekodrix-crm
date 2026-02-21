'use client';

import { useState, DragEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IndianRupee,
  Calendar,
  User,
  Building,
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatDate,
  getInitials,
  getAvatarColor,
} from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/constants';
import type { Deal } from '@/types';

interface DealCardProps {
  deal: Deal;
  onStageChange?: (dealId: string, newStage: string) => void;
  onDelete?: (dealId: string) => void;
  onDragStart?: (e: DragEvent, dealId: string) => void;
  compact?: boolean;
  draggable?: boolean;
}

export function DealCard({
  deal,
  onStageChange,
  onDelete,
  onDragStart,
  compact = false,
  draggable = false,
}: DealCardProps) {
  const stageConfig = DEAL_STAGES[deal.stage as keyof typeof DEAL_STAGES];
  const isWon = deal.stage === 'won';
  const isLost = deal.stage === 'lost';
  const isClosed = isWon || isLost;

  // Available next stages
  const nextStages = Object.entries(DEAL_STAGES)
    .filter(([key]) => key !== deal.stage && key !== 'lost')
    .slice(0, 3);

  if (compact) {
    return (
      <div
        className={cn(
          'p-3 rounded-xl border bg-card text-card-foreground hover:shadow-md transition-all cursor-pointer select-none',
          isWon && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50',
          isLost && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/50 opacity-60',
          draggable && 'cursor-grab active:cursor-grabbing'
        )}
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, deal.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{deal.title}</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(deal.deal_value)}
            </p>
            {deal.lead && (
              <p className="text-xs text-slate-500 truncate mt-1">
                {deal.lead.name}
                {deal.lead.company_name && ` • ${deal.lead.company_name}`}
              </p>
            )}
          </div>

          <Badge
            variant="outline"
            className={cn(
              'text-[10px] flex-shrink-0',
              `bg-${stageConfig?.color.replace('bg-', '')}/10`
            )}
          >
            {deal.probability}%
          </Badge>
        </div>

        {deal.expected_close_date && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>Close: {formatDate(deal.expected_close_date)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md select-none',
        isWon && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50',
        isLost && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/50 opacity-70',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, deal.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Value Circle */}
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
              isWon
                ? 'bg-green-100 dark:bg-green-900'
                : isLost
                  ? 'bg-red-100 dark:bg-red-900'
                  : 'bg-blue-100 dark:bg-blue-900'
            )}
          >
            <IndianRupee
              className={cn(
                'w-5 h-5',
                isWon
                  ? 'text-green-600 dark:text-green-400'
                  : isLost
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold',
                isWon
                  ? 'text-green-600 dark:text-green-400'
                  : isLost
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
              )}
            >
              {deal.probability}%
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">
                  {deal.title}
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(deal.deal_value)}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isClosed && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onStageChange?.(deal.id, 'won')}
                        className="text-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Won
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStageChange?.(deal.id, 'lost')}
                        className="text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Mark as Lost
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {deal.lead && (
                    <DropdownMenuItem asChild>
                      <Link href={`/leads/${deal.lead.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Lead
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Deal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(deal.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stage Badge */}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn(stageConfig?.color, 'text-white')}>
                {stageConfig?.label}
              </Badge>
              {isWon && <Badge className="bg-green-500 text-white">Won!</Badge>}
              {isLost && <Badge variant="destructive">Lost</Badge>}
            </div>

            {/* Probability Bar */}
            {!isClosed && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Win Probability</span>
                  <span className="font-medium">{deal.probability}%</span>
                </div>
                <Progress value={deal.probability} className="h-1.5" />
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              {deal.lead && (
                <Link
                  href={`/leads/${deal.lead.id}`}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  <User className="w-4 h-4" />
                  <span>{deal.lead.name}</span>
                </Link>
              )}

              {deal.lead?.company_name && (
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {deal.lead.company_name}
                </span>
              )}

              {deal.expected_close_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(deal.expected_close_date)}
                </span>
              )}

              {deal.owner && (
                <span className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={deal.owner.avatar_url || undefined} />
                    <AvatarFallback
                      className={cn(
                        getAvatarColor(deal.owner.name),
                        'text-white text-[6px]'
                      )}
                    >
                      {getInitials(deal.owner.name)}
                    </AvatarFallback>
                  </Avatar>
                  {deal.owner.name.split(' ')[0]}
                </span>
              )}
            </div>

            {/* Quick Stage Change */}
            {!isClosed && nextStages.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Move to:</span>
                {nextStages.map(([key, config]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onStageChange?.(deal.id, key)}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    {config.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}