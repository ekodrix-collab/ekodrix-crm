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
import { KeyRound, Loader2, Trash2 } from 'lucide-react';
import { saveVaultItemAction, deleteVaultItemAction } from '@/lib/actions/vaults';
import { ProjectVault, VaultType } from '@/types/hub';
import { VAULT_TYPES } from '@/lib/vault-config';

interface VaultEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  vault?: ProjectVault | null;
}

export function VaultEditModal({
  open,
  onOpenChange,
  projectId,
  vault,
}: VaultEditModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vaultType, setVaultType] = useState<VaultType>(
    vault?.vault_type || 'website_admin'
  );
  const [label, setLabel] = useState(vault?.label || '');
  const [url, setUrl] = useState(vault?.url || '');
  const [username, setUsername] = useState(vault?.username || '');
  const [password, setPassword] = useState(vault?.password_encrypted || '');
  const [apiKey, setApiKey] = useState(vault?.api_key || '');
  const [accessToken, setAccessToken] = useState(vault?.access_token || '');
  const [sshKey, setSshKey] = useState(vault?.ssh_key || '');
  const [notes, setNotes] = useState(vault?.notes || '');
  const [isRequired, setIsRequired] = useState(vault?.is_required ?? true);

  const config = VAULT_TYPES[vaultType] || VAULT_TYPES.other;

  const handleTypeChange = (type: VaultType) => {
    setVaultType(type);
    const cfg = VAULT_TYPES[type];
    if (cfg && !label) {
      setLabel(cfg.label);
    }
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
      url,
      username,
      password_encrypted: password,
      api_key: apiKey,
      access_token: accessToken,
      ssh_key: sshKey,
      notes,
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="w-5 h-5 text-primary" />
            {vault ? `Edit Vault: ${vault.label}` : 'Add Vault Credential Item'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vault Type</Label>
              <Select
                value={vaultType}
                onValueChange={(v) => handleTypeChange(v as VaultType)}
                disabled={!!vault}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.entries(VAULT_TYPES).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="label">Display Label</Label>
              <Input
                id="label"
                placeholder={config.label}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="url">URL / Host</Label>
              <Input
                id="url"
                placeholder="https://example.com/admin or IP address"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username / Login Owner</Label>
              <Input
                id="username"
                placeholder="admin or email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password / Secret</Label>
              <Input
                id="password"
                type="text"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiKey">API Key / Publishable Key</Label>
              <Input
                id="apiKey"
                placeholder="Key ID or public token"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accessToken">Access Token / Webhook Secret</Label>
              <Input
                id="accessToken"
                placeholder="Secret token or key"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sshKey">SSH Key / Private Key (Optional)</Label>
              <Textarea
                id="sshKey"
                placeholder="ssh-rsa AAAA... or private cert"
                value={sshKey}
                onChange={(e) => setSshKey(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes / Environment Details</Label>
              <Textarea
                id="notes"
                placeholder="e.g. 2FA phone number, recovery codes, main repo branch"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Required for Project Health</Label>
              <p className="text-xs text-muted-foreground">
                If enabled, health check requires this item to be filled.
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
                Delete Vault Item
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
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
