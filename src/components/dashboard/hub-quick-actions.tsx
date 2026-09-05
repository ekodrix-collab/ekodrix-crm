'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserCheck, MessageSquareText, FolderGit2 } from 'lucide-react';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { FollowupFormModal } from '@/components/followups/followup-form-modal';
import { ProjectFormModal } from '@/components/projects/project-form-modal';
import { Client } from '@/types/hub';

interface HubQuickActionsProps {
  clients: Client[];
  users: { id: string; name: string }[];
}

export function HubQuickActions({ clients, users }: HubQuickActionsProps) {
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openFollowupModal, setOpenFollowupModal] = useState(false);
  const [openProjectModal, setOpenProjectModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          onClick={() => setOpenClientModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-semibold text-xs sm:text-sm"
        >
          <UserCheck className="w-4 h-4" />
          + New Enquiry
        </Button>

        <Button
          onClick={() => setOpenFollowupModal(true)}
          variant="outline"
          className="border-primary/40 hover:bg-primary/5 text-primary gap-1.5 font-semibold text-xs sm:text-sm"
        >
          <MessageSquareText className="w-4 h-4" />
          + New Follow-up
        </Button>

        <Button
          onClick={() => setOpenProjectModal(true)}
          variant="outline"
          className="border-border hover:bg-accent gap-1.5 font-semibold text-xs sm:text-sm"
        >
          <FolderGit2 className="w-4 h-4" />
          + New Project
        </Button>
      </div>

      <ClientFormModal
        open={openClientModal}
        onOpenChange={setOpenClientModal}
        users={users}
      />

      <FollowupFormModal
        open={openFollowupModal}
        onOpenChange={setOpenFollowupModal}
        clients={clients}
      />

      <ProjectFormModal
        open={openProjectModal}
        onOpenChange={setOpenProjectModal}
        clients={clients}
        users={users}
      />
    </>
  );
}
