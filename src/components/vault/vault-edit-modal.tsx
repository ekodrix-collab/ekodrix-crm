'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  KeyRound,
  Loader2,
  Trash2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Globe,
  Server,
  Github,
  Triangle,
  Database,
  Image as ImageIcon,
  CreditCard,
  Terminal,
  Cylinder,
  Send,
  Wallet,
  BarChart,
  HardDrive,
  Key,
  Share2,
  Settings as SettingsIcon,
  Upload,
  Zap,
  Activity,
  Folder,
} from 'lucide-react';
import { saveVaultItemAction, deleteVaultItemAction } from '@/lib/actions/vaults';
import { ProjectVault, VaultType } from '@/types/hub';
import { VAULT_TYPES } from '@/lib/vault-config';

interface VaultEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  vault?: ProjectVault | null;
  defaultType?: VaultType;
}

const iconMap: Record<string, any> = {
  ShieldCheck,
  Mail,
  Globe,
  Server,
  Github,
  Triangle,
  Database,
  Image: ImageIcon,
  CreditCard,
  Terminal,
  Cylinder,
  Send,
  Wallet,
  BarChart,
  HardDrive,
  Key,
  Share2,
  Settings: SettingsIcon,
  Upload,
  Zap,
  Activity,
  Folder,
};

type FormValues = {
  url: string;
  username: string;
  password: string;
  api_key: string;
  access_token: string;
  ssh_key: string;
  notes: string;
};

const defaultFormValues: FormValues = {
  url: '',
  username: '',
  password: '',
  api_key: '',
  access_token: '',
  ssh_key: '',
  notes: '',
};

