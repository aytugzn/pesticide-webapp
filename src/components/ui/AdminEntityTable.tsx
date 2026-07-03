import React from "react";
import { cn } from "@/utils/cn";

export type AdminEntityColumn<T> = {
  key: string;
  header: React.ReactNode;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export type AdminEntityTableProps<T> = {
  title?: string;
  rows: T[];
  columns: AdminEntityColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  className?: string;
};

export const AdminEntityTable = <T,>({
  title,
  rows,
  columns,
  getRowKey,
  emptyMessage,
  className,
}: AdminEntityTableProps<T>) => {
  if (rows.length === 0) {
    return (
      <div className={cn("bg-brand-surface border border-brand-border/60 rounded-xl p-12 text-center shadow-sm", className)}>
        <p className="text-text-muted text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-brand-surface border border-brand-border/60 rounded-xl overflow-hidden shadow-sm", className)}>
      {title && (
        <div className="px-6 py-5 border-b border-brand-border/60 bg-surface-neutral/30">
          <h2 className="font-heading font-bold text-text-primary text-lg tracking-tight">
            {title}
          </h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border/60 bg-surface-neutral/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("text-left px-6 py-4 font-semibold text-text-secondary tracking-wide uppercase text-xs", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-brand-border/50 last:border-0 hover:bg-surface-neutral/80 transition-colors group">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-6 py-4 text-text-primary", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
