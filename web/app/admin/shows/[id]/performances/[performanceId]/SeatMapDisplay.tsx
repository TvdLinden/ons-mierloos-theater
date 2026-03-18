'use client';

import { useState, useMemo } from 'react';
import { SeatMap, BlockedSeatInfo } from '@/components/SeatMap';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Lock, Save, X, AlertCircle } from 'lucide-react';
import { saveBlockedSeatsAction, BlockSeatInput } from './actions';

export interface SeatInfo {
  customerName: string;
  orderId: string;
  orderStatus: string;
}

export interface InitialBlockedSeat {
  rowNumber: number;
  seatNumber: number;
  type: 'reserved' | 'unavailable';
  reason?: string | null;
}

interface SeatMapDisplayProps {
  rows: number;
  seatsPerRow: number;
  reservedSeats: string[];
  wheelchairSeats: string[];
  seatInfo?: Record<string, SeatInfo>;
  performanceId: string;
  showId: string;
  initialBlockedSeats: InitialBlockedSeat[];
}

type PendingChange = { type: 'reserved' | 'unavailable'; reason: string } | null;

export function SeatMapDisplay({
  rows,
  seatsPerRow,
  reservedSeats,
  wheelchairSeats,
  seatInfo,
  performanceId,
  showId,
  initialBlockedSeats,
}: SeatMapDisplayProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [selectedSeat, setSelectedSeat] = useState<{ rowIndex: number; seatNumber: number } | null>(null);
  const [dialogType, setDialogType] = useState<'reserved' | 'unavailable'>('reserved');
  const [dialogReason, setDialogReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reservedSet = useMemo(() => new Set(reservedSeats), [reservedSeats]);
  const wheelchairSet = useMemo(() => new Set(wheelchairSeats), [wheelchairSeats]);

  // Build effective blocked seats: initial state + pending changes
  const effectiveBlocked = useMemo(() => {
    const map = new Map<string, BlockedSeatInfo>();
    for (const b of initialBlockedSeats) {
      const seatId = `${b.rowNumber - 1}-${b.seatNumber}`;
      map.set(seatId, { type: b.type, reason: b.reason });
    }
    for (const [seatId, change] of pendingChanges) {
      if (change === null) {
        map.delete(seatId);
      } else {
        map.set(seatId, { type: change.type, reason: change.reason || null });
      }
    }
    return map;
  }, [initialBlockedSeats, pendingChanges]);

  const pendingCount = pendingChanges.size;

  const handleBlockSeat = (rowIndex: number, seatNumber: number) => {
    const seatId = `${rowIndex}-${seatNumber}`;
    const current = effectiveBlocked.get(seatId);
    setSelectedSeat({ rowIndex, seatNumber });
    setDialogType(current?.type ?? 'reserved');
    setDialogReason((current?.reason as string) ?? '');
  };

  const handleDialogSave = () => {
    if (!selectedSeat) return;
    const seatId = `${selectedSeat.rowIndex}-${selectedSeat.seatNumber}`;
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(seatId, { type: dialogType, reason: dialogReason });
      return next;
    });
    setSelectedSeat(null);
  };

  const handleDialogUnblock = () => {
    if (!selectedSeat) return;
    const seatId = `${selectedSeat.rowIndex}-${selectedSeat.seatNumber}`;
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(seatId, null);
      return next;
    });
    setSelectedSeat(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const seats: BlockSeatInput[] = Array.from(effectiveBlocked.entries()).map(([seatId, info]) => {
      const [rowIndexStr, seatNumberStr] = seatId.split('-');
      return {
        rowNumber: parseInt(rowIndexStr) + 1,
        seatNumber: parseInt(seatNumberStr),
        type: info.type,
        reason: (info.reason as string) ?? null,
      };
    });

    const result = await saveBlockedSeatsAction(performanceId, showId, seats);

    if (!result.success) {
      setError(result.error ?? 'Er is een fout opgetreden.');
    } else {
      setPendingChanges(new Map());
      setIsEditMode(false);
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setPendingChanges(new Map());
    setIsEditMode(false);
    setError(null);
  };

  const selectedSeatIsBlocked = selectedSeat
    ? effectiveBlocked.has(`${selectedSeat.rowIndex}-${selectedSeat.seatNumber}`)
    : false;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
              <Lock className="mr-2 h-4 w-4" />
              Plaatsen blokkeren
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Opslaan...' : `Opslaan${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Annuleren
              </Button>
            </>
          )}
        </div>
        {isEditMode && (
          <p className="text-sm text-muted-foreground">
            Klik op een stoel om deze te blokkeren of bewerken
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SeatMap
        rows={rows}
        seatsPerRow={seatsPerRow}
        reservedSeats={reservedSet}
        wheelchairReservations={wheelchairSet}
        lastAssignment={null}
        onToggleSeat={() => {}}
        onToggleWheelchair={() => {}}
        seatInfo={seatInfo}
        blockedSeats={effectiveBlocked}
        onBlockSeat={isEditMode ? handleBlockSeat : undefined}
        readonly={!isEditMode}
      />

      {/* Block / edit seat dialog */}
      <Dialog open={!!selectedSeat} onOpenChange={(open) => !open && setSelectedSeat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedSeatIsBlocked ? 'Geblokkeerde stoel bewerken' : 'Stoel blokkeren'}
              {selectedSeat && (
                <span className="font-normal text-muted-foreground ml-2 text-sm">
                  — Rij {selectedSeat.rowIndex + 1}, nr. {selectedSeat.seatNumber}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type blokkering</Label>
              <RadioGroup
                value={dialogType}
                onValueChange={(v) => setDialogType(v as 'reserved' | 'unavailable')}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="reserved" id="type-reserved" />
                  <Label htmlFor="type-reserved" className="cursor-pointer font-normal">
                    Gereserveerd
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="unavailable" id="type-unavailable" />
                  <Label htmlFor="type-unavailable" className="cursor-pointer font-normal">
                    Niet beschikbaar
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reden (optioneel)</Label>
              <Input
                id="reason"
                placeholder="VIP, kapotte stoel, technici..."
                value={dialogReason}
                onChange={(e) => setDialogReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedSeatIsBlocked && (
              <Button variant="outline" onClick={handleDialogUnblock} className="mr-auto">
                Deblokkeren
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedSeat(null)}>
              Annuleren
            </Button>
            <Button onClick={handleDialogSave}>
              {selectedSeatIsBlocked ? 'Bijwerken' : 'Blokkeren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
