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
  CheckSquare,
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
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';

// Navigation items
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Overview & stats',
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
    description: 'Manage leads',
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Your to-dos',
  },
  {
    name: 'Meetings',
    href: '/meetings',
    icon: Calendar,
    description: 'Scheduled meetings',
  },
  {
    name: 'Deals',
    href: '/deals',
    icon: IndianRupee,
    description: 'Revenue pipeline',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Analytics',
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
    return pathname.startsWith(href);
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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight text-foreground">Agency CRM</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Lead Management
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
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {/* Section Label */}
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Main Menu
              </p>
            )}

            {navigationItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon
                    className={cn(
                      'flex-shrink-0 transition-transform',
                      active ? 'w-5 h-5' : 'w-5 h-5',
                      active && 'scale-110'
                    )}
                  />
                  {!collapsed && <span>{item.name}</span>}
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
            })}

            {/* Divider */}
            <div className="my-4 border-t border-border" />

            {/* Section Label */}
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Settings
              </p>
            )}

            {bottomNavigationItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.name}>{linkContent}</div>;
            })}
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