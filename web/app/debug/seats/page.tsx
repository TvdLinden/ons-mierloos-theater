import { SeatAssignmentDebug } from './seat-assignment-debug';

export default function SeatDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Zitplaatsen Debugger</h1>
        <p className="text-slate-300 mb-8">
          Test het zitplaatstowijzingsalgoritme met interactieve zitplaatskaartbesturingselementen
        </p>
        <SeatAssignmentDebug />
      </div>
    </div>
  );
}
