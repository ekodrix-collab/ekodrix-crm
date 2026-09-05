import Link from 'next/link';
import { Project } from '@/types/hub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Key, ChevronRight, CheckCircle2 } from 'lucide-react';

interface HubRiskProjectsProps {
  projects: Project[];
}

export function HubRiskProjects({ projects }: HubRiskProjectsProps) {
  // Filter projects with health percentage < 100 or missing items
  const riskProjects = projects.filter((p) => {
    if (!p.health) return false;
    return p.health.status !== 'healthy' && p.status !== 'completed' && p.status !== 'cancelled';
  });

  return (
    <Card className="border-red-200/80 dark:border-red-900/60 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
          <ShieldAlert className="w-4 h-4" />
          🚨 Projects at Risk (Missing Vault Info)
        </CardTitle>
        <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 text-xs font-semibold">
          {riskProjects.length} projects
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {riskProjects.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-foreground">All Project Vaults Healthy!</p>
            <p className="text-xs text-muted-foreground">
              Every active project has all required credentials stored securely.
            </p>
          </div>
        ) : (
          riskProjects.slice(0, 5).map((project) => {
            const health = project.health!;
            const isCritical = health.status === 'risk';

            return (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-red-300 dark:hover:border-red-900 bg-card hover:bg-red-500/[0.02] transition-all duration-200 gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                    >
                      {project.project_name}
                    </Link>
                    {project.client && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        ({project.client.name})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-red-600 dark:text-red-400 font-medium truncate">
                    Missing: {health.missing.join(', ')}
                  </p>
                </div>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium border-red-200 dark:border-red-900 hover:bg-red-500/10 text-red-700 dark:text-red-300 flex-shrink-0 gap-1"
                >
                  <Link href={`/projects/${project.id}`}>
                    <Key className="w-3.5 h-3.5" />
                    Open Vault
                  </Link>
                </Button>
              </div>
            );
          })
        )}

        {riskProjects.length > 5 && (
          <div className="text-center pt-2">
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Link href="/projects?status=risk">
                View all {riskProjects.length} at-risk projects <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
