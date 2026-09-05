'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Client, Project, Followup } from '@/types/hub';
import { getClientByIdAction } from '@/lib/actions/clients';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { FollowupFormModal } from '@/components/followups/followup-form-modal';
import { FollowupCard } from '@/components/followups/followup-card';
import { ProjectFormModal } from '@/components/projects/project-form-modal';
import { ProjectCard } from '@/components/projects/project-card';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FolderGit2,
  Edit2,
  Plus,
  Loader2,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openFollowupModal, setOpenFollowupModal] = useState(false);
  const [openProjectModal, setOpenProjectModal] = useState(false);

  const fetchClientData = async () => {
    if (!clientId) return;
    setLoading(true);
    const res = await getClientByIdAction(clientId);
    if (res.client) {
      setClient(res.client);
      setProjects((res.projects as Project[]) || []);
      setFollowups((res.followups as Followup[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-base font-semibold text-foreground">Client record not found</p>
        <Button asChild variant="outline">
          <Link href="/clients">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
          </Link>
        </Button>
      </div>
    );
  }

  const promisedItems = client.promised_items || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Top Navigation & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/clients">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {client.name}
            </h1>
            <Badge variant="outline" className="capitalize text-xs font-semibold px-2 py-0.5">
              {client.status}
            </Badge>
          </div>
          {client.company && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 pl-8 font-medium">
              <Building className="w-3.5 h-3.5" />
              {client.company} • Source: <span className="capitalize text-foreground font-semibold">{client.source}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setOpenFollowupModal(true)}
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Clock className="w-3.5 h-3.5 text-primary" />
            + Add Follow-up
          </Button>

          <Button
            onClick={() => setOpenProjectModal(true)}
            size="sm"
            className="h-8 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            + New Project
          </Button>

          <Button
            onClick={() => setOpenEditModal(true)}
            size="sm"
            variant="secondary"
            className="h-8 text-xs gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Contact Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-sm text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Phone & WhatsApp:</span>
          <div className="flex items-center gap-2">
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="font-semibold text-foreground hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" /> {client.phone}
              </a>
            ) : <span className="text-muted-foreground">Not provided</span>}
            {client.whatsapp && (
              <a
                href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Email Address:</span>
          {client.email ? (
            <a href={`mailto:${client.email}`} className="font-semibold text-foreground hover:underline flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 text-blue-500" /> {client.email}
            </a>
          ) : <span className="text-muted-foreground block">Not provided</span>}
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Enquiry Date:</span>
          <p className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-500" />
            {client.enquiry_date || client.created_at?.split('T')[0] || 'N/A'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Confirmed Date:</span>
          <p className="font-semibold text-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {client.confirmed_date || 'Not confirmed yet'}
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border">
          <TabsTrigger value="overview" className="text-xs sm:text-sm font-semibold">
            📋 Overview & Promises ({promisedItems.length})
          </TabsTrigger>
          <TabsTrigger value="followups" className="text-xs sm:text-sm font-semibold">
            💬 Follow-ups & Discussions ({followups.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs sm:text-sm font-semibold">
            📁 Projects & Vaults ({projects.length})
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Requirements Card */}
          {client.requirements && (
            <div className="p-4 bg-muted/30 border rounded-xl space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Client Requirements (What they want)
              </h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {client.requirements}
              </p>
            </div>
          )}

          {/* Promised Items Deliverables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                ⭐ Promised Deliverables & Agreements
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenEditModal(true)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add / Edit Promises
              </Button>
            </div>

            {promisedItems.length === 0 ? (
              <div className="p-8 text-center bg-card border rounded-xl space-y-2">
                <p className="text-xs text-muted-foreground">No specific promised deliverables recorded yet.</p>
                <Button size="sm" variant="outline" onClick={() => setOpenEditModal(true)} className="text-xs">
                  Record Promised Items
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {promisedItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 bg-card border border-border/80 rounded-xl space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">{item.item}</span>
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                      {item.estimated_cost ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{item.estimated_cost.toLocaleString('en-IN')}
                        </span>
                      ) : <span />}
                      {item.deadline && (
                        <span>Deadline: {item.deadline}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="p-4 bg-card border rounded-xl space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Overall Client Notes
              </h3>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {client.notes}
              </p>
            </div>
          )}
        </TabsContent>

        {/* FOLLOW-UPS TAB */}
        <TabsContent value="followups" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Discussions & Commitments History
            </h3>
            <Button
              onClick={() => setOpenFollowupModal(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> + New Follow-up
            </Button>
          </div>

          {followups.length === 0 ? (
            <div className="py-12 text-center bg-card border rounded-xl space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No follow-ups recorded yet</p>
              <p className="text-xs text-muted-foreground">
                Keep a clear log of what was discussed, what client said, and what you promised.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followups.map((f) => (
                <FollowupCard key={f.id} followup={f} showClientLink={false} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Client Projects & Vaults
            </h3>
            <Button
              onClick={() => setOpenProjectModal(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" /> + New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="py-12 text-center bg-card border rounded-xl space-y-2">
              <FolderGit2 className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No projects created yet for this client</p>
              <p className="text-xs text-muted-foreground">
                Create a project to initialize credential vaults, website admin logins, domain expiry, and AMC.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ClientFormModal
        open={openEditModal}
        onOpenChange={(op) => {
          setOpenEditModal(op);
          if (!op) fetchClientData();
        }}
        client={client}
      />

      <FollowupFormModal
        open={openFollowupModal}
        onOpenChange={(op) => {
          setOpenFollowupModal(op);
          if (!op) fetchClientData();
        }}
        defaultClient={client}
      />

      <ProjectFormModal
        open={openProjectModal}
        onOpenChange={(op) => {
          setOpenProjectModal(op);
          if (!op) fetchClientData();
        }}
        defaultClient={client}
      />
    </div>
  );
}
