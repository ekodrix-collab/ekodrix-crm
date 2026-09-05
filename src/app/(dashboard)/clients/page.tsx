'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Client, ClientStatus, ClientSource } from '@/types/hub';
import { getClientsAction } from '@/lib/actions/clients';
import { ClientCard } from '@/components/clients/client-card';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { FollowupFormModal } from '@/components/followups/followup-form-modal';
import { ProjectFormModal } from '@/components/projects/project-form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Sparkles,
  Loader2,
  Users,
} from 'lucide-react';

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>(initialStatus);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [openClientModal, setOpenClientModal] = useState(false);
  const [selectedClientForFollowup, setSelectedClientForFollowup] = useState<Client | null>(null);
  const [selectedClientForProject, setSelectedClientForProject] = useState<Client | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    const { clients: data } = await getClientsAction({
      status: statusTab,
      source: sourceFilter,
      search: searchQuery,
    });
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [statusTab, sourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const tabs = [
    { key: 'all', label: 'All Clients & Enquiries' },
    { key: 'enquiry', label: '🆕 Enquiries' },
    { key: 'discussion', label: '💬 Discussion' },
    { key: 'confirmed', label: '✅ Confirmed' },
    { key: 'active', label: '🚀 Active' },
    { key: 'completed', label: '🏁 Completed' },
    { key: 'lost', label: '❌ Lost' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-primary" />
            Clients & Enquiries
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage incoming prospects, requirements, deliverables promised, and active clients.
          </p>
        </div>

        <Button
          onClick={() => setOpenClientModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client / Enquiry
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/80 custom-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              statusTab === t.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search by client name, company, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Button type="submit" variant="secondary" className="text-xs font-semibold">
            Search
          </Button>
        </form>

        <div className="w-full sm:w-48">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="walk_in">Walk-in</SelectItem>
              <SelectItem value="call">Call</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid of Clients */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No clients or enquiries found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? `No records matching "${searchQuery}". Try adjusting your filters.`
              : 'Start by capturing your first client enquiry with deliverables and contact info.'}
          </p>
          <Button
            onClick={() => setOpenClientModal(true)}
            size="sm"
            className="mt-2 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add First Enquiry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onOpenFollowup={(c) => setSelectedClientForFollowup(c)}
              onOpenNewProject={(c) => setSelectedClientForProject(c)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ClientFormModal
        open={openClientModal}
        onOpenChange={(op) => {
          setOpenClientModal(op);
          if (!op) fetchClients();
        }}
      />

      {selectedClientForFollowup && (
        <FollowupFormModal
          open={!!selectedClientForFollowup}
          onOpenChange={(op) => {
            if (!op) setSelectedClientForFollowup(null);
            fetchClients();
          }}
          defaultClient={selectedClientForFollowup}
        />
      )}

      {selectedClientForProject && (
        <ProjectFormModal
          open={!!selectedClientForProject}
          onOpenChange={(op) => {
            if (!op) setSelectedClientForProject(null);
            fetchClients();
          }}
          defaultClient={selectedClientForProject}
        />
      )}
    </div>
  );
}
