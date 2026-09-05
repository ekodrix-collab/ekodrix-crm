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
import { IndianRupee, Loader2 } from 'lucide-react';
import { logProjectPaymentAction } from '@/lib/actions/projects';

interface PaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function PaymentFormModal({
  open,
  onOpenChange,
  projectId,
}: PaymentFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await logProjectPaymentAction({
      project_id: projectId,
      amount: Number(amount),
      payment_date: paymentDate,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onOpenChange(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            Add Payment Record
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Payment Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI (GPay / PhonePe)</SelectItem>
                  <SelectItem value="bank_transfer">Bank NEFT / IMPS</SelectItem>
                  <SelectItem value="razorpay">Razorpay / Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="txId">Transaction ID / UTR / Reference</Label>
            <Input
              id="txId"
              placeholder="e.g. UPI/1234567890/AXIS"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Payment Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g. 50% advance received for milestone 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
