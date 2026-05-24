'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { LEAD_STATUSES } from '@/lib/constants';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadSourceIcon } from './lead-source-icon';
import {
  MoreHorizontal,
  Phone,
  MessageCircle,
  Mail,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Building,
  Calendar,
  Instagram,
  CheckCircle2,
} from 'lucide-react';
import {
  cn,
  formatDate,
  formatPhoneNumber,
  getInitials,
  getAvatarColor,
  openWhatsApp,
  openPhoneDialer,
  openEmailClient,
} from '@/lib/utils';
import { PRIORITIES, COUNTRY_CODE_MAP, BUDGET_RANGES } from '@/lib/constants';
import ReactCountryFlag from 'react-country-flag';
import type { Lead } from '@/types';

interface LeadTableProps {
  leads: Lead[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  users?: any[];
  onPageChange?: (page: number) => void;
}

export function LeadTable({
  leads,
  totalCount,
  currentPage,
  pageSize,
  users: initialUsers = [],
}: LeadTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>(initialUsers);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUsers(initialUsers);
      return;
    }
    const fetchUsers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .order('name');
      console.log('--- LEAD TABLE FETCH USERS DATA ---', data);
      if (error) console.error('--- LEAD TABLE FETCH USERS ERROR ---', error);
      setUsers(data || []);
    };
    fetchUsers();
  }, [initialUsers]);

  // Quick inline update using PUT api
  const handleInlineUpdate = async (leadId: string, fields: Partial<Lead>) => {
    setUpdatingLeadId(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      toast({
        title: 'Saved Successfully! ⚡',
        description: 'Lead details updated instantly.',
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Could not save change',
        variant: 'destructive',
      });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // Helper to calculate soft actionable categories for follow-ups
  const getFollowUpStatus = (dateStr?: string | null, isCompleted?: boolean) => {
    if (isCompleted) {
      return {
        label: 'Completed',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400',
      };
    }
    if (!dateStr) {
      return {
        label: 'No Follow-up',
        class: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return {
        label: 'Today',
        class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 font-semibold',
      };
    }
    if (date.getTime() === tomorrow.getTime()) {
      return {
        label: 'Tomorrow',
        class: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400',
      };
    }
    if (date.getTime() < today.getTime()) {
      return {
        label: 'Overdue',
        class: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 font-semibold',
      };
    }
    return {
      label: 'Upcoming',
      class: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400',
    };
  };

  const currentBudget = searchParams.get('budget') || 'all';
  const showBudgetColumn = currentBudget !== 'all';

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Handle page navigation
  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`/leads?${params.toString()}`);
  };

  // Toggle lead selection
  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle all selection
  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-muted-foreground/60" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No leads found
        </h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your filters or add a new lead.
        </p>
        <Link href="/leads/new">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Lead
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-accent/50 dark:bg-accent/20">
                <TableHead className="w-12 whitespace-nowrap">
                  <Checkbox
                    checked={selectedLeads.length === leads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="whitespace-nowrap">Lead</TableHead>
                <TableHead className="whitespace-nowrap">Location</TableHead>
                <TableHead className="whitespace-nowrap">Contact</TableHead>
                <TableHead className="whitespace-nowrap">Source</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                {showBudgetColumn && <TableHead className="whitespace-nowrap">Budget</TableHead>}
                <TableHead className="whitespace-nowrap">Assigned</TableHead>
                <TableHead className="whitespace-nowrap">Follow-up</TableHead>
                <TableHead className="whitespace-nowrap">Created Date</TableHead>
                <TableHead className="whitespace-nowrap">Updated Date</TableHead>
                <TableHead className="w-12 whitespace-nowrap"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-accent/30"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  {/* Checkbox */}
                  <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>

                  {/* Lead Info */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0 shadow-sm border border-border bg-green-400 flex items-center justify-center">
                        <AvatarFallback
                          className={cn(
                            getAvatarColor(lead.name),
                            'text-white font-bold text-sm w-full h-full flex items-center justify-center'
                          )}
                        >
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium truncate text-slate-900 dark:text-slate-100">
                            {lead.name}
                          </p>
                          {lead.priority === 'hot' && (
                            <span className="text-sm">🔥</span>
                          )}
                        </div>
                        {lead.company_name && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Building className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.company_name}</span>
                          </p>
                        )}
                        {lead.instagram_handle && (
                          <p className="text-[10px] text-pink-500 truncate flex items-center gap-1 mt-0.5">
                            <Instagram className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">@{lead.instagram_handle}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    </TableCell>

                  {/* Location */}
                  <TableCell className="whitespace-nowrap">
                    {lead.country && COUNTRY_CODE_MAP[lead.country] ? (
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag
                          countryCode={COUNTRY_CODE_MAP[lead.country]}
                          svg
                          style={{
                            width: '1.2em',
                            height: '1.2em',
                          }}
                          title={COUNTRY_CODE_MAP[lead.country]}
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {COUNTRY_CODE_MAP[lead.country]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">N/A</span>
                    )}
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-1">
                      {lead.phone && (
                        <p className="text-sm text-foreground/80">
                          {formatPhoneNumber(lead.phone)}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {lead.email}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Source */}
                  <TableCell className="whitespace-nowrap">
                    <LeadSourceIcon source={lead.source} showLabel />
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.status}
                      disabled={updatingLeadId === lead.id}
                      onValueChange={(val) => handleInlineUpdate(lead.id, { status: val as any })}
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 p-0 focus:ring-0">
                        <LeadStatusBadge status={lead.status} size="sm" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_STATUSES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", value.color)} />
                              <span>{value.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  {/* Budget */}
                  {showBudgetColumn && (
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {lead.budget_custom ? (
                        new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(lead.budget_custom)
                      ) : lead.budget_range ? (
                        {
                          under_5k: 'Under ₹5k',
                          '5k_15k': '₹5k – ₹15k',
                          '15k_30k': '₹15k – ₹30k',
                          '30k_50k': '₹30k – ₹50k',
                          '50k_100k': '₹50k – ₹100k',
                          over_100k: 'Above ₹100k',
                        }[lead.budget_range] || lead.budget_range
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  )}

                  {/* Assigned */}
                  <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.assigned_to || 'unassigned'}
                      disabled={updatingLeadId === lead.id}
                      onValueChange={(val) =>
                        handleInlineUpdate(lead.id, {
                          assigned_to: val === 'unassigned' ? null : val,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 focus:ring-0 rounded-md inline-flex items-center gap-2">
                        {lead.assigned_user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage
                                src={lead.assigned_user.avatar_url || undefined}
                              />
                              <AvatarFallback
                                className={cn(
                                  getAvatarColor(lead.assigned_user.name),
                                  'text-white text-[10px] w-full h-full flex items-center justify-center font-bold'
                                )}
                              >
                                {getInitials(lead.assigned_user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground/80 truncate max-w-[100px]">
                              {lead.assigned_user.name.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">Unassigned</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-xs text-muted-foreground/60">Unassigned</span>
                        </SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5 flex-shrink-0">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback
                                  className={cn(
                                    getAvatarColor(user.name),
                                    'text-white text-[8px] w-full h-full flex items-center justify-center font-semibold'
                                  )}
                                >
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{user.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Follow-up */}
                  <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            disabled={updatingLeadId === lead.id}
                            className={cn(
                              "px-2.5 py-1 text-xs font-medium rounded-full border transition-all hover:opacity-85 text-left inline-flex items-center gap-1.5",
                              getFollowUpStatus(lead.next_follow_up_date, lead.is_follow_up_completed).class
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5 opacity-80" />
                            <span>
                              {lead.is_follow_up_completed || lead.status === 'converted' || lead.status === 'lost'
                                ? 'Completed'
                                : lead.next_follow_up_date
                                ? formatDate(lead.next_follow_up_date)
                                : 'Set Date'}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4 space-y-4" align="start">
                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-sm text-foreground">Follow-up Settings</h4>
                            <p className="text-xs text-muted-foreground">Manage next follow-up and completion state.</p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-b border-border py-2.5">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Mark Completed</span>
                            <Checkbox
                              checked={!!lead.is_follow_up_completed}
                              onCheckedChange={(checked) =>
                                handleInlineUpdate(lead.id, {
                                  is_follow_up_completed: !!checked,
                                })
                              }
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Next Follow-up Date</label>
                            <input
                              type="date"
                              defaultValue={lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleInlineUpdate(lead.id, {
                                  next_follow_up_date: val ? new Date(val).toISOString() : null,
                                  is_follow_up_completed: false,
                                });
                              }}
                              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:ring-0 dark:text-slate-100"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </TableCell>

                  {/* Updated Date */}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(lead.updated_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/leads/${lead.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/leads/${lead.id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {lead.phone && (
                          <DropdownMenuItem
                            onClick={() => openPhoneDialer(lead.phone!)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </DropdownMenuItem>
                        )}
                        {(lead.whatsapp_number || lead.phone) && (
                          <DropdownMenuItem
                            onClick={() =>
                              openWhatsApp(lead.whatsapp_number || lead.phone!)
                            }
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                        )}
                        {lead.email && (
                          <DropdownMenuItem
                            onClick={() => openEmailClient(lead.email!)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalCount} leads
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}