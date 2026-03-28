'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Ticket {
  id: string;
  ticketNumber: string;
  rowNumber: number;
  seatNumber: number;
}

interface LineItemWithTickets {
  id: string;
  quantity: number | null;
  pricePerTicket: string | null;
  performance?: { show?: { title?: string | null } | null; date?: Date | string | null } | null;
  tickets?: Ticket[];
}

interface RefundOrderButtonProps {
  orderId: string;
  totalAmount: string;
  lineItems: LineItemWithTickets[];
}

export function RefundOrderButton({ orderId, totalAmount, lineItems }: RefundOrderButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(totalAmount);
  const [description, setDescription] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(
    () => new Set(lineItems.flatMap((li) => (li.tickets ?? []).map((t) => t.id))),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allTickets = lineItems.flatMap((li) =>
    (li.tickets ?? []).map((t) => ({
      ...t,
      showTitle: li.performance?.show?.title ?? 'Onbekende voorstelling',
    })),
  );

  function toggleTicket(id: string) {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        ticketIdsToCancel: Array.from(selectedTicketIds),
        description: description || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Er is iets misgegaan');
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
          Terugbetalen
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Terugbetaling aanmaken</DialogTitle>
          <DialogDescription>
            Vul het bedrag in en selecteer de tickets die geannuleerd moeten worden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Bedrag (€)</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={totalAmount}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value).toFixed(2))}
            />
            <p className="text-xs text-zinc-500">Maximaal €{totalAmount}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="refund-description">Reden (optioneel)</Label>
            <Input
              id="refund-description"
              placeholder="Bijv. voorstelling geannuleerd"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {allTickets.length > 0 && (
            <div className="space-y-2">
              <Label>Tickets annuleren</Label>
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {allTickets.map((ticket) => (
                  <label
                    key={ticket.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-50"
                  >
                    <Checkbox
                      checked={selectedTicketIds.has(ticket.id)}
                      onCheckedChange={() => toggleTicket(ticket.id)}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{ticket.ticketNumber}</span>
                      <span className="text-zinc-500 ml-2">
                        Rij {ticket.rowNumber}, Stoel {ticket.seatNumber}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                {selectedTicketIds.size} van {allTickets.length} ticket(s) geselecteerd voor
                annulering
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuleren
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Bezig...' : 'Terugbetaling bevestigen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
