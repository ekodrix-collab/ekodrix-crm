'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2, Sparkles, IndianRupee, Calendar } from 'lucide-react';
import { saveClientAction } from '@/lib/actions/clients';
import { Client, PromisedItem, ClientSource, ClientStatus } from '@/types/hub';

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  users?: { id: string; name: string }[];
}

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  users = [],
}: ClientFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(client?.name || '');
  const [company, setCompany] = useState(client?.company || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [whatsapp, setWhatsapp] = useState(client?.whatsapp || client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [source, setSource] = useState<ClientSource>(client?.source || 'website');
  const [status, setStatus] = useState<ClientStatus>(client?.status || 'enquiry');
  const [requirements, setRequirements] = useState(client?.requirements || '');
  const [notes, setNotes] = useState(client?.notes || '');
  const [assignedTo, setAssignedTo] = useState(client?.assigned_to || '');

  // Promised Items List
  const [promisedItems, setPromisedItems] = useState<PromisedItem[]>(
    client?.promised_items && client.promised_items.length > 0
      ? client.promised_items
      : [{ item: '', deadline: '', estimated_cost: 0, status: 'discussion' }]
  );

  // Initial Follow-up info (only when creating new client)
  const [initialNotes, setInitialNotes] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');

  const addPromisedItem = () => {
    setPromisedItems([
      ...promisedItems,
      { item: '', deadline: '', estimated_cost: 0, status: 'discussion' },
    ]);
  };

  const updatePromisedItem = (index: number, field: keyof PromisedItem, value: any) => {
    const updated = [...promisedItems];
    updated[index] = { ...updated[index], [field]: value };
    setPromisedItems(updated);
  };

  const removePromisedItem = (index: number) => {
    setPromisedItems(promisedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client or Enquiry Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    // Filter valid promised items
    const validPromisedItems = promisedItems.filter((p) => p.item.trim() !== '');

    const res = await saveClientAction({
      id: client?.id,
      name: name.trim(),
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || phone.trim() || undefined,
      email: email.trim() || undefined,
      source,
      status,
      requirements: requirements.trim() || undefined,
      promised_items: validPromisedItems,
      notes: notes.trim() || undefined,
      assigned_to: assignedTo || undefined,
      initial_followup_notes: !client ? initialNotes.trim() || undefined : undefined,
      next_followup_date: !client ? nextFollowupDate || undefined : undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onOpenChange(false);
      router.refresh();
      if (!client && res.clientId) {
        router.push(`/clients/${res.clientId}`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="w-5 h-5 text-primary" />
            {client ? 'Edit Client / Enquiry' : '✨ New Enquiry / Client'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              1. Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Client / Contact Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sabu John / Amruth Dairy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company">Company / Business Name</Label>
                <Input
                  id="company"
                  placeholder="e.g. Amruth Milk Products Pvt Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!whatsapp) setWhatsapp(e.target.value);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  placeholder="+91 98765 43210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ENQUIRY DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              2. Pipeline & Requirements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Pipeline Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as ClientStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enquiry">🆕 Enquiry</SelectItem>
                    <SelectItem value="discussion">💬 In Discussion</SelectItem>
                    <SelectItem value="confirmed">✅ Confirmed Client</SelectItem>
                    <SelectItem value="active">🚀 Active Client</SelectItem>
                    <SelectItem value="completed">🏁 Completed</SelectItem>
                    <SelectItem value="lost">❌ Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Lead Source</Label>
                <Select value={source} onValueChange={(val) => setSource(val as ClientSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="call">Direct Call</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="requirements">What do they want? (Requirements)</Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g. Wants dairy management app with live delivery tracking and e-commerce portal..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* PROMISED ITEMS BUILDER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Promised / Discussed Items & Deliverables
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPromisedItem}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {promisedItems.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2.5 relative group"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Item name (e.g. E-commerce website / Mobile app / SEO setup)"
                      value={item.item}
                      onChange={(e) => updatePromisedItem(index, 'item', e.target.value)}
                      className="flex-1 text-sm bg-background"
                    />
                    {promisedItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePromisedItem(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Est. Cost (₹)"
                        value={item.estimated_cost || ''}
                        onChange={(e) =>
                          updatePromisedItem(index, 'estimated_cost', Number(e.target.value))
                        }
                        className="text-xs bg-background"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={item.deadline || ''}
                        onChange={(e) => updatePromisedItem(index, 'deadline', e.target.value)}
                        className="text-xs bg-background"
                      />
                    </div>

                    <Select
                      value={item.status}
                      onValueChange={(val) => updatePromisedItem(index, 'status', val)}
                    >
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INITIAL NOTES & NEXT FOLLOW-UP (Only on create) */}
          {!client && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                4. Initial Contact & Next Action
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="initialNotes">What was discussed in first contact?</Label>
                  <Textarea
                    id="initialNotes"
                    placeholder="e.g. Spoke over phone. Client needs proposal sent by tomorrow afternoon..."
                    value={initialNotes}
                    onChange={(e) => setInitialNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nextDate">Next Follow-up Date</Label>
                  <Input
                    id="nextDate"
                    type="date"
                    value={nextFollowupDate}
                    onChange={(e) => setNextFollowupDate(e.target.value)}
                  />
                </div>

                {users.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Assign to Team Member</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {client ? 'Update Client' : 'Save Client & Enquiry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
