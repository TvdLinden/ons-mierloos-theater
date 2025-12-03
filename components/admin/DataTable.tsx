import { JSX, MouseEventHandler, ReactNode } from 'react';
import { Button } from '../ui';

type DataTableProps = {
  title?: string;
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
  onAddClicked?: MouseEventHandler<HTMLButtonElement>;
};

export function DataTable({ title, headers, children, onAddClicked }: DataTableProps) {
  return (
    <div className="bg-surface rounded-lg shadow">
      {title && (
        <div className="flex px-6 py-4 border-b border-zinc-200">
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          {onAddClicked && (
            <Button type="button" className="ml-auto" onClick={onAddClicked}>
              Add
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

type RowProps = { children: ReactNode } & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLTableRowElement>,
  HTMLTableRowElement
>;

export function Row({ children, className }: RowProps) {
  return <tr className={className}>{children}</tr>;
}

type ColumnProps = { children: ReactNode } & JSX.IntrinsicElements['td'];

export function Column({ children, ...props }: ColumnProps) {
  return (
    <td {...props} className="px-6 py-8 text-center text-zinc-500">
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-zinc-500">
        {message}
      </td>
    </tr>
  );
}
