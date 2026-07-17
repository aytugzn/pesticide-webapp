import { ArrowDown, ArrowUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import type { ContactRequestStatus } from "@/types";
import { cn } from "@/utils/cn";
import { formatTemplate } from "@/utils/template";

export type MessageFilter = "all" | ContactRequestStatus;
export type MessageSortDirection = "newest" | "oldest";

type MessagesToolbarProps = {
  activeFilter: MessageFilter;
  sortDirection: MessageSortDirection;
  isDeleting: boolean;
  onFilterChange: (filter: MessageFilter) => void;
  onSortToggle: () => void;
  onDeleteClick: () => void;
};

const ICON_SIZE = 16;

/**
 * Renders responsive message filters, sorting, and bulk-delete controls.
 */
export const MessagesToolbar = ({
  activeFilter,
  sortDirection,
  isDeleting,
  onFilterChange,
  onSortToggle,
  onDeleteClick,
}: MessagesToolbarProps) => {
  const d = DICTIONARY.admin.messages;
  const filters: { value: MessageFilter; label: string }[] = [
    { value: "all", label: d.filters.all },
    { value: "pending", label: d.statuses.pending },
    { value: "resolved", label: d.filters.resolved },
  ];
  const sortLabel =
    sortDirection === "newest"
      ? d.sorting.newestFirst
      : d.sorting.oldestFirst;
  const sortAriaLabel = formatTemplate(d.sorting.ariaLabel, {
    direction: sortLabel,
  });

  return (
    <div
      role="toolbar"
      aria-label={d.controlsAriaLabel}
      className="flex flex-wrap items-center gap-2 border-b border-brand-border/60 bg-surface-neutral/30 px-3 py-2"
    >
      <div
        role="group"
        aria-label={d.filters.ariaLabel}
        className="flex items-center gap-1 rounded-brand-md border border-brand-border/60 bg-brand-surface p-1"
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "h-8 rounded-brand-sm px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50",
                isActive
                  ? "bg-brand-primary text-brand-surface shadow-sm"
                  : "text-text-secondary hover:bg-surface-neutral hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label={sortAriaLabel}
        onClick={onSortToggle}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-brand-sm border border-brand-border bg-brand-surface px-3 text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
      >
        {sortDirection === "newest" ? (
          <ArrowDown size={ICON_SIZE} aria-hidden="true" />
        ) : (
          <ArrowUp size={ICON_SIZE} aria-hidden="true" />
        )}
        {sortLabel}
      </button>

      <Button
        type="button"
        variant="danger"
        size="none"
        disabled={isDeleting}
        onClick={onDeleteClick}
        className="min-h-11 w-full gap-2 rounded-brand-sm px-3 text-xs sm:ml-auto sm:h-8 sm:min-h-0 sm:w-auto sm:gap-1.5"
      >
        {isDeleting ? (
          <Loader2
            size={ICON_SIZE}
            className="animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Trash2 size={ICON_SIZE} aria-hidden="true" />
        )}
        {isDeleting ? d.bulkDelete.deleting : d.bulkDelete.button}
      </Button>
    </div>
  );
};
