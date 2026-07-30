import { ReactNode } from 'react';
import { cn } from './lib/cn';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Generic column-driven data table for admin list screens — same
// callers-own-the-state philosophy as Tabs: no sorting/selection state
// lives in here, just markup over whatever rows/columns the page passes in.
// Self-contained card styling (border/background/rounded/shadow, matching
// Card) so every caller gets a consistent look without needing to remember
// to wrap it — see apps/web/app/(super-admin)/admin/dashboard/page.tsx for
// the one place that also nests it in a Card (for a section heading above
// it), which is fine since the two borders don't visually conflict there.
export function Table<T>({ columns, rows, rowKey, isLoading, emptyMessage = 'No results.', className }: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border bg-background p-4 shadow-sm', className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {columns.map((col) => (
              <th key={col.key} className={cn('py-2 pr-4', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="align-middle">
                {columns.map((col) => (
                  <td key={col.key} className={cn('py-3 pr-4', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
