'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from './user-menu';
import {
  Search,
  Bell,
  Plus,
  X,
  Users,
  CheckSquare,
  Loader2,
  Check,
} from 'lucide-react';
import { cn, debounce } from '@/lib/utils';
import type { Lead, Task, Notification } from '@/types';

interface SearchResult {
  leads: Lead[];
  tasks: Task[];
}

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ leads: [], tasks: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debounced search function
  const performSearch = useCallback(
    (query: string) => {
      const debouncedSearch = debounce(async () => {
        if (!query.trim() || query.length < 2) {
          setSearchResults({ leads: [], tasks: [] });
          setIsSearching(false);
          return;
        }

        setIsSearching(true);

        try {
          // Search leads
          const { data: leads } = await supabase
            .from('leads')
            .select('id, name, email, phone, company_name, status')
            .or(
              `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company_name.ilike.%${query}%`
            )
            .limit(5);

          // Search tasks
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, due_date, status, type')
            .ilike('title', `%${query}%`)
            .limit(5);

          setSearchResults({
            leads: (leads || []) as Lead[],
            tasks: (tasks || []) as Task[],
          });
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      debouncedSearch();
    },
    [supabase]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(true);
    performSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ leads: [], tasks: [] });
    setShowResults(false);
  };

  // Handle clicking outside search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchNotifications]);

  const markAsRead = async (id: string, relatedId?: string, type?: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Optional: Navigate to related item
      if (relatedId) {
        if (type === 'lead') router.push(`/leads/${relatedId}`);
        if (type === 'task') router.push(`/tasks?id=${relatedId}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const hasResults =
    searchResults.leads.length > 0 || searchResults.tasks.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl search-container">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search leads, tasks..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              className="pl-10 pr-10 h-10 bg-accent/50 border-border focus:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-lg border border-border max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                ) : hasResults ? (
                  <div>
                    {/* Leads Results */}
                    {searchResults.leads.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-accent border-b border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            Leads
                          </p>
                        </div>
                        {searchResults.leads.map((lead) => (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            onClick={clearSearch}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {lead.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {lead.company_name || lead.email || lead.phone}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {lead.status}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Tasks Results */}
                    {searchResults.tasks.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-accent border-b border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                            <CheckSquare className="w-3 h-3" />
                            Tasks
                          </p>
                        </div>
                        {searchResults.tasks.map((task) => (
                          <Link
                            key={task.id}
                            href={`/tasks?id=${task.id}`}
                            onClick={clearSearch}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckSquare className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due: {task.due_date}
                              </p>
                            </div>
                            <Badge
                              variant={
                                task.status === 'completed'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {task.status}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* View All Link */}
                    <div className="p-2 border-t border-border">
                      <Link
                        href={`/leads?search=${encodeURIComponent(searchQuery)}`}
                        onClick={clearSearch}
                        className="block text-center text-sm text-primary hover:text-primary/80 py-1"
                      >
                        View all results →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Quick Add Button */}
          <Link href="/leads/new">
            <Button size="sm" className="hidden sm:flex gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </Button>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in fade-in zoom-in">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between py-2 px-3">
                <span className="font-semibold">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  <>
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={() => markAsRead(notification.id, notification.related_id, notification.type)}
                        className={cn(
                          'flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors',
                          !notification.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent'
                        )}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm leading-tight mb-1",
                              !notification.read ? "font-semibold" : "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" title="Unread" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center text-xs text-primary font-medium p-2"
                      onClick={() => router.push('/notifications')}
                    >
                      View all notifications
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted/30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}