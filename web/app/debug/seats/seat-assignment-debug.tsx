'use client';

import { useState, useMemo } from 'react';
import { assignSeats } from '@/shared/lib/utils/seatAssignment';
import { SeatMap } from './seat-map';
import { ControlPanel } from './control-panel';

export function SeatAssignmentDebug() {
  const [rows, setRows] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [requestQuantity, setRequestQuantity] = useState(2);
  const [requestWheelchair, setRequestWheelchair] = useState(false);
  const [lastAssignment, setLastAssignment] = useState<Array<{ rowIndex: number; seatNumber: number }> | null>(null);
  const [wheelchairReservations, setWheelchairReservations] = useState<Set<string>>(new Set());

  const totalSeats = rows * seatsPerRow;
  const reservedCount = reservedSeats.size;
  const availableCount = totalSeats - reservedCount;

  const seatInfo = useMemo(() => {
    const wheelchairCount = Array.from(wheelchairReservations).filter((seat) =>
      reservedSeats.has(seat),
    ).length;
    return {
      total: totalSeats,
      reserved: reservedCount,
      available: availableCount,
      wheelchairReservations: wheelchairCount,
    };
  }, [reservedSeats, wheelchairReservations, totalSeats, reservedCount, availableCount]);

  const handleToggleSeat = (rowIndex: number, seatNumber: number) => {
    const seatId = `${rowIndex}-${seatNumber}`;
    const newReserved = new Set(reservedSeats);

    if (newReserved.has(seatId)) {
      newReserved.delete(seatId);
      const newWheelchair = new Set(wheelchairReservations);
      newWheelchair.delete(seatId);
      setWheelchairReservations(newWheelchair);
    } else {
      newReserved.add(seatId);
    }

    setReservedSeats(newReserved);
    setLastAssignment(null);
  };

  const handleToggleWheelchair = (rowIndex: number, seatNumber: number) => {
    const seatId = `${rowIndex}-${seatNumber}`;
    const newWheelchair = new Set(wheelchairReservations);

    if (newWheelchair.has(seatId)) {
      newWheelchair.delete(seatId);
    } else {
      newWheelchair.add(seatId);
    }

    setWheelchairReservations(newWheelchair);
  };

  const handleAssignSeats = () => {
    const assignment = assignSeats(reservedSeats, rows, seatsPerRow, requestQuantity, requestWheelchair);

    if (assignment.length > 0) {
      const newReserved = new Set(reservedSeats);
      let hasWheelchair = false;

      assignment.forEach((seat) => {
        const seatId = `${seat.rowIndex}-${seat.seatNumber}`;
        newReserved.add(seatId);
      });

      if (requestWheelchair) {
        hasWheelchair = true;
        // Mark first seat as wheelchair-accessible
        const firstSeat = assignment[0];
        const firstSeatId = `${firstSeat.rowIndex}-${firstSeat.seatNumber}`;
        const newWheelchair = new Set(wheelchairReservations);
        newWheelchair.add(firstSeatId);
        setWheelchairReservations(newWheelchair);
      }

      setReservedSeats(newReserved);
      setLastAssignment(assignment);
    }
  };

  const handleReset = () => {
    setReservedSeats(new Set());
    setWheelchairReservations(new Set());
    setLastAssignment(null);
  };

  const handleChangeRows = (newRows: number) => {
    setRows(newRows);
    // Clear reservations that exceed the new row count
    const newReserved = new Set(
      Array.from(reservedSeats).filter((seat) => {
        const [rowStr] = seat.split('-');
        const rowIndex = parseInt(rowStr);
        return rowIndex < newRows;
      }),
    );
    setReservedSeats(newReserved);
    setLastAssignment(null);
  };

  const handleChangeSeatsPerRow = (newSeats: number) => {
    setSeatsPerRow(newSeats);
    // Clear reservations that exceed the new seat count
    const newReserved = new Set(
      Array.from(reservedSeats).filter((seat) => {
        const [, seatStr] = seat.split('-');
        const seatNumber = parseInt(seatStr);
        return seatNumber <= newSeats;
      }),
    );
    setReservedSeats(newReserved);
    setLastAssignment(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Seatmap */}
      <div className="lg:col-span-3">
        <div className="bg-slate-700 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Seatmap ({rows} rows × {seatsPerRow} seats)</h2>
          <SeatMap
            rows={rows}
            seatsPerRow={seatsPerRow}
            reservedSeats={reservedSeats}
            wheelchairReservations={wheelchairReservations}
            lastAssignment={lastAssignment}
            onToggleSeat={handleToggleSeat}
            onToggleWheelchair={handleToggleWheelchair}
          />
        </div>

        {/* Legend */}
        <div className="mt-6 bg-slate-700 rounded-lg p-4 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-slate-300">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-slate-300">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-slate-300">Wheelchair</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-slate-300">Last Assign</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-300"></div>
              <span className="text-slate-300">Zone borders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div>
        <ControlPanel
          rows={rows}
          seatsPerRow={seatsPerRow}
          requestQuantity={requestQuantity}
          requestWheelchair={requestWheelchair}
          seatInfo={seatInfo}
          onChangeRows={handleChangeRows}
          onChangeSeatsPerRow={handleChangeSeatsPerRow}
          onChangeQuantity={setRequestQuantity}
          onToggleWheelchair={setRequestWheelchair}
          onAssignSeats={handleAssignSeats}
          onReset={handleReset}
          lastAssignmentCount={lastAssignment?.length ?? 0}
        />
      </div>
    </div>
  );
}
