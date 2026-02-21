'use client';

import { useState, useEffect, DragEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DealCard } from '@/components/deals/deal-card';
import { DealForm } from '@/components/deals/deal-form';
import {
  Plus,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
import { cn, formatCurrency, formatCurrencyCompact } from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/constants';
import type { User, Deal } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useDeals } from '@/components/tasks/use-deals';

type ViewType = 'pipeline' | 'list';

export default function DealsPage() {
  const { toast } = useToast();
  const supabase = createClient();

  const [view, setView] = useState<ViewType>('pipeline');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const {
    deals,
    loading,
    dealsByStage,
    stats,
    refetch,
    updateDealStage,
    deleteDeal,
  } = useDeals();

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role, is_active, daily_target, created_at, updated_at')
        .eq('is_active', true)
        .order('name');
      setUsers(data || []);
    };
    fetchUsers();
  }, [supabase]);

  // Handle stage change
  const handleStageChange = async (dealId: string, newStage: string) => {
    const success = await updateDealStage(dealId, newStage);

    if (success) {
      toast({
        title: 'Deal Updated',
        description: `Deal moved to ${DEAL_STAGES[newStage as keyof typeof DEAL_STAGES]?.label}`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update deal',
        variant: 'destructive',
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      handleStageChange(dealId, targetStage);
    }
  };

  // Handle delete
  const handleDelete = async (dealId: string) => {
    const success = await deleteDeal(dealId);

    if (success) {
      toast({
        title: 'Deal Deleted',
        description: 'The deal has been removed',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
    }
  };

  // Handle deal creation
  const handleDealCreated = (newDeal: Deal) => {
    setShowCreateDialog(false);
    refetch();
    toast({
      title: 'Deal Created',
      description: `${newDeal.title} has been added to the pipeline`,
    });
  };

  // Filter deals by owner
  const filteredDealsByStage = Object.fromEntries(
    Object.entries(dealsByStage).map(([stage, stageDeals]) => [
      stage,
      ownerFilter === 'all'
        ? stageDeals
        : stageDeals.filter((d) => d.owner_id === ownerFilter),
    ])
  );

  // Pipeline stages (excluding won/lost for Kanban view)
  const pipelineStages = ['proposal', 'negotiation', 'contract_sent'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Deals
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track your sales pipeline and revenue
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
              <DialogDescription>
                Add a new deal to your pipeline
              </DialogDescription>
            </DialogHeader>
            <DealForm
              users={users}
              onSuccess={handleDealCreated}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pipeline Value"
          value={formatCurrencyCompact(stats.pendingValue)}
          subtitle={`${stats.pendingDeals} active deals`}
          icon={<Target className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Won This Month"
          value={formatCurrencyCompact(stats.wonValue)}
          subtitle={`${stats.wonDeals} deals won`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Lost"
          value={formatCurrencyCompact(stats.lostValue)}
          subtitle={`${stats.lostDeals} deals lost`}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Win Rate"
          value={`${Math.round(stats.winRate)}%`}
          subtitle={`Avg deal: ${formatCurrencyCompact(stats.avgDealValue)}`}
          icon={<PieChart className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Owners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'pipeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('pipeline')}
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Pipeline
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <Skeleton key={j} className="h-24" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : view === 'pipeline' ? (
        /* Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pipelineStages.map((stage) => {
            const stageConfig = DEAL_STAGES[stage as keyof typeof DEAL_STAGES];
            const stageDeals = filteredDealsByStage[stage] || [];
            const stageValue = stageDeals.reduce((sum, d) => sum + d.deal_value, 0);

            return (
              <Card key={stage}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          stageConfig?.color
                        )}
                      />
                      {stageConfig?.label}
                    </CardTitle>
                    <Badge variant="secondary">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    {formatCurrency(stageValue)}
                  </p>
                </CardHeader>
                <CardContent
                  className="space-y-3 min-h-[200px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  {stageDeals.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                      No deals
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        compact
                        draggable
                        onDragStart={handleDragStart}
                        onStageChange={handleStageChange}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active ({stats.pendingDeals})
            </TabsTrigger>
            <TabsTrigger value="won">
              Won ({stats.wonDeals})
            </TabsTrigger>
            <TabsTrigger value="lost">
              Lost ({stats.lostDeals})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-4">
            {[...filteredDealsByStage.proposal, ...filteredDealsByStage.negotiation, ...filteredDealsByStage.contract_sent].length === 0 ? (
              <EmptyDeals />
            ) : (
              [...filteredDealsByStage.proposal, ...filteredDealsByStage.negotiation, ...filteredDealsByStage.contract_sent].map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onStageChange={handleStageChange}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="won" className="mt-6 space-y-4">
            {filteredDealsByStage.won?.length === 0 ? (
              <EmptyDeals message="No won deals yet" />
            ) : (
              filteredDealsByStage.won?.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onStageChange={handleStageChange}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="lost" className="mt-6 space-y-4">
            {filteredDealsByStage.lost?.length === 0 ? (
              <EmptyDeals message="No lost deals" />
            ) : (
              filteredDealsByStage.lost?.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onStageChange={handleStageChange}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Won/Lost Summary */}
      {view === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Won */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-green-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Won ({dealsByStage.won?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.wonValue)}
              </p>
            </CardContent>
          </Card>

          {/* Lost */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-red-600 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Lost ({dealsByStage.lost?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.lostValue)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              colorClasses[color]
            )}
          >
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-500">{title}</p>
            <p className="text-[10px] text-slate-400">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State
function EmptyDeals({ message = 'No deals found' }: { message?: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <IndianRupee className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">
          {message}
        </p>
        <p className="text-slate-500 mt-1">
          Create a new deal to get started
        </p>
      </CardContent>
    </Card>
  );
}