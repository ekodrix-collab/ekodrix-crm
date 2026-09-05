'use client';

import { useState, useEffect } from 'react';
import { Followup, Client } from '@/types/hub';
import { getFollowupsAction } from '@/lib/actions/followups';
import { getClientsAction } from '@/lib/actions/clients';
import { FollowupCard } from '@/components/followups/followup-card';
import { FollowupFormModal } from '@/components/followups/followup-form-modal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquareText,
  Plus,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<
    'today' | 'tomorrow' | 'this_week' | 'overdue' | 'all' | 'completed'
  >('today');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);

  const fetchFollowups = async () => {
    setLoading(true);
    const [{ followups: fData }, { clients: cData }] = await Promise.all([
      getFollowupsAction({
        tab: activeTab,
        clientId: selectedClientId !== 'all' ? selectedClientId : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
      }),
      getClientsAction(),
    ]);

    setFollowups(fData);
    setClients(cData);
    setLoading(false);
  };

  useEffect(() => {
    fetchFollowups();
  }, [activeTab, selectedClientId, selectedType]);

  const tabs: { key: typeof activeTab; label: string; icon: any; color?: string }[] = [
    { key: 'today', label: '📅 Today', icon: Clock },
    { key: 'tomorrow', label: '🌅 Tomorrow', icon: Calendar },
    { key: 'this_week', label: '🗓️ This Week', icon: Calendar },
    { key: 'overdue', label: '🚨 Overdue', icon: AlertCircle, color: 'text-red-600' },
    { key: 'all', label: '📁 All Follow-ups', icon: MessageSquareText },
    { key: 'completed', label: '✅ Completed', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <MessageSquareText className="w-7 h-7 text-primary" />
            Follow-ups & Discussion Cockpit
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track what was discussed with clients, what they said, and our promises.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingFollowup(null);
            setOpenModal(true);
          }}
          className="bg-primary hover:bg-primary/90 font-semibold gap-1.5 shadow-sm text-primary-foreground"
        >
          <Plus className="w-4 h-4" />
          + Log New Follow-up
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/80 custom-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-64">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Client" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Clients & Enquiries</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Interaction Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="call">📞 Phone Call</SelectItem>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
              <SelectItem value="meeting">👥 Meeting</SelectItem>
              <SelectItem value="video_call">🎥 Video Call</SelectItem>
              <SelectItem value="email">✉️ Email</SelectItem>
              <SelectItem value="visit">🏢 Client Visit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Follow-ups List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading follow-ups...</p>
        </div>
      ) : followups.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No follow-ups found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {activeTab === 'overdue'
              ? 'Great job! You have zero overdue client follow-ups.'
              : activeTab === 'today'
              ? 'No pending client interactions due today.'
              : 'Log your calls, WhatsApp discussions, and next commitments.'}
          </p>
          <Button
            onClick={() => {
              setEditingFollowup(null);
              setOpenModal(true);
            }}
            size="sm"
            className="mt-2 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Log First Follow-up
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {followups.map((f) => (
            <FollowupCard
              key={f.id}
              followup={f}
              onEdit={(followup) => {
                setEditingFollowup(followup);
                setOpenModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <FollowupFormModal
        open={openModal}
        onOpenChange={(op) => {
          setOpenModal(op);
          if (!op) {
            setEditingFollowup(null);
            fetchFollowups();
          }
        }}
        clients={clients}
        followup={editingFollowup}
      />
    </div>
  );
}
