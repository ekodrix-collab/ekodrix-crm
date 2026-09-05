'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Project, Client } from '@/types/hub';
import { getProjectsAction } from '@/lib/actions/projects';
import { getClientsAction } from '@/lib/actions/clients';
import { ProjectCard } from '@/components/projects/project-card';
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
  FolderGit2,
  Plus,
  Search,
  Loader2,
  Key,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusTab, setStatusTab] = useState<string>(initialStatus);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [openModal, setOpenModal] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    const [{ projects: pData }, { clients: cData }] = await Promise.all([
      getProjectsAction({
        status: statusTab !== 'risk' ? statusTab : undefined,
        clientId: selectedClientId !== 'all' ? selectedClientId : undefined,
        search: searchQuery,
      }),
      getClientsAction(),
    ]);

    let list = pData;
    if (statusTab === 'risk') {
      list = list.filter((p) => p.health?.status === 'risk' || p.health?.status === 'warning');
    }

    setProjects(list);
    setClients(cData);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [statusTab, selectedClientId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const tabs = [
    { key: 'all', label: 'All Projects' },
    { key: 'active', label: '🚀 Active' },
    { key: 'risk', label: '🔴 At Risk (Missing Vaults)' },
    { key: 'completed', label: '🏁 Completed' },
    { key: 'planning', label: '📝 Planning' },
    { key: 'on_hold', label: '⏸️ On Hold' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-primary" />
            Projects & Credential Vaults
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Central vault repository for website admin, business emails, GitHub, Vercel, servers, and AMC.
          </p>
        </div>

        <Button
          onClick={() => setOpenModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          + New Project
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
              placeholder="Search projects by name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Button type="submit" variant="secondary" className="text-xs font-semibold">
            Search
          </Button>
        </form>

        <div className="w-full sm:w-64">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter by Client" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading projects and vault health...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Key className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No projects found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? `No projects matching "${searchQuery}".`
              : 'Create your first project to initialize credentials vault and tracking.'}
          </p>
          <Button onClick={() => setOpenModal(true)} size="sm" className="mt-2 gap-1.5">
            <Plus className="w-4 h-4" />
            Add First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectFormModal
        open={openModal}
        onOpenChange={(op) => {
          setOpenModal(op);
          if (!op) fetchProjects();
        }}
        clients={clients}
      />
    </div>
  );
}
