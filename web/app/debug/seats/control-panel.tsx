'use client';

interface ControlPanelProps {
  rows: number;
  seatsPerRow: number;
  requestQuantity: number;
  requestWheelchair: boolean;
  seatInfo: {
    total: number;
    reserved: number;
    available: number;
    wheelchairReservations: number;
  };
  onChangeRows: (rows: number) => void;
  onChangeSeatsPerRow: (seats: number) => void;
  onChangeQuantity: (quantity: number) => void;
  onToggleWheelchair: (wheelchair: boolean) => void;
  onAssignSeats: () => void;
  onReset: () => void;
  lastAssignmentCount: number;
}

export function ControlPanel({
  rows,
  seatsPerRow,
  requestQuantity,
  requestWheelchair,
  seatInfo,
  onChangeRows,
  onChangeSeatsPerRow,
  onChangeQuantity,
  onToggleWheelchair,
  onAssignSeats,
  onReset,
  lastAssignmentCount,
}: ControlPanelProps) {
  const percentageReserved = ((seatInfo.reserved / seatInfo.total) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Seat Statistics */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Seat Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Total Seats:</span>
            <span className="font-bold text-white text-lg">{seatInfo.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Reserved:</span>
            <span className="font-bold text-red-400 text-lg">{seatInfo.reserved}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Available:</span>
            <span className="font-bold text-green-400 text-lg">{seatInfo.available}</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentageReserved}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-slate-400">{percentageReserved}% Reserved</div>
          <div className="pt-2 border-t border-slate-600 mt-4">
            <span className="text-slate-300">♿ Wheelchair Reserved:</span>
            <span className="font-bold text-blue-400 text-lg ml-2">{seatInfo.wheelchairReservations}</span>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rows: <span className="text-white font-bold">{rows}</span>
            </label>
            <input
              type="range"
              min="2"
              max="15"
              value={rows}
              onChange={(e) => onChangeRows(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Seats per Row: <span className="text-white font-bold">{seatsPerRow}</span>
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={seatsPerRow}
              onChange={(e) => onChangeSeatsPerRow(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Request Assignment */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Assignment Request</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Seats: <span className="text-white font-bold">{requestQuantity}</span>
            </label>
            <input
              type="range"
              min="1"
              max={Math.min(20, seatInfo.available)}
              value={requestQuantity}
              onChange={(e) => onChangeQuantity(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requestWheelchair}
              onChange={(e) => onToggleWheelchair(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-slate-300 font-medium">
              ♿ Wheelchair Access Required
            </span>
          </label>

          <button
            onClick={onAssignSeats}
            disabled={requestQuantity > seatInfo.available}
            className={`
              w-full py-3 px-4 rounded-lg font-bold text-white transition-all
              ${
                requestQuantity > seatInfo.available
                  ? 'bg-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }
            `}
          >
            {requestQuantity > seatInfo.available ? 'Not Enough Seats' : 'Assign Seats'}
          </button>

          {lastAssignmentCount > 0 && (
            <div className="p-3 bg-yellow-900 border border-yellow-700 rounded text-yellow-200 text-sm">
              ✓ Last assignment: {lastAssignmentCount} seat{lastAssignmentCount !== 1 ? 's' : ''} reserved
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all active:scale-95"
        >
          Clear All Reservations
        </button>
      </div>

      {/* Help */}
      <div className="bg-slate-700 rounded-lg p-4 shadow-lg text-xs text-slate-300">
        <p className="font-semibold text-white mb-2">Instructions:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Click seats to manually reserve/unreserve</li>
          <li>Right-click reserved seat to toggle wheelchair</li>
          <li>Use "Assign Seats" to test algorithm</li>
          <li>Yellow seats show last assignment result</li>
        </ul>
      </div>
    </div>
  );
}
