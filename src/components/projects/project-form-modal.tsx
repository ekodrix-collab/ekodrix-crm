'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderGit2, Loader2, Sparkles, ShieldCheck, IndianRupee, Server, Database, Globe, Mail } from 'lucide-react';
import { saveProjectAction } from '@/lib/actions/projects';
import { Project, Client, ProjectType, ProjectStatus, VaultType } from '@/types/hub';
import { VAULT_TYPES } from '@/lib/vault-config';

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Client[];
  defaultClient?: Client | null;
  users?: { id: string; name: string }[];
  project?: Project | null;
}

const defaultVaultTemplates: { type: VaultType; label: string; defaultChecked: boolean }[] = [
  { type: 'website_admin', label: 'Website Admin Credentials', defaultChecked: true },
  { type: 'business_email', label: 'Business / Client Email', defaultChecked: true },
  { type: 'domain', label: 'Domain & Registrar', defaultChecked: true },
  { type: 'hosting', label: 'Hosting & Server / cPanel', defaultChecked: true },
  { type: 'github', label: 'GitHub Repository', defaultChecked: true },
  { type: 'vercel', label: 'Vercel / Deployment', defaultChecked: true },
  { type: 'supabase', label: 'Supabase / Database (Optional)', defaultChecked: false },
  { type: 'cloudinary', label: 'Cloudinary Assets (Optional)', defaultChecked: false },
  { type: 'razorpay', label: 'Razorpay / Gateway (Optional)', defaultChecked: false },
  { type: 'server', label: 'Server / VPS (SSH / Root)', defaultChecked: false },
  { type: 'analytics', label: 'Google Analytics / Pixel', defaultChecked: false },
  { type: 'email_service', label: 'Email Service (Resend/SendGrid)', defaultChecked: false },
];

