'use client';

import { SeatMap } from '@/components/SeatMap';

interface SeatMapDisplayProps {
  rows: number;
  seatsPerRow: number;
  reservedSeats: string[];
  wheelchairSeats: string[];
}

export function SeatMapDisplay({
  rows,
  seatsPerRow,
  reservedSeats,
  wheelchairSeats,
}: SeatMapDisplayProps) {
  // Convert arrays back to Sets for SeatMap component
  const reservedSet = new Set(reservedSeats);
  const wheelchairSet = new Set(wheelchairSeats);

  return (
    <SeatMap
      rows={rows}
      seatsPerRow={seatsPerRow}
      reservedSeats={reservedSet}
      wheelchairReservations={wheelchairSet}
      lastAssignment={null}
      onToggleSeat={() => {}}
      onToggleWheelchair={() => {}}
      readonly
    />
  );
}
