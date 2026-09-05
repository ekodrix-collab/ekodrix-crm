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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultItemCardProps {
  vault: ProjectVault;
  onEdit: (vault: ProjectVault) => void;
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

export function VaultItemCard({ vault, onEdit }: VaultItemCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: config.color || '#3B82F6' }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground leading-tight">
              {vault.label || config.label}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {config.description || vault.vault_type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isFilled ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[10px] font-semibold"
            >
              ✅ Filled
            </Badge>
          ) : vault.is_required ? (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 text-[10px] font-semibold"
            >
              ❌ Missing Info
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
        </div>
      </div>

      {/* Credential Details */}
      <div className="space-y-2 text-xs">
        {/* URL */}
        {vault.url ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground font-medium flex items-center gap-1 truncate max-w-[200px]">
              🔗 <span className="text-foreground">{vault.url}</span>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(vault.url || '', 'url')}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : null}

        {/* Username / Login Owner */}
        {vault.username ? (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground font-medium">
              👤 <span className="text-foreground font-semibold">{vault.username}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.username || '', 'user')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">🔑</span>
              <span className="font-mono text-foreground font-medium">
                {showPassword ? vault.password_encrypted : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title={showPassword ? 'Hide Password' : 'Show Password'}
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
            <span className="text-muted-foreground font-medium truncate max-w-[180px]">
              🔐 Key: <span className="font-mono text-foreground">{vault.api_key.substring(0, 8)}...</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.api_key || '', 'key')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
            <span className="text-muted-foreground font-medium truncate max-w-[180px]">
              🛡️ Secret: <span className="font-mono text-foreground">{vault.access_token.substring(0, 8)}...</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(vault.access_token || '', 'token')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              {copiedField === 'token' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        ) : null}

        {/* Notes */}
        {vault.notes ? (
          <p className="text-[11px] text-muted-foreground italic px-1 bg-accent/20 rounded p-1.5">
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
  );
}
