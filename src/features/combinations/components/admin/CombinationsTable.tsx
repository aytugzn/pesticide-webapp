"use client";

import { useState, useCallback } from "react";
import { archiveCombination, toggleCombinationStatus, getAdminCombinationsPage, getAdminCombination } from "../../actions";
import { DICTIONARY } from "@/constants/dictionary";
import type { CombinationRow, CombinationLightRow } from "../../types";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ExternalLink, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { CombinationEditModal } from "./CombinationEditModal";
import { useCombinationAdminToast } from "./CombinationJobProvider";

type CombinationsTableProps = {
  initialRows: CombinationLightRow[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
};

const ICON_SIZE = 18;

export const CombinationsTable = ({ initialRows, initialNextCursor, initialHasMore }: CombinationsTableProps) => {
  const d = DICTIONARY.admin.combinations;
  const { showToast } = useCombinationAdminToast();
  const [rows, setRows] = useState(initialRows);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [rowToArchive, setRowToArchive] = useState<CombinationLightRow | null>(null);
  const [rowToEdit, setRowToEdit] = useState<CombinationRow | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());

  const confirmArchive = useCallback(async () => {
    if (!rowToArchive) return;

    setArchivingId(rowToArchive.id);
    try {
      const result = await archiveCombination(rowToArchive.region, rowToArchive.pest);

      if (result.success) {
        setRows((prev) => prev.filter((r) => r.id !== rowToArchive.id));
      } else {
        showToast({ variant: "error", message: d.errorDefault });
      }
    } catch {
      showToast({ variant: "error", message: d.errorDefault });
    }
    setArchivingId(null);
    setRowToArchive(null);
  }, [rowToArchive, showToast, d.errorDefault]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    try {
      const res = await getAdminCombinationsPage(50, nextCursor);
      if (res.success && res.data) {
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);

        // Filter out archived combinations just like initial load
        const visibleRows = res.data.items.filter((row) => !row.isArchived);
        setRows((prev) => [...prev, ...visibleRows]);
      } else {
        showToast({ variant: "error", message: d.errorDefault });
      }
    } catch {
      showToast({ variant: "error", message: d.errorDefault });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, d.errorDefault, showToast]);

  const handleArchiveClick = useCallback((row: CombinationLightRow) => {
    setRowToArchive(row);
  }, []);

  const handleEditClick = useCallback(async (row: CombinationLightRow) => {
    if (loadingEditId) return;
    setLoadingEditId(row.id);

    try {
      const res = await getAdminCombination(row.region, row.pest);
      if (res.success && res.data) {
        setRowToEdit(res.data);
      } else {
        showToast({ variant: "error", message: d.errorDefault });
      }
    } catch {
      showToast({ variant: "error", message: d.errorDefault });
    } finally {
      setLoadingEditId(null);
    }
  }, [loadingEditId, d.errorDefault, showToast]);

  const handleEditSuccess = useCallback((updatedRow: CombinationRow) => {
    setRows((prev) => prev.map((r) => {
      if (r.id === updatedRow.id) {
        return {
          ...r,
          isActive: updatedRow.isActive ?? false,
          regionName: updatedRow.regionName,
          pestName: updatedRow.pestName
        };
      }
      return r;
    }));
  }, []);

  const handleToggleActive = useCallback(async (row: CombinationLightRow, isActive: boolean) => {
    if (pendingToggleIds.has(row.id)) return;

    setPendingToggleIds((prev) => {
      const next = new Set(prev);
      next.add(row.id);
      return next;
    });

    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, isActive } : r));

    try {
      const result = await toggleCombinationStatus(row.region, row.pest, isActive);
      if (!result.success) {
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, isActive: !isActive } : r));
        showToast({ variant: "error", message: d.updateError });
      } else {
        showToast({ variant: "success", message: d.updateSuccess });
      }
    } catch {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, isActive: !isActive } : r));
      showToast({ variant: "error", message: d.updateError });
    } finally {
      setPendingToggleIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  }, [pendingToggleIds, showToast, d.updateError, d.updateSuccess]);

  const columns: AdminEntityColumn<CombinationLightRow>[] = [
    {
      key: "region",
      header: d.table.region,
      render: (row) => <span className="font-medium">{row.regionName}</span>,
    },
    {
      key: "pest",
      header: d.table.pest,
      render: (row) => row.pestName,
    },
    {
      key: "status",
      header: d.table.status,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Switch
            disabled={pendingToggleIds.has(row.id)}
            checked={row.isActive ?? false}
            onChange={(checked) => handleToggleActive(row, checked)}
          />
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
        </div>
      ),
    },
    {
      key: "actions",
      header: d.table.actions,
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <Button
            variant="unstyled"
            size="none"
            onClick={() => handleEditClick(row)}
            disabled={loadingEditId === row.id}
            className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary disabled:opacity-50"
            aria-label={`${d.edit} ${row.regionName} ${row.pestName}`}
            title={d.edit}
          >
            {loadingEditId === row.id ? (
              <div className="w-[18px] h-[18px] border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Edit2 size={ICON_SIZE} aria-hidden="true" />
            )}
          </Button>
          {row.isActive && (
            <a
              href={`/${row.region}/${row.pest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-brand-sm p-2.5 text-text-muted transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
              aria-label={`${row.regionName} ${row.pestName}`}
              title={d.table.view}
            >
              <ExternalLink size={ICON_SIZE} aria-hidden="true" />
            </a>
          )}
          <Button
            variant="unstyled"
            size="none"
            onClick={() => handleArchiveClick(row)}
            disabled={archivingId === row.id}
            className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-error-bg hover:text-error-text disabled:opacity-50"
            aria-label={`${d.archive} ${row.regionName} ${row.pestName}`}
            title={d.archive}
          >
            <Trash2 size={ICON_SIZE} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminEntityTable
        title={d.tableTitle}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage={d.tableEmpty}
      />

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? DICTIONARY.global.loading : d.loadMore}
          </Button>
        </div>
      )}

      <Modal
        isOpen={!!rowToArchive}
        onClose={() => setRowToArchive(null)}
        title={d.archive}
      >
        <p className="text-text-secondary mb-6">{d.archiveConfirm}</p>
        <div className="flex items-center justify-end gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => setRowToArchive(null)}
            disabled={!!archivingId}
          >
            {DICTIONARY.global.ui.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={confirmArchive}
            disabled={!!archivingId}
          >
            {archivingId ? DICTIONARY.global.loading : d.archive}
          </Button>
        </div>
      </Modal>

      <CombinationEditModal
        isOpen={!!rowToEdit}
        onClose={() => setRowToEdit(null)}
        row={rowToEdit}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};
