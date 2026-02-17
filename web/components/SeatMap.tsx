'use client';

import { Seat } from '@ons-mierloos-theater/shared/utils/seatAssignment';

interface SeatMapProps {
  rows: number;
  seatsPerRow: number;
  reservedSeats: Set<string>;
  wheelchairReservations: Set<string>;
  lastAssignment: Seat[] | null;
  onToggleSeat: (rowIndex: number, seatNumber: number) => void;
  onToggleWheelchair: (rowIndex: number, seatNumber: number) => void;
  readonly?: boolean;
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
            {/* Left zone indicator */}
            {seatsPerRow >= 2 && (
              <div className="absolute -left-0.5 top-0 bottom-0 w-16 border-l-2 border-border opacity-40"></div>
            )}

            {/* Normal zone indicator */}
            {normalMax >= normalMin && (
              <div
                className="absolute top-0 bottom-0 border-l-2 border-border opacity-40"
                style={{ left: `${(normalMin - 1) * 40 + 64}px` }}
              ></div>
            )}

            {/* Right zone indicator */}
            {seatsPerRow > normalMax && (
              <div
                className="absolute top-0 bottom-0 border-l-2 border-border opacity-40"
                style={{ left: `${normalMax * 40 + 64}px` }}
              ></div>
            )}

            {/* Seats */}
            {Array.from({ length: seatsPerRow }).map((_, seatIndex) => {
              const seatNumber = seatIndex + 1;
              const seatId = `${rowIndex}-${seatNumber}`;
              const isReserved = reservedSeats.has(seatId);
              const isWheelchair = wheelchairReservations.has(seatId);
              const isLastAssignment = lastAssignmentSet?.has(seatId);

              let seatColor = 'var(--chart-2)';
              if (isLastAssignment) seatColor = 'var(--chart-4)';
              else if (isReserved) seatColor = 'var(--chart-3)';

              return (
                <div
                  key={seatId}
                  className="relative group"
                  onContextMenu={(e) => {
                    if (!readonly) {
                      e.preventDefault();
                      if (isReserved) onToggleWheelchair(rowIndex, seatNumber);
                    }
                  }}
                >
                  <button
                    onClick={() => {
                      if (!readonly) onToggleSeat(rowIndex, seatNumber);
                    }}
                    disabled={readonly}
                    style={{
                      backgroundColor: seatColor,
                      ...(isWheelchair && isReserved
                        ? { boxShadow: `0 0 0 2px var(--chart-1)` }
                        : {}),
                    }}
                    className={`
                      w-10 h-10 rounded font-semibold text-xs transition-colors text-white
                      hover:opacity-80
                      ${readonly ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                    `}
                    title={`${isWheelchair && isReserved ? '♿ ' : ''}Rij ${rowIndex + 1}, Zitplaats ${seatNumber}`}
                  >
                    {seatNumber}
                  </button>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {isWheelchair && isReserved ? '♿ ' : ''}
                    {isReserved ? 'Gereserveerd' : 'Beschikbaar'}
                    {!readonly && (
                      <>
                        <br />
                        {isReserved && 'Klik om te schakelen'}
                      </>
                    )}
                  </div>
                </div>
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
          <span>Gereserveerd</span>
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