export function ProjectFormModal({
  open,
  onOpenChange,
  clients = [],
  defaultClient,
  users = [],
  project,
}: ProjectFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [clientId, setClientId] = useState<string>(
    project?.client_id || defaultClient?.id || (clients.length > 0 ? clients[0].id : '')
  );
  const [projectName, setProjectName] = useState(project?.project_name || '');
  const [projectType, setProjectType] = useState<ProjectType>(
    project?.project_type || 'website'
  );
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'active');
  const [technicalOwnerId, setTechnicalOwnerId] = useState(
    project?.technical_owner_id || ''
  );

  // Key Dates
  const [startDate, setStartDate] = useState(
    project?.start_date || new Date().toISOString().split('T')[0]
  );
  const [deadline, setDeadline] = useState(project?.deadline || '');
  const [deploymentDate, setDeploymentDate] = useState(project?.deployment_date || '');
  const [renewalDate, setRenewalDate] = useState(project?.renewal_date || '');
  const [domainExpiryDate, setDomainExpiryDate] = useState(project?.domain_expiry_date || '');

  // Cost & AMC Details (Private)
  const [quotedAmount, setQuotedAmount] = useState<number | string>(
    project?.quoted_amount || ''
  );
  const [finalAmount, setFinalAmount] = useState<number | string>(
    project?.final_amount || ''
  );
  const [monthlyInfraCost, setMonthlyInfraCost] = useState<number | string>(
    project?.monthly_infra_cost || ''
  );
  const [annualAmc, setAnnualAmc] = useState<number | string>(
    project?.annual_amc || ''
  );
  const [paymentTerms, setPaymentTerms] = useState(project?.payment_terms || '50_50');
  const [paymentNotes, setPaymentNotes] = useState(project?.payment_notes || '');

  const [description, setDescription] = useState(project?.description || '');
  const [scopeOfWork, setScopeOfWork] = useState(project?.scope_of_work || '');

  // Vault template selection (on new project create)
  const [selectedVaults, setSelectedVaults] = useState<VaultType[]>(
    defaultVaultTemplates.filter((t) => t.defaultChecked).map((t) => t.type)
  );

  const toggleVaultSelection = (vt: VaultType) => {
    if (selectedVaults.includes(vt)) {
      setSelectedVaults(selectedVaults.filter((v) => v !== vt));
    } else {
      setSelectedVaults([...selectedVaults, vt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client for this project');
      return;
    }
    if (!projectName.trim()) {
      setError('Project Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await saveProjectAction({
      id: project?.id,
      client_id: clientId,
      project_name: projectName.trim(),
      project_type: projectType,
      status,
      technical_owner_id: technicalOwnerId || undefined,
      start_date: startDate || undefined,
      deadline: deadline || undefined,
      deployment_date: deploymentDate || undefined,
      renewal_date: renewalDate || undefined,
      domain_expiry_date: domainExpiryDate || undefined,
      quoted_amount: Number(quotedAmount) || 0,
      final_amount: Number(finalAmount) || Number(quotedAmount) || 0,
      monthly_infra_cost: Number(monthlyInfraCost) || 0,
      annual_amc: Number(annualAmc) || 0,
      payment_terms: paymentTerms,
      payment_notes: paymentNotes.trim() || undefined,
      description: description.trim() || undefined,
      scope_of_work: scopeOfWork.trim() || undefined,
      required_vault_types: !project ? selectedVaults : undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onOpenChange(false);
      router.refresh();
      if (!project && res.projectId) {
        router.push(`/projects/${res.projectId}`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FolderGit2 className="w-5 h-5 text-primary" />
            {project ? 'Edit Project & Details' : '📁 New Project & Vault Setup'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC PROJECT INFO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              1. Project & Client
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client *</Label>
                {defaultClient ? (
                  <div className="p-2.5 bg-muted/60 rounded-md text-sm font-medium">
                    {defaultClient.name} {defaultClient.company ? `(${defaultClient.company})` : ''}
                  </div>
                ) : (
                  <Select value={clientId} onValueChange={setClientId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Dairy E-commerce Portal"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Project Type</Label>
                <Select
                  value={projectType}
                  onValueChange={(v) => setProjectType(v as ProjectType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">🌐 Business Website</SelectItem>
                    <SelectItem value="ecommerce">🛒 E-commerce Store</SelectItem>
                    <SelectItem value="app">📱 Mobile App</SelectItem>
                    <SelectItem value="saas">⚡ SaaS / Web Application</SelectItem>
                    <SelectItem value="landing_page">📄 Landing Page / Lead Funnel</SelectItem>
                    <SelectItem value="branding">🎨 Branding & UI/UX</SelectItem>
                    <SelectItem value="other">📁 Other Solution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Project Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ProjectStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">📝 Planning & Scoping</SelectItem>
                    <SelectItem value="active">🚀 Active Development</SelectItem>
                    <SelectItem value="on_hold">⏸️ On Hold</SelectItem>
                    <SelectItem value="completed">🏁 Completed</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {users.length > 0 && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Project Technical Owner / Lead Dev</Label>
                  <Select
                    value={technicalOwnerId}
                    onValueChange={setTechnicalOwnerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select technical owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* DATES & DOMAIN EXPIRY */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              2. Timeline & Renewal Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deadline">Target Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deploymentDate">Deployment Date</Label>
                <Input
                  id="deploymentDate"
                  type="date"
                  value={deploymentDate}
                  onChange={(e) => setDeploymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="domainExpiryDate">Domain Expiry Date</Label>
                <Input
                  id="domainExpiryDate"
                  type="date"
                  value={domainExpiryDate}
                  onChange={(e) => setDomainExpiryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="renewalDate">Hosting / AMC Renewal Date</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* COST & AMC (Private) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center justify-between">
              <span>3. Financials & AMC (Private)</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Never displayed on main dashboard
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quotedAmount">Quoted Amount (₹)</Label>
                <Input
                  id="quotedAmount"
                  type="number"
                  placeholder="100000"
                  value={quotedAmount}
                  onChange={(e) => {
                    setQuotedAmount(e.target.value);
                    if (!finalAmount) setFinalAmount(e.target.value);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="finalAmount">Agreed / Final Amount (₹)</Label>
                <Input
                  id="finalAmount"
                  type="number"
                  placeholder="100000"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthlyInfraCost">Monthly Infra Cost (₹)</Label>
                <Input
                  id="monthlyInfraCost"
                  type="number"
                  placeholder="e.g. 1500 (VPS + DB)"
                  value={monthlyInfraCost}
                  onChange={(e) => setMonthlyInfraCost(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="annualAmc">Annual AMC Maintenance (₹)</Label>
                <Input
                  id="annualAmc"
                  type="number"
                  placeholder="e.g. 25000"
                  value={annualAmc}
                  onChange={(e) => setAnnualAmc(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50_50">50% Advance - 50% Handover</SelectItem>
                    <SelectItem value="full_advance">100% Full Advance</SelectItem>
                    <SelectItem value="30_60_10">30% - 60% - 10% Milestone</SelectItem>
                    <SelectItem value="monthly">Monthly Retainer</SelectItem>
                    <SelectItem value="custom">Custom Terms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentNotes">Payment Notes</Label>
                <Input
                  id="paymentNotes"
                  placeholder="e.g. 50k on UI design, 50k on live launch"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* VAULT SETUP CHECKLIST (Only when creating new project) */}
          {!project && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">
                🔐 4. Vault Setup - What does this project need?
              </h3>
              <p className="text-xs text-muted-foreground">
                Select required credential cards. This automatically generates empty vault items and tracks health.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {defaultVaultTemplates.map((template) => {
                  const isChecked = selectedVaults.includes(template.type);
                  return (
                    <div
                      key={template.type}
                      onClick={() => toggleVaultSelection(template.type)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-primary/5 border-primary/40 text-foreground font-medium'
                          : 'bg-muted/20 border-border/60 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleVaultSelection(template.type)}
                      />
                      <span className="text-xs">{template.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCOPE OF WORK & DESCRIPTION */}
          <div className="space-y-1.5">
            <Label htmlFor="scopeOfWork">Scope of Work & Notes</Label>
            <Textarea
              id="scopeOfWork"
              placeholder="e.g. Next.js 14 frontend, Supabase PostgreSQL auth, Cloudinary image upload, Razorpay payment gateway..."
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {project ? 'Update Project' : 'Create Project & Initialize Vault'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
