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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderGit2, Loader2, Check, UserCheck, Edit3, Plus, Trash2, CheckCheck, XCircle, Sparkles } from 'lucide-react';
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

interface VaultTemplateItem {
  id: string;
  type: VaultType;
  label: string;
  defaultChecked?: boolean;
}

const defaultVaultTemplates: VaultTemplateItem[] = [
  { id: 'website_admin', type: 'website_admin', label: 'Website Admin Credentials', defaultChecked: true },
  { id: 'business_email', type: 'business_email', label: 'Business / Client Email', defaultChecked: true },
  { id: 'domain', type: 'domain', label: 'Domain & Registrar', defaultChecked: true },
  { id: 'hosting', type: 'hosting', label: 'Hosting & Server / cPanel', defaultChecked: true },
  { id: 'github', type: 'github', label: 'GitHub Repository', defaultChecked: true },
  { id: 'vercel', type: 'vercel', label: 'Vercel / Deployment', defaultChecked: true },
  { id: 'supabase', type: 'supabase', label: 'Supabase / Database (Optional)', defaultChecked: false },
  { id: 'cloudinary', type: 'cloudinary', label: 'Cloudinary Assets (Optional)', defaultChecked: false },
  { id: 'razorpay', type: 'razorpay', label: 'Razorpay / Gateway (Optional)', defaultChecked: false },
  { id: 'server', type: 'server', label: 'Server / VPS (SSH / Root)', defaultChecked: false },
  { id: 'analytics', type: 'analytics', label: 'Google Analytics / Pixel', defaultChecked: false },
  { id: 'email_service', type: 'email_service', label: 'Email Service (Resend/SendGrid)', defaultChecked: false },
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

  // Client Selection Mode - Default to manual name entry for fast project creation
  const initialClientMode: 'select' | 'manual' = defaultClient
    ? 'select'
    : project?.client_id
    ? 'select'
    : 'manual';

  const [clientMode, setClientMode] = useState<'select' | 'manual'>(initialClientMode);
  const [clientId, setClientId] = useState<string>(
    project?.client_id || defaultClient?.id || (clients.length > 0 ? clients[0].id : '')
  );
  const [manualClientName, setManualClientName] = useState<string>(
    project?.client_display_name || project?.client?.name || ''
  );

  // Form states
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

  const [description, setDescription] = useState(project?.description || '');
  const [scopeOfWork, setScopeOfWork] = useState(project?.scope_of_work || '');

  // Dynamic Vault template list & selection (on new project create)
  const [vaultTemplates, setVaultTemplates] = useState<VaultTemplateItem[]>(defaultVaultTemplates);
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>(
    defaultVaultTemplates.filter((t) => t.defaultChecked).map((t) => t.id)
  );

  // Custom new card input
  const [showAddCard, setShowAddCard] = useState(false);
  const [customCardTitle, setCustomCardTitle] = useState('');
  const [customCardType, setCustomCardType] = useState<VaultType>('other');

  const toggleVaultSelection = (id: string) => {
    setSelectedVaultIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedVaultIds(vaultTemplates.map((t) => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedVaultIds([]);
  };

  const handleSelectDefault = () => {
    const defaultIds = ['website_admin', 'business_email', 'domain', 'hosting', 'github', 'vercel'];
    setSelectedVaultIds(vaultTemplates.filter((t) => defaultIds.includes(t.type)).map((t) => t.id));
  };

  const handleRemoveTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVaultTemplates((prev) => prev.filter((t) => t.id !== id));
    setSelectedVaultIds((prev) => prev.filter((v) => v !== id));
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCardTitle.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newItem: VaultTemplateItem = {
      id: newId,
      type: customCardType,
      label: customCardTitle.trim(),
    };

    setVaultTemplates((prev) => [...prev, newItem]);
    setSelectedVaultIds((prev) => [...prev, newId]);
    setCustomCardTitle('');
    setShowAddCard(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientId: string | null = null;
    let finalClientDisplayName: string | null = null;

    if (defaultClient) {
      finalClientId = defaultClient.id;
      finalClientDisplayName = defaultClient.name;
    } else if (clientMode === 'select') {
      if (!clientId) {
        setError('Please select a client for this project');
        return;
      }
      finalClientId = clientId;
      const matched = clients.find((c) => c.id === clientId);
      finalClientDisplayName = matched?.name || null;
    } else {
      if (!manualClientName.trim()) {
        setError('Please enter a client name');
        return;
      }
      finalClientId = null;
      finalClientDisplayName = manualClientName.trim();
    }

    if (!projectName.trim()) {
      setError('Project Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    // Collect chosen vault items
    const chosenVaultItems = vaultTemplates
      .filter((t) => selectedVaultIds.includes(t.id))
      .map((t) => ({ type: t.type, label: t.label }));

    const res = await saveProjectAction({
      id: project?.id,
      client_id: finalClientId,
      client_display_name: finalClientDisplayName,
      project_name: projectName.trim(),
      project_type: projectType,
      status,
      technical_owner_id: technicalOwnerId || undefined,
      start_date: startDate || undefined,
      deadline: deadline || undefined,
      deployment_date: deploymentDate || undefined,
      renewal_date: renewalDate || undefined,
      domain_expiry_date: domainExpiryDate || undefined,
      quoted_amount: project?.quoted_amount || 0,
      final_amount: project?.final_amount || 0,
      monthly_infra_cost: project?.monthly_infra_cost || 0,
      annual_amc: project?.annual_amc || 0,
      payment_terms: project?.payment_terms || '50_50',
      payment_notes: project?.payment_notes || undefined,
      description: description.trim() || undefined,
      scope_of_work: scopeOfWork.trim() || undefined,
      required_vault_items: !project ? chosenVaultItems : undefined,
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
              {/* Client field with Manual (Default) vs Select Option */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>{clientMode === 'manual' ? 'Client / Brand Name *' : 'Select Client *'}</Label>
                  {!defaultClient && (
                    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setClientMode('manual')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                          clientMode === 'manual'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        Enter Name
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientMode('select')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                          clientMode === 'select'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        Select from CRM
                      </button>
                    </div>
                  )}
                </div>

                {defaultClient ? (
                  <div className="p-2.5 bg-muted/60 rounded-md text-sm font-medium">
                    {defaultClient.name} {defaultClient.company ? `(${defaultClient.company})` : ''}
                  </div>
                ) : clientMode === 'manual' ? (
                  <Input
                    placeholder="Enter client or brand name (e.g. Acme Inc / John Doe)"
                    value={manualClientName}
                    onChange={(e) => setManualClientName(e.target.value)}
                    autoFocus
                    required
                  />
                ) : (
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Client from CRM list" />
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

              <div className="space-y-1.5 sm:col-span-2">
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

          {/* VAULT SETUP CHECKLIST (Only when creating new project) */}
          {!project && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  🔐 3. Vault Setup - Credential Cards ({selectedVaultIds.length}/{vaultTemplates.length} Selected)
                </h3>

                {/* Quick Selection Toolbar */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-semibold text-primary hover:underline px-1.5 py-0.5"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={handleSelectDefault}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5"
                  >
                    Core (6)
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] font-semibold text-red-500 hover:underline px-1.5 py-0.5"
                  >
                    Clear (0)
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Check credentials needed for this project, remove unneeded cards, or add custom ones.
              </p>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {vaultTemplates.map((template) => {
                  const isChecked = selectedVaultIds.includes(template.id);
                  return (
                    <div
                      key={template.id}
                      onClick={() => toggleVaultSelection(template.id)}
                      className={`group flex items-center justify-between gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-primary/5 border-primary/40 text-foreground font-medium'
                          : 'bg-muted/20 border-border/60 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input bg-background'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs select-none truncate">{template.label}</span>
                      </div>

                      {/* Remove Button for individual template */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTemplate(template.id, e)}
                        title="Remove from list"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-1 rounded hover:bg-muted"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Credential Card Inline */}
              <div className="pt-2">
                {showAddCard ? (
                  <div className="p-3 bg-card border rounded-lg space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">+ Add Custom Credential Card</Label>
                      <button
                        type="button"
                        onClick={() => setShowAddCard(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        placeholder="Card Name (e.g. Stripe API Key, Figma File)"
                        value={customCardTitle}
                        onChange={(e) => setCustomCardTitle(e.target.value)}
                        className="sm:col-span-2 text-xs h-8"
                        autoFocus
                      />
                      <Select
                        value={customCardType}
                        onValueChange={(v) => setCustomCardType(v as VaultType)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 text-xs">
                          <SelectItem value="other">📁 Generic Credentials</SelectItem>
                          <SelectItem value="api_keys">🔑 API Key / Token</SelectItem>
                          <SelectItem value="payment_gateway">💳 Payment Gateway</SelectItem>
                          <SelectItem value="database">🛢️ Database</SelectItem>
                          <SelectItem value="cloud_storage">☁️ Cloud Storage</SelectItem>
                          <SelectItem value="social_media">📱 Social Media</SelectItem>
                          <SelectItem value="monitoring">📊 Monitoring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddCustomCard}
                      size="sm"
                      className="w-full text-xs h-8 gap-1.5 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Credential Card
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowAddCard(true)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5 border-dashed font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Custom Credential Card
                  </Button>
                )}
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
