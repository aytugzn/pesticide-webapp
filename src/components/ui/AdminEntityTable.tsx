import React from "react";
import { cn } from "@/utils/cn";

export type AdminEntityColumn<T> = {
  key: string;
  header: React.ReactNode;
  className?: string;
  render: (row: T, presentation?: "mobile" | "desktop") => React.ReactNode;
};

type AdminEntityTableBreakpoint = "md" | "lg" | "xl";

const RESPONSIVE_CLASSES: Record<
  AdminEntityTableBreakpoint,
  { mobile: string; desktop: string }
> = {
  md: { mobile: "md:hidden", desktop: "hidden md:block" },
  lg: { mobile: "lg:hidden", desktop: "hidden lg:block" },
  xl: { mobile: "xl:hidden", desktop: "hidden xl:block" },
};

export type AdminEntityTableProps<T> = {
  title?: string;
  rows: T[];
  columns: AdminEntityColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  className?: string;
  desktopBreakpoint?: AdminEntityTableBreakpoint;
  renderExpandedContent?: (
    row: T,
    presentation: "mobile" | "desktop",
  ) => React.ReactNode;
};

export const AdminEntityTable = <T,>({
  title,
  rows,
  columns,
  getRowKey,
  emptyMessage,
  className,
  desktopBreakpoint = "md",
  renderExpandedContent,
}: AdminEntityTableProps<T>) => {
  if (rows.length === 0) {
    return (
      <div className={cn("bg-brand-surface border border-brand-border/60 rounded-xl p-12 text-center shadow-sm", className)}>
        <p className="text-text-muted text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const responsiveClasses = RESPONSIVE_CLASSES[desktopBreakpoint];

  return (
    <div className={cn("bg-brand-surface border border-brand-border/60 rounded-xl overflow-hidden shadow-sm", className)}>
      {title && (
        <div className="px-6 py-5 border-b border-brand-border/60 bg-surface-neutral/30">
          <h2 className="font-heading font-bold text-text-primary text-lg tracking-tight">
            {title}
          </h2>
        </div>
      )}
      <div className={cn(responsiveClasses.mobile, "divide-y divide-brand-border/60")}>
        {rows.map((row) => {
          const actionColumn = columns.find((col) => col.key === "actions");
          const detailColumns = columns.filter((col) => col.key !== "actions");
          const expandedContent = renderExpandedContent?.(row, "mobile");
          const mobileActions = actionColumn?.render(row, "mobile");

          return (
            <article key={getRowKey(row)} className="p-4 space-y-4 bg-brand-surface">
              <div className="space-y-3">
                {detailColumns.map((col) => (
                  <div key={col.key} className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      {col.header}
                    </div>
                    <div className="mt-1 text-sm text-text-primary break-words">
                      {col.render(row, "mobile")}
                    </div>
                  </div>
                ))}
              </div>

              {expandedContent}

              {mobileActions && (
                <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-brand-border/50 pt-3">
                  {mobileActions}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className={cn(responsiveClasses.desktop, "overflow-x-auto")}>
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
            {rows.map((row) => {
              const rowKey = getRowKey(row);
              const expandedContent = renderExpandedContent?.(row, "desktop");

              return (
                <React.Fragment key={rowKey}>
                  <tr className="border-b border-brand-border/50 hover:bg-surface-neutral/80 transition-colors group">
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-6 py-4 text-text-primary", col.className)}>
                        {col.render(row, "desktop")}
                      </td>
                    ))}
                  </tr>
                  {expandedContent && (
                    <tr className="border-b border-brand-border/50 last:border-0">
                      <td colSpan={columns.length} className="p-0 text-text-primary">
                        {expandedContent}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
