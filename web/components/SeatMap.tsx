'use client';

import { Seat } from '@ons-mierloos-theater/shared/utils/seatAssignment';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

export interface SeatInfo {
  customerName: string;
  orderId: string;
  orderStatus?: string;
}

export interface BlockedSeatInfo {
  type: 'reserved' | 'unavailable';
  reason?: string | null;
}

interface SeatMapProps {
  rows: number;
  seatsPerRow: number;
  reservedSeats: Set<string>;
  wheelchairReservations: Set<string>;
  lastAssignment: Seat[] | null;
  onToggleSeat: (rowIndex: number, seatNumber: number) => void;
  onToggleWheelchair: (rowIndex: number, seatNumber: number) => void;
  readonly?: boolean;
  seatInfo?: Record<string, SeatInfo>;
  blockedSeats?: Map<string, BlockedSeatInfo>;
  onBlockSeat?: (rowIndex: number, seatNumber: number) => void;
}

export function SeatMap({
  rows,
  seatsPerRow,
  reservedSeats,
  wheelchairReservations,
  lastAssignment,
  onToggleSeat,
  onToggleWheelchair,
  readonly = false,
  seatInfo,
  blockedSeats,
  onBlockSeat,
}: SeatMapProps) {
  const lastAssignmentSet = lastAssignment
    ? new Set(lastAssignment.map((s) => `${s.rowIndex}-${s.seatNumber}`))
    : null;

  const normalMin = 3;
  const normalMax = seatsPerRow - 2;

  return (
    <div className="space-y-4 overflow-x-auto">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {/* Row label */}
          <div className="w-8 text-right">
            <span className="text-sm font-semibold text-text-primary">Rij {rowIndex + 1}</span>
          </div>

          {/* Seats container with zone indicators */}
          <div className="flex gap-1 relative">
            {/* Seats */}
            {Array.from({ length: seatsPerRow }).map((_, seatIndex) => {
              const seatNumber = seatIndex + 1;
              const seatId = `${rowIndex}-${seatNumber}`;
              const isReserved = reservedSeats.has(seatId);
              const isWheelchair = wheelchairReservations.has(seatId);
              const isLastAssignment = lastAssignmentSet?.has(seatId);
              const blockedInfo = blockedSeats?.get(seatId);
              const isBlocked = !!blockedInfo;

              const isPaid = seatInfo?.[seatId]?.orderStatus === 'paid';
              const isUnpaid = isReserved && !isPaid && seatInfo?.[seatId];

              // Color priority: last-assignment > sold (paid/unpaid) > admin-blocked > available
              let seatColor = 'var(--chart-2)';
              if (isLastAssignment) seatColor = 'var(--chart-4)';
              else if (isUnpaid) seatColor = 'var(--chart-5)';
              else if (isReserved) seatColor = 'var(--chart-3)';
              else if (blockedInfo?.type === 'reserved') seatColor = 'hsl(43 96% 50%)';
              else if (blockedInfo?.type === 'unavailable') seatColor = 'hsl(0 0% 45%)';

              const isBlockMode = !!onBlockSeat;
              const isClickable = isBlockMode ? !isReserved : !readonly;

              return (
                <HoverCard key={seatId} openDelay={100} closeDelay={50}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => {
                        if (isBlockMode && !isReserved) {
                          onBlockSeat(rowIndex, seatNumber);
                        } else if (!readonly) {
                          onToggleSeat(rowIndex, seatNumber);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (!readonly && !isBlockMode) {
                          e.preventDefault();
                          if (isReserved) onToggleWheelchair(rowIndex, seatNumber);
                        }
                      }}
                      disabled={!isClickable}
                      style={{
                        backgroundColor: seatColor,
                        ...(isWheelchair && isReserved
                          ? { boxShadow: `0 0 0 2px var(--chart-1)` }
                          : {}),
                      }}
                      className={`
                        w-10 h-10 rounded font-semibold text-xs transition-colors text-white
                        hover:opacity-80
                        ${!isClickable ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                      `}
                    >
                      {seatNumber}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-auto p-2 text-xs">
                    <p className="font-semibold">
                      {isWheelchair && isReserved ? '♿ ' : ''}
                      Rij {rowIndex + 1}, Zitplaats {seatNumber}
                    </p>
                    <p className="text-muted-foreground">
                      {isUnpaid
                        ? 'Niet betaald'
                        : isReserved
                          ? 'Gereserveerd'
                          : blockedInfo?.type === 'reserved'
                            ? 'Geblokkeerd (gereserveerd)'
                            : blockedInfo?.type === 'unavailable'
                              ? 'Geblokkeerd (niet beschikbaar)'
                              : 'Beschikbaar'}
                    </p>
                    {isReserved && seatInfo?.[seatId] && (
                      <div className="mt-1 pt-1 border-t border-border">
                        <p>{seatInfo[seatId].customerName}</p>
                        <p className="text-muted-foreground font-mono">
                          {seatInfo[seatId].orderId.substring(0, 8)}...
                        </p>
                      </div>
                    )}
                    {isBlocked && blockedInfo.reason && (
                      <div className="mt-1 pt-1 border-t border-border">
                        <p className="text-muted-foreground">{blockedInfo.reason}</p>
                      </div>
                    )}
                    {isBlockMode && !isReserved && (
                      <p className="mt-1 text-muted-foreground italic">
                        {isBlocked ? 'Klik om te bewerken' : 'Klik om te blokkeren'}
                      </p>
                    )}
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>
      ))}

      {/* Color Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--chart-2)' }} />
          <span>Beschikbaar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--chart-3)' }} />
          <span>Gereserveerd (betaald)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--chart-5)' }} />
          <span>Niet betaald</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded"
            style={{
              backgroundColor: 'var(--chart-3)',
              boxShadow: '0 0 0 2px var(--chart-1)',
            }}
          />
          <span>Rolstoel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(43 96% 50%)' }} />
          <span>Geblokkeerd (gereserveerd)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0 0% 45%)' }} />
          <span>Geblokkeerd (niet beschikbaar)</span>
        </div>
        {!readonly && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--chart-4)' }} />
            <span>Laatste toewijzing</span>
          </div>
        )}
      </div>

      {/* Zone Legend Below Map */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-secondary">
          <div>
            <span className="font-semibold text-text-primary">Linker rolstoelzone:</span>
            <p className="text-text-secondary">Zitplaatsen 1-2</p>
          </div>
          <div>
            <span className="font-semibold text-text-primary">Normale vulzone:</span>
            <p className="text-text-secondary">Zitplaatsen 3-{seatsPerRow - 2}</p>
          </div>
          <div>
            <span className="font-semibold text-text-primary">Rechter rolstoelzone:</span>
            <p className="text-text-secondary">
              Zitplaatsen {seatsPerRow - 1}-{seatsPerRow}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
