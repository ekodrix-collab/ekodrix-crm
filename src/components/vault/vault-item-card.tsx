'use client';

import { useState } from 'react';
import { ProjectVault, VaultType } from '@/types/hub';
import { VAULT_TYPES } from '@/lib/vault-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
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
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  AlertCircle,
  Trash2,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface VaultItemCardProps {
  vault: ProjectVault;
  onEdit: (vault: ProjectVault) => void;
  onDelete?: (vault: ProjectVault) => void;
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

export function VaultItemCard({ vault, onEdit, onDelete }: VaultItemCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const config = VAULT_TYPES[vault.vault_type] || {
    label: vault.label,
    icon: 'Folder',
    color: '#6B7280',
    badgeBg: 'bg-muted text-muted-foreground',
    description: '',
  };

  const IconComponent = iconMap[config.icon] || Folder;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isFilled = vault.is_filled;

  return (
    <>
      <div
        className={cn(
          'bg-card border rounded-xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-3.5',
          isFilled
            ? 'border-border/90 hover:border-primary/50'
            : vault.is_required
            ? 'border-red-300 dark:border-red-900 bg-red-500/[0.02]'
            : 'border-dashed border-border/60 bg-muted/20'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: config.color || '#3B82F6' }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground leading-tight truncate">
                {vault.label || config.label}
              </h4>
              <p className="text-[11px] text-muted-foreground truncate">
                {config.description || vault.vault_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isFilled ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[10px] font-semibold"
              >
                Filled
              </Badge>
            ) : vault.is_required ? (
              <Badge
                variant="outline"
                className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 text-[10px] font-semibold"
              >
                Missing
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Optional
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(vault)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Edit credentials"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                title="Remove card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

      {/* Credential Details */}
      <div className="space-y-2 text-xs">
        {/* URL */}
        {vault.url ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5 truncate max-w-[200px]">
              <span>🔗</span>
              <span className="text-foreground truncate">{vault.url}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(vault.url || '', 'url')}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Copy URL"
              >
                {copiedField === 'url' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <a
                href={vault.url.startsWith('http') ? vault.url : `https://${vault.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary p-1"
                title="Open Link"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : null}

        {/* Username / Login Owner / Cloud Name / Email */}
        {vault.username ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                {config.fields.find((f) => f.name === 'username')?.label || 'Username / User'}
              </span>
              <span className="text-foreground font-semibold truncate block">
                {vault.username}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.username || '', 'user')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
              title="Copy"
            >
              {copiedField === 'user' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        ) : null}

        {/* Password (Masked by default) */}
        {vault.password_encrypted ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                {config.fields.find((f) => f.name === 'password')?.label || 'Password / Secret'}
              </span>
              <span className="font-mono text-foreground font-medium truncate block">
                {showPassword ? vault.password_encrypted : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title={showPassword ? 'Hide' : 'Reveal'}
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(vault.password_encrypted || '', 'pass')}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Copy Password"
              >
                {copiedField === 'pass' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {/* API Key / Token */}
        {vault.api_key ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                {config.fields.find((f) => f.name === 'api_key')?.label || 'API Key'}
              </span>
              <span className="font-mono text-foreground font-medium truncate block">
                {vault.api_key.length > 16 ? `${vault.api_key.substring(0, 10)}...` : vault.api_key}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.api_key || '', 'key')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
              title="Copy API Key"
            >
              {copiedField === 'key' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        ) : null}

        {/* Access Token / Webhook Secret */}
        {vault.access_token ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                {config.fields.find((f) => f.name === 'access_token')?.label || 'Access Token / Secret'}
              </span>
              <span className="font-mono text-foreground font-medium truncate block">
                {vault.access_token.length > 16 ? `${vault.access_token.substring(0, 10)}...` : vault.access_token}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.access_token || '', 'token')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
              title="Copy Token"
            >
              {copiedField === 'token' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        ) : null}

        {/* SSH Key */}
        {vault.ssh_key ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                SSH Private / Public Key
              </span>
              <span className="font-mono text-[11px] text-foreground truncate block">
                {vault.ssh_key.substring(0, 20)}...
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.ssh_key || '', 'ssh')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
              title="Copy SSH Key"
            >
              {copiedField === 'ssh' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        ) : null}

        {/* Notes */}
        {vault.notes ? (
          <p className="text-[11px] text-muted-foreground italic px-2 py-1.5 bg-accent/20 rounded-lg border border-border/40">
            📝 {vault.notes}
          </p>
        ) : null}

        {/* Not filled state */}
        {!isFilled && (
          <div className="p-3 bg-red-500/5 rounded-lg border border-red-200/60 dark:border-red-900/60 text-center space-y-1.5">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              ⚠️ Credentials not entered yet
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(vault)}
              className="h-7 text-xs border-red-300 text-red-700 dark:text-red-300 hover:bg-red-500/10"
            >
              + Add Credentials
            </Button>
          </div>
        )}
      </div>
    </div>

    {onDelete && (
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {vault.label || config.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this credential card from the project vault? Any stored credentials for this item will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete(vault);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
  </>
  );
}
