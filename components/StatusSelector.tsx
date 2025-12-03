interface StatusSelectorProps {
  label?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  options: Array<{ value: string; label: string }>;
}

export default function StatusSelector({
  label,
  name,
  value,
  defaultValue,
  onChange,
  className = '',
  options,
}: StatusSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block font-medium mb-1 text-primary">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        className="w-full p-3 border rounded bg-surface text-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
