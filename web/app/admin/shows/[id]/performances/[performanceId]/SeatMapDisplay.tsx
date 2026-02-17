'use client';

import { SeatMap } from '@/components/SeatMap';

export interface SeatInfo {
  customerName: string;
  orderId: string;
  orderStatus: string;
}

interface SeatMapDisplayProps {
  rows: number;
  seatsPerRow: number;
  reservedSeats: string[];
  wheelchairSeats: string[];
  seatInfo?: Record<string, SeatInfo>;
}

export function SeatMapDisplay({
  rows,
  seatsPerRow,
  reservedSeats,
  wheelchairSeats,
  seatInfo,
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
      seatInfo={seatInfo}
      readonly
    />
  );
}
