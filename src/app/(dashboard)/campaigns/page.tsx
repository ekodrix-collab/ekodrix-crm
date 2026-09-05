'use client';

import { useState } from 'react';
import { useCampaigns, useCampaignMutations } from '@/hooks/use-campaigns';
import { useLeads } from '@/hooks/use-leads';
import { CampaignDialog } from '@/components/campaigns/campaign-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Target,
  Megaphone,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Layers,
  Phone,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { cn, formatDate, formatCurrency, openWhatsApp, openPhoneDialer } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CampaignsPage() {
  const { toast } = useToast();
  const { campaigns, loading, refetch } = useCampaigns();
  const { deleteCampaign } = useCampaignMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch leads for the selected campaign
  const { leads, loading: leadsLoading } = useLeads({
    filters: selectedCampaign ? { campaign_id: selectedCampaign.id } : { campaign_id: 'none' },
    pageSize: 100,
    autoFetch: !!selectedCampaign,
  });

  const handleDelete = (id: string, name: string) => {
    setCampaignToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;
    try {
      await deleteCampaign.mutate(campaignToDelete.id);
      toast({
        title: 'Campaign Deleted',
        description: `Campaign "${campaignToDelete.name}" has been removed.`,
      });
      if (selectedCampaign?.id === campaignToDelete.id) {
        setSelectedCampaign(null);
      }
      setCampaignToDelete(null);
      refetch();
    } catch (err: any) {
      toast({
        title: 'Failed to delete',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground">
            Organize incoming marketing leads by active ads and campaigns
          </p>
        </div>

        <Button onClick={() => { setEditingCampaign(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Launch Campaign
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Campaigns</p>
              <p className="text-xl font-bold">{loading ? '...' : campaigns.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Campaign Leads</p>
              <p className="text-xl font-bold">
                {loading
                  ? '...'
                  : campaigns.reduce((acc, c: any) => acc + (c.leads_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Avg Conversion Rate</p>
              <p className="text-xl font-bold">
                {loading
                  ? '...'
                  : campaigns.length > 0
                  ? Math.round(
                      campaigns.reduce((acc, c: any) => acc + (c.conversion_rate || 0), 0) /
                        campaigns.length
                    )
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pipeline Revenue</p>
              <p className="text-xl font-bold text-green-600">
                {loading
                  ? '...'
                  : formatCurrency(
                      campaigns.reduce((acc, c: any) => acc + (c.total_revenue || 0), 0)
                    )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Campaigns List (Left 1 or 2 cols) */}
        <div className={cn('lg:col-span-2 space-y-4', !selectedCampaign && 'lg:col-span-3')}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Active Campaigns
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-medium text-slate-800 dark:text-slate-200">No campaigns yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Launch your first eCommerce or Landing Page advertisement campaign to group incoming leads.
              </p>
              <Button size="sm" className="mt-4" onClick={() => { setEditingCampaign(null); setDialogOpen(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Launch Campaign
              </Button>
            </div>
          ) : (
            <div className={cn('grid grid-cols-1 gap-4', !selectedCampaign ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
              {campaigns.map((campaign: any) => (
                <Card
                  key={campaign.id}
                  className={cn(
                    'transition-all duration-200 cursor-pointer border hover:border-blue-500 hover:shadow-md relative overflow-hidden group',
                    selectedCampaign?.id === campaign.id
                      ? 'border-blue-600 ring-1 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/5'
                      : 'border-border'
                  )}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold truncate group-hover:text-blue-500 transition-colors">
                            {campaign.name}
                          </span>
                          {campaign.status === 'active' && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          {campaign.type || 'Campaign'} • {campaign.source || 'Meta Ads'}
                        </p>
                      </div>

                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 capitalize', getStatusColor(campaign.status))}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-4">
                    {/* Performance metrics grid */}
                    <div className="grid grid-cols-3 gap-2 bg-accent/40 dark:bg-accent/10 rounded-lg p-2.5 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">Leads</p>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {campaign.leads_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">Conv %</p>
                        <p className="text-sm font-extrabold text-blue-600">
                          {campaign.conversion_rate || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">Value</p>
                        <p className="text-sm font-extrabold text-green-600 truncate">
                          {campaign.total_revenue > 0 ? `₹${Math.round(campaign.total_revenue / 1000)}k` : '₹0'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {campaign.start_date ? formatDate(campaign.start_date) : 'Flexible'}
                      </span>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDelete(campaign.id, campaign.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Selected Campaign Leads View (Right Column 1) */}
        {selectedCampaign && (
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2 truncate">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="truncate">{selectedCampaign.name} Leads</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground h-7"
                onClick={() => setSelectedCampaign(null)}
              >
                Close View
              </Button>
            </div>

            <Card className="shadow-sm border-border overflow-hidden">
              <CardHeader className="p-4 bg-accent/30 dark:bg-accent/10 border-b border-border pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-500" />
                  Campaignwise Performance
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedCampaign.notes || 'No custom notes set for this marketing campaign.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {leadsLoading ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                    <p>No leads currently mapped to this campaign.</p>
                    <Link href={`/leads/new?campaign_id=${selectedCampaign.id}`}>
                      <Button size="sm" variant="outline" className="mt-2 text-xs h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Lead
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                    {leads.map((lead: any) => (
                      <div
                        key={lead.id}
                        className="p-3.5 hover:bg-accent/40 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/leads/${lead.id}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-500 truncate">
                              {lead.name}
                            </Link>
                            {lead.priority === 'hot' && <span>🔥</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {lead.company_name || 'Individual'} • {lead.city || lead.country || 'Global'}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <LeadStatusBadge status={lead.status} size="sm" />
                            {lead.deal_value && (
                              <span className="text-[10px] font-bold text-green-600">
                                {formatCurrency(lead.deal_value)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {lead.phone && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-7 h-7 rounded-full text-slate-600 hover:text-blue-500"
                              onClick={() => openPhoneDialer(lead.phone)}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-7 h-7 rounded-full text-slate-600 hover:text-green-500"
                            onClick={() => openWhatsApp(lead.whatsapp_number || lead.phone || '')}
                            disabled={!lead.whatsapp_number && !lead.phone}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Link href={`/leads/${lead.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 rounded-full text-muted-foreground hover:text-foreground"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog Overlay */}
      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={editingCampaign}
        onSuccess={refetch}
      />

      {/* Modern Delete Campaign Confirmation Dialog */}
      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl p-6 border border-border/80 shadow-2xl bg-card">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Delete Campaign?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-foreground font-semibold">
                "{campaignToDelete?.name}"
              </strong>
              ? Associated leads will be unlinked but not deleted. This action{' '}
              <span className="text-red-500 font-medium">cannot be undone</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel
              className="rounded-xl font-semibold text-xs h-9 border-border/80"
              onClick={() => setCampaignToDelete(null)}
            >
              Keep Campaign
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Yes, Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
