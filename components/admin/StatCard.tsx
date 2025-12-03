type StatCardProps = {
  label: string;
  value: string | number;
  valueColor?: string;
};

export function StatCard({ label, value, valueColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg shadow p-6">
      <div className="text-sm text-zinc-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
}
