import Link from 'next/link';
import { Client } from '@/types/hub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Phone, MessageCircle, ChevronRight, UserCheck } from 'lucide-react';

interface HubNewEnquiriesProps {
  clients: Client[];
}

export function HubNewEnquiries({ clients }: HubNewEnquiriesProps) {
  // Filter recent enquiries
  const enquiries = clients.filter((c) => c.status === 'enquiry' || c.status === 'discussion');

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          ✨ New Enquiries & Prospects
        </CardTitle>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs font-semibold">
          {enquiries.length} enquiries
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {enquiries.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No pending new enquiries</p>
            <p className="text-xs text-muted-foreground">
              All prospects have been converted to confirmed clients or discussions.
            </p>
          </div>
        ) : (
          enquiries.slice(0, 4).map((client) => (
            <div
              key={client.id}
              className="p-3 rounded-xl border border-border/60 hover:border-emerald-300 dark:hover:border-emerald-900 bg-card hover:bg-emerald-500/[0.02] transition-all duration-200 flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                  >
                    {client.name}
                  </Link>
                  {client.company && (
                    <span className="text-xs text-muted-foreground truncate">
                      • {client.company}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {client.source}
                  </span>
                  {client.requirements && (
                    <span className="truncate max-w-[200px] italic">
                      "{client.requirements}"
                    </span>
                  )}
                </div>
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 flex-shrink-0"
              >
                <Link href={`/clients/${client.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          ))
        )}

        <div className="text-center pt-2">
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Link href="/clients?status=enquiry">
              View all enquiries <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
