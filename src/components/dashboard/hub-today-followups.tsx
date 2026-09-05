import Link from 'next/link';
import { Followup } from '@/types/hub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquareText,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface HubTodayFollowupsProps {
  followups: Followup[];
}

export function HubTodayFollowups({ followups }: HubTodayFollowupsProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingToday = followups.filter(
    (f) => !f.is_completed && f.next_followup_date === todayStr
  );
  const overdue = followups.filter(
    (f) => !f.is_completed && f.next_followup_date && f.next_followup_date < todayStr
  );

  const activeList = [...overdue, ...pendingToday];

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <MessageSquareText className="w-4 h-4 text-primary" />
          💬 Today's Follow-ups & Action Items
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {overdue.length > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 text-xs font-semibold">
              {overdue.length} overdue
            </Badge>
          )}
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold">
            {pendingToday.length} today
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {activeList.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-foreground">All Caught Up for Today!</p>
            <p className="text-xs text-muted-foreground">
              No pending client follow-ups due right now.
            </p>
          </div>
        ) : (
          activeList.slice(0, 5).map((f) => {
            const isOverdue = f.next_followup_date && f.next_followup_date < todayStr;
            const channelIcon =
              f.interaction_type === 'whatsapp' ? (
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <Phone className="w-4 h-4 text-primary" />
              );

            return (
              <div
                key={f.id}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isOverdue
                    ? 'border-red-200 dark:border-red-900 bg-red-500/[0.02]'
                    : 'border-border/60 hover:border-primary/40 bg-card'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {channelIcon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {f.client ? (
                          <Link
                            href={`/clients/${f.client.id}`}
                            className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {f.client.name}
                          </Link>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-foreground">Client</span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] text-red-600 font-bold bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 pl-9">
                    {f.next_followup_notes || f.discussion_notes || 'Follow-up discussion'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Link href={`/followups`}>
                      Take Action
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })
        )}

        <div className="text-center pt-2">
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Link href="/followups">
              Open Follow-up Cockpit <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
