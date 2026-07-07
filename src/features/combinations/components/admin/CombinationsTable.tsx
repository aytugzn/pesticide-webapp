"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { archiveCombination, toggleCombinationStatus, getAdminCombinationsPage, getAdminCombination, unarchiveCombination } from "../../actions";
import { DICTIONARY } from "@/constants/dictionary";
import { COMBINATION_ERRORS, type CombinationRow, type CombinationLightRow } from "../../types";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ArchiveRestore, ExternalLink, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { CombinationEditModal } from "./CombinationEditModal";
import { useCombinationJob, type BulkMutationNotice } from "./CombinationJobProvider";

type CombinationsTableProps = {
  initialRows: CombinationLightRow[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
};

const ICON_SIZE = 18;

type CombinationTableView = "normal" | "archived";

type CombinationTableState = {
  rows: CombinationLightRow[];
  nextCursor: string | null;
  hasMore: boolean;
  loaded: boolean;
};

const getUpsertedRows = (
  currentRows: CombinationLightRow[],
  incomingRows: CombinationLightRow[],
) => {
  const incomingById = new Map(incomingRows.map((row) => [row.id, row]));
  const currentIds = new Set(currentRows.map((row) => row.id));
  const newRows = incomingRows.filter((row) => !currentIds.has(row.id));
  const updatedRows = currentRows.map((row) => incomingById.get(row.id) ?? row);

  return [...newRows, ...updatedRows];
};

export const CombinationsTable = ({ initialRows, initialNextCursor, initialHasMore }: CombinationsTableProps) => {
  const d = DICTIONARY.admin.combinations;
  const { showToast, subscribeBulkMutation } = useCombinationJob();
  const [tableView, setTableView] = useState<CombinationTableView>("normal");
  const [standardState, setStandardState] = useState<CombinationTableState>({
    rows: initialRows,
    nextCursor: initialNextCursor,
    hasMore: initialHasMore,
    loaded: true,
  });
  const [archivedState, setArchivedState] = useState<CombinationTableState>({
    rows: [],
    nextCursor: null,
    hasMore: false,
    loaded: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [rowToArchive, setRowToArchive] = useState<CombinationLightRow | null>(null);
  const [rowToEdit, setRowToEdit] = useState<CombinationRow | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const archivedLoadedRef = useRef(false);
  const archivedLoadingRef = useRef(false);

  const viewOptions: { value: CombinationTableView; label: string }[] = [
    { value: "normal", label: d.filterNormal },
    { value: "archived", label: d.filterArchived },
  ];

  const visibleRows = tableView === "archived"
    ? archivedState.rows
    : standardState.rows.filter((row) => !row.isArchived);

  const hasMore = tableView === "archived" ? archivedState.hasMore : standardState.hasMore;
  const tableEmptyMessage = tableView === "archived" ? d.tableEmptyArchived : d.tableEmpty;
  const isArchivedViewLoading = tableView === "archived" && !archivedState.loaded;

  const confirmArchive = useCallback(async () => {
    if (!rowToArchive) return;

    setArchivingId(rowToArchive.id);
    try {
      const result = await archiveCombination(rowToArchive.region, rowToArchive.pest);

      if (result.success) {
        const archivedRow = { ...rowToArchive, isActive: false, isArchived: true };
        setStandardState((prev) => ({
          ...prev,
          rows: prev.rows.filter((r) => r.id !== rowToArchive.id),
        }));
        setArchivedState((prev) => ({
          ...prev,
          rows: prev.loaded ? [archivedRow, ...prev.rows.filter((r) => r.id !== rowToArchive.id)] : prev.rows,
        }));
      } else {
        showToast({ variant: "error", message: d.errorDefault });
      }
    } catch {
      showToast({ variant: "error", message: d.errorDefault });
    }
    setArchivingId(null);
    setRowToArchive(null);
  }, [rowToArchive, showToast, d.errorDefault]);

  const handleTableViewChange = useCallback(async (nextView: CombinationTableView) => {
    setTableView(nextView);

    if (nextView !== "archived" || archivedLoadedRef.current || archivedLoadingRef.current) {
      return;
    }

    archivedLoadingRef.current = true;
    setLoadingArchived(true);
    try {
      const res = await getAdminCombinationsPage(50, null, "archived");
      if (res.success && res.data) {
        const data = res.data;
        archivedLoadedRef.current = true;
        setArchivedState({
          rows: data.items,
          nextCursor: data.nextCursor,
          hasMore: data.hasMore,
          loaded: true,
        });
      } else {
        archivedLoadedRef.current = true;
        setArchivedState((prev) => ({ ...prev, loaded: true }));
        showToast({ variant: "error", message: d.errorDefault });
      }
    } catch {
      archivedLoadedRef.current = true;
      setArchivedState((prev) => ({ ...prev, loaded: true }));
      showToast({ variant: "error", message: d.errorDefault });
    } finally {
      archivedLoadingRef.current = false;
      setLoadingArchived(false);
    }
  }, [d.errorDefault, showToast]);

  const applyBulkMutationNotice = useCallback((bulkMutationNotice: BulkMutationNotice) => {
    const affectedKeys = new Set([
      ...bulkMutationNotice.affectedKeys,
      ...bulkMutationNotice.affectedRows.map((row) => row.id),
    ]);

    if (bulkMutationNotice.operation === "restore") {
      const restoredRows = bulkMutationNotice.affectedRows.map((row) => ({
        ...row,
        isActive: false,
        isArchived: false,
      }));

      setArchivedState((prev) => ({
        ...prev,
        rows: prev.rows.filter((row) => !affectedKeys.has(row.id)),
      }));
      setStandardState((prev) => ({
        ...prev,
        rows: getUpsertedRows(prev.rows, restoredRows),
      }));
      return;
    }

    if (bulkMutationNotice.operation === "archive") {
      const archivedRows = bulkMutationNotice.affectedRows.map((row) => ({
        ...row,
        isActive: false,
        isArchived: true,
      }));

      setStandardState((prev) => ({
        ...prev,
        rows: prev.rows.filter((row) => !affectedKeys.has(row.id)),
      }));
      setArchivedState((prev) => ({
        ...prev,
        rows: prev.loaded ? getUpsertedRows(prev.rows, archivedRows) : prev.rows,
      }));
      return;
    }

    if (bulkMutationNotice.operation === "deactivate") {
      setStandardState((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => affectedKeys.has(row.id) ? { ...row, isActive: false } : row),
      }));
      setArchivedState((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => affectedKeys.has(row.id) ? { ...row, isActive: false } : row),
      }));
      return;
    }

    setStandardState((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => !affectedKeys.has(row.id)),
    }));
    setArchivedState((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => !affectedKeys.has(row.id)),
    }));
  }, []);

  useEffect(() => subscribeBulkMutation(applyBulkMutationNotice), [
    applyBulkMutationNotice,
    subscribeBulkMutation,
  ]);

  const handleLoadMore = useCallback(async () => {
    const currentState = tableView === "archived" ? archivedState : standardState;
    if (!currentState.hasMore || loadingMore || !currentState.nextCursor) return;

    setLoadingMore(true);
    try {
      const res = await getAdminCombinationsPage(
        50,
        currentState.nextCursor,
        tableView === "archived" ? "archived" : "all"
      );
      if (res.success && res.data) {
        const data = res.data;
        if (tableView === "archived") {
          setArchivedState((prev) => ({
            rows: [...prev.rows, ...data.items],
            nextCursor: data.nextCursor,
            hasMore: data.hasMore,
            loaded: true,
          }));
        } else {
          setStandardState((prev) => ({
            rows: [...prev.rows, ...data.items],
            nextCursor: data.nextCursor,
            hasMore: data.hasMore,
            loaded: true,
          }));
        }
      } else {
        showToast({ variant: "error", message: d.errorDefault });
      }
    } catch {
      showToast({ variant: "error", message: d.errorDefault });
    } finally {
      setLoadingMore(false);
    }
  }, [archivedState, standardState, tableView, loadingMore, d.errorDefault, showToast]);

  const handleArchiveClick = useCallback((row: CombinationLightRow) => {
    setRowToArchive(row);
  }, []);

  const handleRestoreClick = useCallback(async (row: CombinationLightRow) => {
    if (restoringId) return;

    setRestoringId(row.id);
    try {
      const result = await unarchiveCombination(row.region, row.pest);

      if (result.success) {
        const restoredRow = { ...row, isActive: false, isArchived: false };
        setArchivedState((prev) => ({
          ...prev,
          rows: prev.rows.filter((r) => r.id !== row.id),
        }));
        setStandardState((prev) => {
          const alreadyLoaded = prev.rows.some((r) => r.id === row.id);
          return {
            ...prev,
            rows: alreadyLoaded
              ? prev.rows.map((r) => r.id === row.id ? restoredRow : r)
              : [restoredRow, ...prev.rows],
          };
        });
        showToast({ variant: "success", message: d.restoreSuccess });
      } else {
        const message = result.error === COMBINATION_ERRORS.RELATED_ENTITY_MISSING
          ? d.restoreRelatedMissingError
          : d.restoreError;
        showToast({ variant: "error", message });
      }
    } catch {
      showToast({ variant: "error", message: d.restoreError });
    } finally {
      setRestoringId(null);
    }
  }, [restoringId, showToast, d.restoreSuccess, d.restoreRelatedMissingError, d.restoreError]);

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
    setStandardState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => {
        if (r.id === updatedRow.id) {
          return {
            ...r,
            isActive: updatedRow.isActive ?? false,
            regionName: updatedRow.regionName,
            pestName: updatedRow.pestName
          };
        }
        return r;
      }),
    }));
  }, []);

  const handleToggleActive = useCallback(async (row: CombinationLightRow, isActive: boolean) => {
    if (pendingToggleIds.has(row.id)) return;

    setPendingToggleIds((prev) => {
      const next = new Set(prev);
      next.add(row.id);
      return next;
    });

    setStandardState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => r.id === row.id ? { ...r, isActive } : r),
    }));

    try {
      const result = await toggleCombinationStatus(row.region, row.pest, isActive);
      if (!result.success) {
        setStandardState((prev) => ({
          ...prev,
          rows: prev.rows.map((r) => r.id === row.id ? { ...r, isActive: !isActive } : r),
        }));
        showToast({ variant: "error", message: d.updateError });
      } else {
        showToast({ variant: "success", message: d.updateSuccess });
      }
    } catch {
      setStandardState((prev) => ({
        ...prev,
        rows: prev.rows.map((r) => r.id === row.id ? { ...r, isActive: !isActive } : r),
      }));
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
          {!row.isArchived && (
            <Switch
              disabled={pendingToggleIds.has(row.id)}
              checked={row.isActive ?? false}
              onChange={(checked) => handleToggleActive(row, checked)}
            />
          )}
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
              row.isArchived
                ? "bg-surface-neutral text-text-secondary border border-brand-border/60"
                : row.isActive
                ? "bg-success-bg/80 text-success-text border border-success-border/50"
                : "bg-error-bg/80 text-error-text border border-error-border/50"
            )}
          >
            {row.isArchived ? d.table.archived : row.isActive ? d.table.active : d.table.passive}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: d.table.actions,
      className: "text-right",
      render: (row) => {
        const isRestoring = restoringId === row.id;

        return (
          <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {row.isArchived ? (
              <Button
                variant="unstyled"
                size="none"
                onClick={() => handleRestoreClick(row)}
                disabled={isRestoring}
                className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-success-bg hover:text-success-text disabled:opacity-50"
                aria-label={`${isRestoring ? d.restoring : d.restore} ${row.regionName} ${row.pestName}`}
                title={isRestoring ? d.restoring : d.restore}
              >
                {isRestoring ? (
                  <div className="h-5 w-5 rounded-full border-2 border-success-text border-t-transparent animate-spin" aria-hidden="true" />
                ) : (
                  <ArchiveRestore size={ICON_SIZE} aria-hidden="true" />
                )}
              </Button>
            ) : (
              <>
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
                    <div className="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" aria-hidden="true" />
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
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={d.tableViewLabel}>
        {viewOptions.map((option) => (
          <Button
            key={option.value}
            variant={tableView === option.value ? "primary" : "outline"}
            size="sm"
            onClick={() => handleTableViewChange(option.value)}
            disabled={loadingArchived && option.value === "archived"}
            aria-pressed={tableView === option.value}
          >
            {loadingArchived && option.value === "archived" ? DICTIONARY.global.loading : option.label}
          </Button>
        ))}
      </div>

      {isArchivedViewLoading ? (
        <div
          className="bg-brand-surface border border-brand-border/60 rounded-xl p-12 text-center shadow-sm"
          aria-live="polite"
        >
          <p className="text-text-muted text-sm font-medium">{DICTIONARY.global.loading}</p>
        </div>
      ) : (
        <AdminEntityTable
          title={d.tableTitle}
          rows={visibleRows}
          columns={columns}
          getRowKey={(row) => row.id}
          emptyMessage={tableEmptyMessage}
        />
      )}

      {!isArchivedViewLoading && hasMore && (
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
