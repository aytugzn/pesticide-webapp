"use client";

import { useRef, useState } from "react";
import { Loader2, Phone } from "lucide-react";
import {
  AdminEntityTable,
  type AdminEntityColumn,
} from "@/components/ui/AdminEntityTable";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";
import { resolveAdminActionError } from "@/features/auth/adminActionError";
import {
  deleteOverdueResolvedMessages,
  updateMessageStatus,
} from "@/features/messages/actions";
import type { AdminMessageRow } from "@/features/messages/types";
import type { ContactRequestStatus } from "@/types";
import { formatTurkishDateTime } from "@/utils/date";
import {
  formatTurkishPhoneDisplay,
  generateTelUrl,
} from "@/utils/phone";
import { formatTemplate } from "@/utils/template";
import { DeleteOverdueMessagesModal } from "./DeleteOverdueMessagesModal";
import {
  MessagesToolbar,
  type MessageFilter,
  type MessageSortDirection,
} from "./MessagesToolbar";

type MessagesManagerProps = {
  initialRows: AdminMessageRow[];
};

const ICON_SIZE = 16;

/**
 * Renders a localized status badge and safely handles unknown legacy values.
 *
 * @param status - Raw status read from Firestore
 * @returns A readable semantic status badge
 */
const renderStatusBadge = (status: string) => {
  const d = DICTIONARY.admin.messages.statuses;

  if (status === "pending") {
    return (
      <span className="inline-flex rounded-full border border-warning-border bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning-text">
        {d.pending}
      </span>
    );
  }

  if (status === "resolved") {
    return (
      <span className="inline-flex rounded-full border border-success-border bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-text">
        {d.resolved}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-brand-border bg-surface-neutral px-2.5 py-1 text-xs font-semibold text-text-muted">
      {d.unknown}
    </span>
  );
};

/**
 * Provides client-side filtering, row-scoped mutations, status badges, and
 * phone links for the latest admin contact requests.
 *
 * @param props - Serializable message rows fetched by the server page
 * @returns Responsive message management controls and table
 */
export const MessagesManager = ({ initialRows }: MessagesManagerProps) => {
  const { showToast, showToastSequence } = useCombinationAdminToast();
  const d = DICTIONARY.admin.messages;
  const [activeFilter, setActiveFilter] = useState<MessageFilter>("all");
  const [sortDirection, setSortDirection] =
    useState<MessageSortDirection>("newest");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const isDeletingRef = useRef(false);

  const filteredRows = initialRows.filter(
    (row) => activeFilter === "all" || row.status === activeFilter,
  );
  const sortedRows = [...filteredRows].sort((left, right) => {
    if (left.createdAt === null) {
      return right.createdAt === null ? left.id.localeCompare(right.id) : 1;
    }
    if (right.createdAt === null) return -1;

    const dateDifference = left.createdAt - right.createdAt;
    if (dateDifference === 0) return left.id.localeCompare(right.id);
    return sortDirection === "newest" ? -dateDifference : dateDifference;
  });
  const emptyMessage =
    activeFilter === "pending"
      ? d.emptyStates.pending
      : activeFilter === "resolved"
        ? d.emptyStates.resolved
        : d.empty;
  const setRowPending = (id: string, isPending: boolean) => {
    const next = new Set(pendingIdsRef.current);
    if (isPending) next.add(id);
    else next.delete(id);
    pendingIdsRef.current = next;
    setPendingIds(next);
  };

  const handleStatusUpdate = async (row: AdminMessageRow) => {
    if (pendingIdsRef.current.has(row.id)) return;
    if (row.status !== "pending" && row.status !== "resolved") return;

    const targetStatus: ContactRequestStatus =
      row.status === "pending" ? "resolved" : "pending";
    setRowPending(row.id, true);

    try {
      const result = await updateMessageStatus({
        id: row.id,
        status: targetStatus,
      });

      if (!result.success) {
        showToast({
          variant: "error",
          message: resolveAdminActionError(result, d.toast.updateError),
        });
        return;
      }

      showToast({ variant: "success", message: d.toast.updateSuccess });
    } catch {
      showToast({ variant: "error", message: d.toast.updateError });
    } finally {
      setRowPending(row.id, false);
    }
  };

  const handleDeleteOverdueMessages = async () => {
    if (isDeletingRef.current) return;

    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      const result = await deleteOverdueResolvedMessages();
      if (!result.success || !result.data) {
        showToast({
          variant: "error",
          message: result.success
            ? d.bulkDelete.error
            : resolveAdminActionError(result, d.bulkDelete.error),
        });
        return;
      }

      const { deletedCount, overduePendingCount, partialFailure } = result.data;

      const notices: {
        variant: "success" | "warning" | "info" | "error";
        message: string;
      }[] = [];

      if (deletedCount > 0) {
        notices.push({
          variant: "success",
          message: formatTemplate(d.bulkDelete.success, {
            count: deletedCount,
          }),
        });
      }
      if (partialFailure) {
        notices.push({ variant: "error", message: d.bulkDelete.partial });
      }
      if (overduePendingCount > 0) {
        notices.push({
          variant: "warning",
          message: formatTemplate(d.bulkDelete.overduePending, {
            count: overduePendingCount,
          }),
        });
      }
      if (notices.length === 0) {
        notices.push({ variant: "info", message: d.bulkDelete.empty });
      }

      showToastSequence(notices);
    } catch {
      showToast({ variant: "error", message: d.bulkDelete.error });
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const columns: AdminEntityColumn<AdminMessageRow>[] = [
    {
      key: "name",
      header: d.table.name,
      render: (row) => (
        <span className="font-medium">{row.name || d.missingValue}</span>
      ),
    },
    {
      key: "phone",
      header: d.table.phone,
      render: (row, presentation) => {
        const formattedPhone = formatTurkishPhoneDisplay(row.phone);
        const telUrl = generateTelUrl(row.phone);

        if (!formattedPhone || !telUrl) return d.missingValue;

        const ariaLabel = formatTemplate(d.phoneAriaLabel, {
          phone: formattedPhone,
        });

        if (presentation === "mobile") {
          return (
            <a
              href={telUrl}
              aria-label={ariaLabel}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-brand-sm border border-brand-primary/30 bg-brand-primary-light px-3 py-2 font-semibold tabular-nums text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-primary/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            >
              <Phone size={ICON_SIZE} aria-hidden="true" />
              {formattedPhone}
            </a>
          );
        }

        return (
          <a
            href={telUrl}
            aria-label={ariaLabel}
            className="whitespace-nowrap font-medium tabular-nums text-brand-primary underline-offset-4 hover:underline"
          >
            {formattedPhone}
          </a>
        );
      },
    },
    {
      key: "service",
      header: d.table.service,
      render: (row) => row.service || d.missingValue,
    },
    {
      key: "region",
      header: d.table.region,
      render: (row) => row.region || d.missingValue,
    },
    {
      key: "date",
      header: d.table.date,
      render: (row) => {
        const formattedDateTime =
          row.createdAt === null
            ? null
            : formatTurkishDateTime(row.createdAt);

        if (!formattedDateTime) return d.dateMissing;

        return (
          <span className="block whitespace-nowrap tabular-nums leading-tight">
            <span className="block text-sm text-text-primary">
              {formattedDateTime.date}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">
              {formattedDateTime.time}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: d.table.status,
      render: (row) => renderStatusBadge(row.status),
    },
    {
      key: "actions",
      header: d.table.actions,
      className: "text-right",
      render: (row, presentation) => {
        if (row.status !== "pending" && row.status !== "resolved") return null;

        const isPending = pendingIds.has(row.id);
        const actionLabel =
          row.status === "pending"
            ? d.actions.markResolved
            : d.actions.markPending;

        return (
          <div
            className={
              presentation === "mobile"
                ? "flex w-full"
                : "flex justify-end"
            }
          >
            <Button
              type="button"
              size="sm"
              variant={row.status === "pending" ? "success" : "outline"}
              disabled={isPending}
              onClick={() => handleStatusUpdate(row)}
              aria-label={isPending ? d.actions.updating : actionLabel}
              className={
                presentation === "mobile"
                  ? "min-h-11 w-full whitespace-nowrap"
                  : "whitespace-nowrap"
              }
            >
              {isPending && (
                <Loader2
                  size={ICON_SIZE}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {isPending ? d.actions.updating : actionLabel}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <section aria-label={d.controlsAriaLabel}>
      <div className="overflow-hidden rounded-brand-lg border border-brand-border/60 bg-brand-surface shadow-sm">
        <MessagesToolbar
          activeFilter={activeFilter}
          sortDirection={sortDirection}
          isDeleting={isDeleting}
          onFilterChange={setActiveFilter}
          onSortToggle={() =>
            setSortDirection((current) =>
              current === "newest" ? "oldest" : "newest",
            )
          }
          onDeleteClick={() => setIsDeleteModalOpen(true)}
        />

        <AdminEntityTable
          rows={sortedRows}
          columns={columns}
          getRowKey={(row) => row.id}
          emptyMessage={emptyMessage}
          desktopBreakpoint="lg"
          className="rounded-none border-0 shadow-none"
        />
      </div>

      <DeleteOverdueMessagesModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteOverdueMessages}
      />
    </section>
  );
};
