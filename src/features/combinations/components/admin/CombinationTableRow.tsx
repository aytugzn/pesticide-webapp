"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import type { CombinationRow } from "../../types";

export type CombinationTableRowProps = {
  row: CombinationRow;
  isDeleting: boolean;
  onDelete: (row: CombinationRow) => void;
};

const ICON_SIZE = 18;

export const CombinationTableRow = ({ row, isDeleting, onDelete }: CombinationTableRowProps) => {
  const d = DICTIONARY.admin.combinations;

  return (
    <tr className="border-b border-brand-border/50 last:border-0 hover:bg-surface-neutral/80 transition-colors group">
      <td className="px-6 py-4 text-text-primary font-medium">{row.regionName}</td>
      <td className="px-6 py-4 text-text-primary">{row.pestName}</td>
      <td className="px-6 py-4">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
            row.isActive
              ? "bg-success-bg/80 text-success-text border border-success-border/50"
              : "bg-error-bg/80 text-error-text border border-error-border/50"
          )}
        >
          {row.isActive ? d.table.active : d.table.passive}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {row.isActive && (
            <a
              href={`/${row.region}/${row.pest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
              aria-label={`${row.regionName} ${row.pestName}`}
              title={d.table.view}
            >
              <ExternalLink size={ICON_SIZE} aria-hidden="true" />
            </a>
          )}
          <Button
            variant="unstyled" size="none"
            onClick={() => onDelete(row)}
            disabled={isDeleting}
            className="p-2 text-text-secondary hover:text-error-text hover:bg-error-bg rounded-brand-sm transition-colors disabled:opacity-50"
            aria-label={`${d.delete} ${row.regionName} ${row.pestName}`}
            title={d.delete}
          >
            <Trash2 size={ICON_SIZE} aria-hidden="true" />
          </Button>
        </div>
      </td>
    </tr>
  );
};
