'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PRIORITIES } from '@/lib/constants';
import type { Lead } from '@/types';

interface LeadTableProps {
  leads: Lead[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export function LeadTable({
  leads,
  totalCount,
  currentPage,
  pageSize,
}: LeadTableProps) {
  const router = useRouter();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/50 dark:bg-accent/20">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.length === leads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Lead</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                <TableHead className="hidden md:table-cell">Follow-up</TableHead>
                <TableHead className="w-12"></TableHead>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>

                  {/* Lead Info */}
                  <TableCell>
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
                      <div className="min-w-0">
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
                            <Building className="w-3 h-3" />
                            {lead.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      {lead.phone && (
                        <p className="text-sm text-foreground/80">
                          {formatPhoneNumber(lead.phone)}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {lead.email}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Source */}
                  <TableCell className="hidden lg:table-cell">
                    <LeadSourceIcon source={lead.source} showLabel />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <LeadStatusBadge status={lead.status} size="sm" />
                  </TableCell>

                  {/* Assigned */}
                  <TableCell className="hidden lg:table-cell">
                    {lead.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={lead.assigned_user.avatar_url || undefined}
                          />
                          <AvatarFallback
                            className={cn(
                              getAvatarColor(lead.assigned_user.name),
                              'text-white text-[10px]'
                            )}
                          >
                            {getInitials(lead.assigned_user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground/80">
                          {lead.assigned_user.name.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Follow-up */}
                  <TableCell className="hidden md:table-cell">
                    {lead.next_follow_up_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground/60" />
                        <span
                          className={cn(
                            new Date(lead.next_follow_up_date) < new Date()
                              ? 'text-destructive font-medium'
                              : 'text-foreground/80'
                          )}
                        >
                          {formatDate(lead.next_follow_up_date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">Not set</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
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