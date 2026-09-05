'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  LayoutDashboard,
  Users,
  Calendar,
  IndianRupee,
  BarChart3,
  Settings,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Loader2,
  Megaphone,
  Clock,
  UserCheck,
  FolderGit2,
  MessageSquareText,
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';

// MAIN: Primary Focus
const mainNavigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Health overview & active focus',
  },
  {
    name: 'Clients & Enquiries',
    href: '/clients',
    icon: UserCheck,
    description: 'Enquiries, promises & clients',
    badge: 'Hub',
  },
  {
    name: 'Follow-ups',
    href: '/followups',
    icon: MessageSquareText,
    description: 'Discussions & commitments',
    badge: 'Urgent',
  },
  {
    name: 'Projects & Vaults',
    href: '/projects',
    icon: FolderGit2,
    description: 'Credentials, health & costs',
  },
];

// Agency Tools: Secondary
const crmNavigationItems = [
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Megaphone,
    description: 'Marketing campaigns',
  },
  {
    name: 'Meetings',
    href: '/meetings',
    icon: Calendar,
    description: 'Scheduled meetings',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Analytics & performance',
  },
];

const bottomNavigationItems = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading, signOut, isAdmin } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Handle sign out
  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setShowLogoutDialog(false);
  };

  // Check if route is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href) || (href === '/followups' && pathname.startsWith('/follow-ups'));
  };

  const renderNavList = (items: typeof mainNavigationItems) => {
    return items.map((item) => {
      const active = isActive(item.href);
      const Icon = item.icon;

      const linkContent = (
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
            active
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          <Icon
            className={cn(
              'flex-shrink-0 transition-transform',
              active ? 'w-5 h-5' : 'w-5 h-5 text-muted-foreground group-hover:text-foreground',
              active && 'scale-105'
            )}
          />
          {!collapsed && (
            <span className="flex-1 truncate">{item.name}</span>
          )}
          {!collapsed && (item as any).badge && !active && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
              {(item as any).badge}
            </span>
          )}
        </Link>
      );

      if (collapsed) {
        return (
          <Tooltip key={item.name}>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      }

      return <div key={item.name}>{linkContent}</div>;
    });
  };

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col bg-card dark:bg-card border-r border-border transition-all duration-300',
            collapsed ? 'w-20' : 'w-72'
          )}
        >
          {/* Logo Section */}
          <div
            className={cn(
              'flex items-center h-16 border-b border-border',
              collapsed ? 'justify-center px-2' : 'px-6'
            )}
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-none tracking-tight">Ekodrix Hub</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                    Agency & Vault System
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'absolute top-20 -right-3 w-6 h-6 rounded-full bg-background border border-border text-muted-foreground hover:text-primary hover:bg-accent z-50',
              'flex items-center justify-center'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </Button>

          {/* Main Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
            {/* MAIN SECTION */}
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-primary/80">
                  Main Hub
                </p>
              )}
              {renderNavList(mainNavigationItems)}
            </div>

            {/* AGENCY TOOLS SECTION */}
            <div className="space-y-1 pt-2 border-t border-border/60">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agency Tools
                </p>
              )}
              {renderNavList(crmNavigationItems)}
            </div>

            {/* SETTINGS SECTION */}
            <div className="space-y-1 pt-2 border-t border-border/60">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  System
                </p>
              )}
              {renderNavList(bottomNavigationItems)}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-border">
            {loading ? (
              <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
                <Skeleton className="w-10 h-10 rounded-full bg-accent" />
                {!collapsed && (
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1 bg-accent" />
                    <Skeleton className="h-3 w-16 bg-accent" />
                  </div>
                )}
              </div>
            ) : user ? (
              <div
                className={cn(
                  'flex items-center gap-3',
                  collapsed && 'justify-center'
                )}
              >
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                  <AvatarFallback
                    className={cn(getAvatarColor(user.name), 'text-primary-foreground font-medium')}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      {isAdmin && (
                        <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}

                {!collapsed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowLogoutDialog(true)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Sign out</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ) : null}

            {collapsed && user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full mt-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </aside>
      </TooltipProvider>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page and will need to sign in again to access the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleSignOut(); }}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : 'Log out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}