export function VaultEditModal({
  open,
  onOpenChange,
  projectId,
  vault,
  defaultType,
}: VaultEditModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vaultType, setVaultType] = useState<VaultType>(
    vault?.vault_type || defaultType || 'website_admin'
  );
  const [label, setLabel] = useState(vault?.label || '');
  const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
  const [isRequired, setIsRequired] = useState(vault?.is_required ?? true);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      if (vault) {
        setVaultType(vault.vault_type);
        setLabel(vault.label);
        setFormValues({
          url: vault.url || '',
          username: vault.username || '',
          password: vault.password_encrypted || '',
          api_key: vault.api_key || '',
          access_token: vault.access_token || '',
          ssh_key: vault.ssh_key || '',
          notes: vault.notes || '',
        });
        setIsRequired(vault.is_required);
      } else {
        const type = defaultType || 'website_admin';
        setVaultType(type);
        setLabel(VAULT_TYPES[type]?.label || '');
        setFormValues(defaultFormValues);
        setIsRequired(true);
      }
      setShowExtraFields(false);
      setVisiblePasswords({});
      setError(null);
    }
  }, [open, vault, defaultType]);

  const config = VAULT_TYPES[vaultType] || VAULT_TYPES.other;
  const IconComponent = iconMap[config.icon] || Folder;

  const handleTypeChange = (type: VaultType) => {
    setVaultType(type);
    const cfg = VAULT_TYPES[type];
    if (cfg) {
      setLabel(cfg.label);
    }
  };

  const updateField = (fieldName: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await saveVaultItemAction({
      id: vault?.id,
      project_id: projectId,
      vault_type: vaultType,
      label: label || config.label,
      url: formValues.url,
      username: formValues.username,
      password_encrypted: formValues.password,
      api_key: formValues.api_key,
      access_token: formValues.access_token,
      ssh_key: formValues.ssh_key,
      notes: formValues.notes,
      is_required: isRequired,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onOpenChange(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!vault?.id) return;

    setDeleting(true);
    const res = await deleteVaultItemAction(vault.id, projectId);
    setDeleting(false);

    if (res.error) {
      setError(res.error);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(false);
      onOpenChange(false);
      router.refresh();
    }
  };

  // Determine active configured fields vs remaining optional extra fields
  const configuredFieldNames = new Set(config.fields.map((f) => f.name));
  const allPossibleFieldNames: (keyof FormValues)[] = [
    'url',
    'username',
    'password',
    'api_key',
    'access_token',
    'ssh_key',
    'notes',
  ];
  const extraFieldNames = allPossibleFieldNames.filter(
    (name) => !configuredFieldNames.has(name)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: config.color || '#3B82F6' }}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span>{vault ? `Edit ${vault.label}` : `Add ${config.label}`}</span>
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header / Type Selector Info */}
            <div className="p-3 bg-muted/40 rounded-xl border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-semibold">Credential Card Type</Label>
                  <Select
                    value={vaultType}
                    onValueChange={(v) => handleTypeChange(v as VaultType)}
                    disabled={!!vault}
                  >
                    <SelectTrigger className="h-9 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 text-xs">
                      {Object.entries(VAULT_TYPES).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="label" className="text-xs text-muted-foreground font-semibold">Display Title</Label>
                  <Input
                    id="label"
                    placeholder={config.label}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="h-9 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              {config.description && (
                <p className="text-[11px] text-muted-foreground">
                  💡 {config.description}
                </p>
              )}
            </div>

            {/* Dynamic Type-Specific Fields */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">
                Required / Relevant Credentials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {config.fields.map((field) => {
                  const fieldKey = field.name as keyof FormValues;
                  const isTextarea = field.type === 'textarea';
                  const isPasswordType = field.type === 'password';
                  const isVisible = visiblePasswords[field.name];

                  if (isTextarea) {
                    return (
                      <div key={field.name} className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={field.name} className="text-xs font-semibold">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder || ''}
                          value={formValues[fieldKey] || ''}
                          onChange={(e) => updateField(fieldKey, e.target.value)}
                          rows={2}
                          className="text-xs"
                          required={field.required}
                        />
                        {field.helperText && (
                          <p className="text-[10px] text-muted-foreground">{field.helperText}</p>
                        )}
                      </div>
                    );
                  }

                  const isFullWidth = field.name === 'url' || field.name === 'ssh_key';

                  return (
                    <div
                      key={field.name}
                      className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}
                    >
                      <Label htmlFor={field.name} className="text-xs font-semibold">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          id={field.name}
                          type={
                            isPasswordType
                              ? isVisible
                                ? 'text'
                                : 'password'
                              : field.type === 'url'
                              ? 'text'
                              : field.type
                          }
                          placeholder={field.placeholder || ''}
                          value={formValues[fieldKey] || ''}
                          onChange={(e) => updateField(fieldKey, e.target.value)}
                          required={field.required}
                          className={`text-xs h-9 ${isPasswordType ? 'pr-8 font-mono' : ''}`}
                        />
                        {isPasswordType && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.name)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                            title={isVisible ? 'Hide' : 'Reveal'}
                          >
                            {isVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                      {field.helperText && (
                        <p className="text-[10px] text-muted-foreground">{field.helperText}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional / Extra Advanced Fields Toggle */}
            {extraFieldNames.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtraFields(!showExtraFields)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {showExtraFields
                    ? 'Hide Extra Fields'
                    : `+ Add Extra Fields (${extraFieldNames.length} optional)`}
                </button>

                {showExtraFields && (
                  <div className="mt-2.5 p-3.5 bg-muted/20 border border-dashed rounded-xl space-y-3">
                    <p className="text-[11px] text-muted-foreground">
                      Additional optional fields not typically needed for {config.label}:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {extraFieldNames.map((name) => {
                        const labelsMap: Record<keyof FormValues, string> = {
                          url: 'Custom URL / Host',
                          username: 'Additional Username',
                          password: 'Secondary Password / PIN',
                          api_key: 'API Key / Token',
                          access_token: 'Access Token / Webhook Secret',
                          ssh_key: 'SSH / Private Key',
                          notes: 'General Notes',
                        };

                        if (name === 'ssh_key' || name === 'notes') {
                          return (
                            <div key={name} className="space-y-1 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">{labelsMap[name]}</Label>
                              <Textarea
                                value={formValues[name]}
                                onChange={(e) => updateField(name, e.target.value)}
                                rows={2}
                                className="text-xs"
                                placeholder={`Enter ${labelsMap[name].toLowerCase()}...`}
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={name} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{labelsMap[name]}</Label>
                            <Input
                              value={formValues[name]}
                              onChange={(e) => updateField(name, e.target.value)}
                              className="text-xs h-8"
                              placeholder={`Enter ${labelsMap[name].toLowerCase()}...`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Health check switch */}
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Count in Vault Health Score</Label>
                <p className="text-[11px] text-muted-foreground">
                  If enabled, missing credentials will flag health alerts.
                </p>
              </div>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>

            <DialogFooter className="gap-2 pt-2 border-t flex flex-row items-center justify-between">
              {vault?.id ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting || loading}
                  className="gap-1 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Card
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-1.5 text-xs h-9 font-semibold">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Credentials
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md rounded-2xl p-6 border border-border/80 shadow-2xl bg-card">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Delete Vault Credential?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground font-semibold">
                "{vault?.label || 'this credential'}"
              </strong>
              ? This vault item and all stored credentials will be removed and{' '}
              <span className="text-red-500 font-medium">cannot be recovered</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl font-semibold text-xs h-9 border-border/80"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Keep It
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Yes, Delete Credential
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
