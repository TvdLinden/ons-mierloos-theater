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
        <h3 className="text-lg font-bold text-white mb-4">Zitplaatsstatistieken</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Totaal zitplaatsen:</span>
            <span className="font-bold text-white text-lg">{seatInfo.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Gereserveerd:</span>
            <span className="font-bold text-red-400 text-lg">{seatInfo.reserved}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Beschikbaar:</span>
            <span className="font-bold text-green-400 text-lg">{seatInfo.available}</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentageReserved}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-slate-400">{percentageReserved}% gereserveerd</div>
          <div className="pt-2 border-t border-slate-600 mt-4">
            <span className="text-slate-300">♿ Rolstoel gereserveerd:</span>
            <span className="font-bold text-blue-400 text-lg ml-2">{seatInfo.wheelchairReservations}</span>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Configuratie</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rijen: <span className="text-white font-bold">{rows}</span>
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
              Zitplaatsen per rij: <span className="text-white font-bold">{seatsPerRow}</span>
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
        <h3 className="text-lg font-bold text-white mb-4">Toewijzingsverzoek</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Aantal zitplaatsen: <span className="text-white font-bold">{requestQuantity}</span>
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
              ♿ Roltoegangsvereist
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
            {requestQuantity > seatInfo.available ? 'Niet genoeg zitplaatsen' : 'Zitplaatsen toewijzen'}
          </button>

          {lastAssignmentCount > 0 && (
            <div className="p-3 bg-yellow-900 border border-yellow-700 rounded text-yellow-200 text-sm">
              ✓ Laatste toewijzing: {lastAssignmentCount} zitplaats{lastAssignmentCount !== 1 ? 'en' : ''} gereserveerd
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Acties</h3>
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all active:scale-95"
        >
          Alle reserveringen wissen
        </button>
      </div>

      {/* Help */}
      <div className="bg-slate-700 rounded-lg p-4 shadow-lg text-xs text-slate-300">
        <p className="font-semibold text-white mb-2">Instructies:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Klik op zitplaatsen om handmatig te reserveren/reservering in te trekken</li>
          <li>Rechtsklik op gereserveerde zitplaats om rolstoel in/uit te schakelen</li>
          <li>Gebruik "Zitplaatsen toewijzen" om algoritme te testen</li>
          <li>Gele zitplaatsen tonen het resultaat van de laatste toewijzing</li>
        </ul>
      </div>
    </div>
  );
}
