import { Project } from '@/types/hub';
import { Card, CardContent } from '@/components/ui/card';
import { FolderGit2, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface HubHealthOverviewProps {
  projects: Project[];
}

export function HubHealthOverview({ projects }: HubHealthOverviewProps) {
  const total = projects.length;
  const healthy = projects.filter((p) => p.health?.status === 'healthy').length;
  const atRisk = projects.filter((p) => p.health?.status === 'risk' || p.health?.status === 'warning').length;
  const completed = projects.filter((p) => p.status === 'completed').length;

  const cards = [
    {
      label: 'Total Projects',
      value: total,
      subtext: 'Active agency projects',
      icon: FolderGit2,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      borderColor: 'border-blue-200/60 dark:border-blue-900/60',
    },
    {
      label: 'Healthy Vaults',
      value: healthy,
      subtext: '100% credentials filled',
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      borderColor: 'border-emerald-200/60 dark:border-emerald-900/60',
    },
    {
      label: 'At Risk / Missing',
      value: atRisk,
      subtext: 'Unfilled vault items',
      icon: ShieldAlert,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      borderColor: 'border-red-200/60 dark:border-red-900/60',
    },
    {
      label: 'Completed',
      value: completed,
      subtext: 'Delivered & handed over',
      icon: CheckCircle2,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
      borderColor: 'border-purple-200/60 dark:border-purple-900/60',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          ⭐ Project Health Overview
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card
              key={i}
              className={`border ${c.borderColor} shadow-sm hover:shadow transition-shadow`}
            >
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{c.label}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {c.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    {c.subtext}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
