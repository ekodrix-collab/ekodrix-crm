'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectVault, ProjectChecklistItem } from '@/types/hub';
import { getProjectByIdAction, toggleChecklistItemAction } from '@/lib/actions/projects';
import { VaultItemCard } from '@/components/vault/vault-item-card';
import { VaultEditModal } from '@/components/vault/vault-edit-modal';
import { ProjectFormModal } from '@/components/projects/project-form-modal';
import { PaymentFormModal } from '@/components/projects/payment-form-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Key,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  IndianRupee,
  User,
  Globe,
  Server,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  CreditCard,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [openEditProjectModal, setOpenEditProjectModal] = useState(false);
  const [openVaultModal, setOpenVaultModal] = useState(false);
  const [selectedVaultToEdit, setSelectedVaultToEdit] = useState<ProjectVault | null>(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const fetchProject = async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await getProjectByIdAction(projectId);
    if (res.project) {
      setProject(res.project);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Opening Project Vault...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-base font-semibold text-foreground">Project not found</p>
        <Button asChild variant="outline">
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  const health = project.health || {
    percentage: 0,
    status: 'risk',
    color: 'red',
    filled: 0,
    total: 0,
    missing: [],
  };

  const vaults = project.vaults || [];
  const payments = project.payments || [];
  const checklist = project.checklist || [];

  const pendingAmount = Math.max(0, (project.final_amount || project.quoted_amount) - (project.paid_amount || 0));

  const handleToggleChecklist = async (item: ProjectChecklistItem) => {
    const nextVal = !item.is_completed;
    // Optimistic update
    setProject({
      ...project,
      checklist: checklist.map((c) =>
        c.id === item.id ? { ...c, is_completed: nextVal } : c
      ),
    });
    await toggleChecklistItemAction(item.id, project.id, nextVal);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/projects">
                <ArrowLeft className="w-4 h-4 mr-1" /> Projects
              </Link>
            </Button>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {project.project_name}
            </h1>
            <Badge variant="outline" className="capitalize text-xs font-semibold px-2 py-0.5">
              {project.status}
            </Badge>
          </div>

          {project.client && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pl-8 font-medium">
              Client:{' '}
              <Link
                href={`/clients/${project.client.id}`}
                className="text-primary font-semibold hover:underline"
              >
                {project.client.name} {project.client.company ? `(${project.client.company})` : ''}
              </Link>
              {project.technical_owner && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>Lead Dev: <strong className="text-foreground">{project.technical_owner.name}</strong></span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedVaultToEdit(null);
              setOpenVaultModal(true);
            }}
            size="sm"
            className="h-8 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
            + Add Vault Item
          </Button>

          <Button
            onClick={() => setOpenEditProjectModal(true)}
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Health & Key Metadata Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-sm text-xs">
        {/* Health Score */}
        <div className="space-y-1">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            {health.status === 'healthy' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-500" />
            )}
            Vault Health Score:
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-lg font-extrabold',
                health.status === 'healthy'
                  ? 'text-emerald-600'
                  : health.status === 'warning'
                  ? 'text-amber-500'
                  : 'text-red-500'
              )}
            >
              {health.percentage}%
            </span>
            <span className="text-muted-foreground">
              ({health.filled}/{health.total} credentials filled)
            </span>
          </div>
        </div>

        {/* Target Deadline */}
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Target Deadline:</span>
          <p className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {project.deadline || 'Not specified'}
          </p>
        </div>

        {/* Domain Expiry */}
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Domain Expiry:</span>
          <p className="font-semibold text-foreground flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            {project.domain_expiry_date || 'No expiry recorded'}
          </p>
        </div>

        {/* Financial Summary */}
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Payment Status:</span>
          <p className="font-semibold text-foreground flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            ₹{project.paid_amount.toLocaleString('en-IN')} / ₹{(project.final_amount || project.quoted_amount).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="vault" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border">
          <TabsTrigger value="vault" className="text-xs sm:text-sm font-semibold gap-1.5">
            <Key className="w-4 h-4" /> 🔐 Project Vault ({vaults.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm font-semibold gap-1.5">
            <FileText className="w-4 h-4" /> Technical Scope
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm font-semibold gap-1.5">
            <CreditCard className="w-4 h-4" /> Payments & AMC
          </TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs sm:text-sm font-semibold gap-1.5">
            <ListChecks className="w-4 h-4" /> Handover Checklist ({checklist.filter(c => c.is_completed).length}/{checklist.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. VAULT TAB (Primary Focus) */}
        <TabsContent value="vault" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                All Stored Credentials & Access Keys
              </h3>
              <p className="text-xs text-muted-foreground">
                Passwords are kept masked. Click [Show] to reveal or [Copy] to copy to clipboard.
              </p>
            </div>

            <Button
              onClick={() => {
                setSelectedVaultToEdit(null);
                setOpenVaultModal(true);
              }}
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Vault Entry
            </Button>
          </div>

          {vaults.length === 0 ? (
            <div className="py-12 text-center bg-card border rounded-xl space-y-3">
              <Key className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No credentials added to this vault</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Add Website Admin, Business Email, Domain registrar, GitHub, Vercel or DB credentials.
              </p>
              <Button
                onClick={() => {
                  setSelectedVaultToEdit(null);
                  setOpenVaultModal(true);
                }}
                size="sm"
                className="text-xs"
              >
                + Add First Credential
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaults.map((vault) => (
                <VaultItemCard
                  key={vault.id}
                  vault={vault}
                  onEdit={(v) => {
                    setSelectedVaultToEdit(v);
                    setOpenVaultModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 2. DETAILS & SCOPE TAB */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-card border rounded-xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Scope of Work & Architecture
              </h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {project.scope_of_work || 'No specific scope of work documented.'}
              </p>
            </div>

            <div className="p-4 bg-card border rounded-xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Project Description & Notes
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.description || 'No additional notes provided.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/30 border rounded-xl text-xs">
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <p className="font-semibold text-foreground">{project.start_date || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Deployment Date:</span>
              <p className="font-semibold text-foreground">{project.deployment_date || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hosting Renewal:</span>
              <p className="font-semibold text-foreground">{project.renewal_date || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Domain Expiry:</span>
              <p className="font-semibold text-foreground">{project.domain_expiry_date || 'N/A'}</p>
            </div>
          </div>
        </TabsContent>

        {/* 3. PAYMENTS & AMC TAB */}
        <TabsContent value="payments" className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-card border rounded-xl space-y-1">
              <span className="text-xs text-muted-foreground">Agreed / Quoted</span>
              <p className="text-xl font-extrabold text-foreground">
                ₹{(project.final_amount || project.quoted_amount).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 bg-emerald-500/5 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-1">
              <span className="text-xs text-emerald-700 dark:text-emerald-300">Total Received</span>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                ₹{project.paid_amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1">
              <span className="text-xs text-amber-700 dark:text-amber-300">Pending Balance</span>
              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                ₹{pendingAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 bg-purple-500/5 border border-purple-200 dark:border-purple-900 rounded-xl space-y-1">
              <span className="text-xs text-purple-700 dark:text-purple-300">Annual AMC</span>
              <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300">
                ₹{project.annual_amc.toLocaleString('en-IN')} / yr
              </p>
            </div>
          </div>

          {/* Infrastructure & Terms Bar */}
          <div className="p-4 bg-muted/40 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-muted-foreground font-semibold">Monthly Infra Cost:</span>{' '}
              <strong className="text-foreground">₹{project.monthly_infra_cost.toLocaleString('en-IN')} / month</strong>
              {project.payment_notes && (
                <span className="text-muted-foreground ml-2">({project.payment_notes})</span>
              )}
            </div>
            <Button
              onClick={() => setOpenPaymentModal(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Payment Log
            </Button>
          </div>

          {/* Payment History List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Payment Transaction History ({payments.length})
            </h3>
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No payment logs recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-card border rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-600 text-sm">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {p.payment_method}
                      </Badge>
                      {p.transaction_id && (
                        <span className="text-muted-foreground font-mono text-[11px]">
                          Ref: {p.transaction_id}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground font-medium">{p.payment_date}</span>
                      {p.notes && <p className="text-[10px] text-muted-foreground italic">{p.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 4. CHECKLIST TAB */}
        <TabsContent value="checklist" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Project Delivery & Handover Milestones
            </h3>
          </div>

          <div className="space-y-2 bg-card border rounded-xl p-4">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklist(item)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  item.is_completed
                    ? 'bg-emerald-500/5 border-emerald-200 dark:border-emerald-900 line-through text-muted-foreground'
                    : 'bg-card border-border/70 hover:bg-muted/30 text-foreground font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={item.is_completed} onCheckedChange={() => {}} />
                  <span className="text-xs sm:text-sm">{item.item_name}</span>
                </div>
                {item.is_completed && item.completed_at && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold no-underline">
                    Completed
                  </span>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProjectFormModal
        open={openEditProjectModal}
        onOpenChange={(op) => {
          setOpenEditProjectModal(op);
          if (!op) fetchProject();
        }}
        project={project}
      />

      <VaultEditModal
        open={openVaultModal}
        onOpenChange={(op) => {
          setOpenVaultModal(op);
          if (!op) {
            setSelectedVaultToEdit(null);
            fetchProject();
          }
        }}
        projectId={project.id}
        vault={selectedVaultToEdit}
      />

      <PaymentFormModal
        open={openPaymentModal}
        onOpenChange={(op) => {
          setOpenPaymentModal(op);
          if (!op) fetchProject();
        }}
        projectId={project.id}
      />
    </div>
  );
}
