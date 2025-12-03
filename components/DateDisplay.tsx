export type DateDisplayProps = {
  value: string | Date | null;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
};

export default function DateDisplay({
  value,
  locale = 'nl-NL',
  options = { dateStyle: 'full', timeStyle: 'short' },
}: DateDisplayProps) {
  if (value === null) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return null;
  return <span>{new Intl.DateTimeFormat(locale, options).format(date)}</span>;
}
