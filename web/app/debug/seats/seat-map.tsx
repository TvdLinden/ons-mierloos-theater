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
}

export function SeatMap({
  rows,
  seatsPerRow,
  reservedSeats,
  wheelchairReservations,
  lastAssignment,
  onToggleSeat,
  onToggleWheelchair,
}: SeatMapProps) {
  const lastAssignmentSet = lastAssignment
    ? new Set(lastAssignment.map((s) => `${s.rowIndex}-${s.seatNumber}`))
    : null;

  const normalMin = 3;
  const normalMax = seatsPerRow - 2;

  const getZoneClass = (seatNumber: number): string => {
    if (seatNumber <= 2) return 'left-zone';
    if (seatNumber > normalMax) return 'right-zone';
    return 'normal-zone';
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {/* Row label */}
          <div className="w-8 text-right">
            <span className="text-sm font-semibold text-slate-700">Rij {rowIndex + 1}</span>
          </div>

          {/* Seats container with zone indicators */}
          <div className="flex gap-1 relative">
            {/* Left zone indicator */}
            {seatsPerRow >= 2 && (
              <div className="absolute -left-0.5 top-0 bottom-0 w-16 border-l-2 border-slate-300 opacity-40"></div>
            )}

            {/* Normal zone indicator */}
            {normalMax >= normalMin && (
              <div className="absolute top-0 bottom-0 border-l-2 border-slate-300 opacity-40" style={{ left: `${(normalMin - 1) * 40 + 64}px` }}></div>
            )}

            {/* Right zone indicator */}
            {seatsPerRow > normalMax && (
              <div className="absolute top-0 bottom-0 border-l-2 border-slate-300 opacity-40" style={{ left: `${(normalMax) * 40 + 64}px` }}></div>
            )}

            {/* Seats */}
            {Array.from({ length: seatsPerRow }).map((_, seatIndex) => {
              const seatNumber = seatIndex + 1;
              const seatId = `${rowIndex}-${seatNumber}`;
              const isReserved = reservedSeats.has(seatId);
              const isWheelchair = wheelchairReservations.has(seatId);
              const isLastAssignment = lastAssignmentSet?.has(seatId);
              const zoneClass = getZoneClass(seatNumber);

              let bgColor = 'bg-green-500 hover:bg-green-600';
              if (isLastAssignment) bgColor = 'bg-yellow-400 hover:bg-yellow-500';
              else if (isReserved) bgColor = 'bg-red-500 hover:bg-red-600';

              return (
                <div
                  key={seatId}
                  className="relative group"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isReserved) onToggleWheelchair(rowIndex, seatNumber);
                  }}
                >
                  <button
                    onClick={() => onToggleSeat(rowIndex, seatNumber)}
                    className={`
                      w-10 h-10 rounded font-semibold text-xs transition-colors cursor-pointer
                      ${bgColor}
                      ${isWheelchair && isReserved ? 'ring-2 ring-blue-400' : ''}
                      active:scale-95
                    `}
                    title={`${isWheelchair && isReserved ? '♿ ' : ''}Rij ${rowIndex + 1}, Zitplaats ${seatNumber}`}
                  >
                    {seatNumber}
                  </button>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {isWheelchair && isReserved ? '♿ ' : ''}
                    {isReserved ? 'Gereserveerd' : 'Beschikbaar'} - Klik om te schakelen
                    {isReserved && <br />}
                    {isReserved && 'Rechtsklik om rolstoel in/uit te schakelen'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Zone Legend Below Map */}
      <div className="mt-8 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-900">Linker rolstoelzone:</span>
            <p className="text-slate-500">Zitplaatsen 1-2</p>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Normale vulzone:</span>
            <p className="text-slate-500">Zitplaatsen 3-{seatsPerRow - 2}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Rechter rolstoelzone:</span>
            <p className="text-slate-500">Zitplaatsen {seatsPerRow - 1}-{seatsPerRow}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
