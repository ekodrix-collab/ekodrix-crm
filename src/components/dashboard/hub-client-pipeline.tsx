import { Client } from '@/types/hub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HubClientPipelineProps {
  clients: Client[];
}

export function HubClientPipeline({ clients }: HubClientPipelineProps) {
  const counts = {
    enquiry: clients.filter((c) => c.status === 'enquiry').length,
    discussion: clients.filter((c) => c.status === 'discussion').length,
    confirmed: clients.filter((c) => c.status === 'confirmed').length,
    active: clients.filter((c) => c.status === 'active').length,
    completed: clients.filter((c) => c.status === 'completed').length,
    lost: clients.filter((c) => c.status === 'lost').length,
  };

  const stages = [
    { key: 'enquiry', label: '🆕 Enquiries', count: counts.enquiry, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
    { key: 'discussion', label: '💬 Discussion', count: counts.discussion, color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
    { key: 'confirmed', label: '✅ Confirmed', count: counts.confirmed, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
    { key: 'active', label: '🚀 Active', count: counts.active, color: 'text-purple-600 bg-purple-500/10 border-purple-200' },
    { key: 'completed', label: '🏁 Completed', count: counts.completed, color: 'text-slate-600 bg-slate-500/10 border-slate-200' },
    { key: 'lost', label: '❌ Lost', count: counts.lost, color: 'text-red-600 bg-red-500/10 border-red-200' },
  ];

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Users className="w-4 h-4 text-primary" />
          📊 Client & Enquiry Pipeline
        </CardTitle>
        <span className="text-xs text-muted-foreground font-medium">
          {clients.length} Total Clients
        </span>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {stages.map((st) => (
            <Link
              key={st.key}
              href={`/clients?status=${st.key}`}
              className={`p-3 rounded-xl border ${st.color} flex flex-col items-center justify-center text-center hover:opacity-80 transition-opacity`}
            >
              <span className="text-xs font-semibold mb-1">{st.label}</span>
              <span className="text-xl font-extrabold tracking-tight">{st.count}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
