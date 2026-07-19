"use client";

import { useCallback, useState } from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/utils/cn";
import { deleteRegion, getRegionForAdminEdit, toggleRegionStatus } from "../../actions";
import type { RegionDoc } from "@/types";
import { Edit2, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { RegionForm } from "./RegionForm";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";

type RegionsTableProps = {
  initialRows: RegionDoc[];
};

const ICON_SIZE = 16;

export const RegionsTable = ({ initialRows }: RegionsTableProps) => {
  const d = DICTIONARY.admin.regions;
  const { showToast } = useCombinationAdminToast();
  const [deletedSlugs, setDeletedSlugs] = useState<Set<string>>(new Set());
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<RegionDoc | null>(null);
  const [pendingEditSlug, setPendingEditSlug] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [rowToDelete, setRowToDelete] = useState<RegionDoc | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<{ variant: "success" | "warning" | "error"; message: string } | null>(null);

  const rows = initialRows
    .filter((row) => !deletedSlugs.has(row.slug))
    .map((row) =>
      Object.hasOwn(activeOverrides, row.slug)
        ? { ...row, isActive: activeOverrides[row.slug] }
        : row,
    );

  const handleToggleActive = useCallback(async (row: RegionDoc, isActive: boolean) => {
    if (pendingToggleIds.has(row.slug)) return;

    setPendingToggleIds((prev) => {
      const next = new Set(prev);
      next.add(row.slug);
      return next;
    });

    setActiveOverrides((prev) => ({ ...prev, [row.slug]: isActive }));
    
    try {
      const result = await toggleRegionStatus(row.slug, isActive);
      if (!result.success) {
        setActiveOverrides((prev) => {
          const next = { ...prev };
          delete next[row.slug];
          return next;
        });
      } else if (result.data?.activationStatus === "deferred") {
        showToast({
          variant: "warning",
          message: result.data?.publicationRequired
            ? DICTIONARY.admin.publicPublicationRequiredWarning
            : DICTIONARY.admin.publicActivationDeferredWarning,
        });
      }
    } catch {
      setActiveOverrides((prev) => {
        const next = { ...prev };
        delete next[row.slug];
        return next;
      });
    } finally {
      setPendingToggleIds((prev) => {
        const next = new Set(prev);
        next.delete(row.slug);
        return next;
      });
    }
  }, [pendingToggleIds, showToast]);

  const handleEdit = useCallback(async (row: RegionDoc) => {
    if (pendingEditSlug) return;

    setEditError(null);
    setPendingEditSlug(row.slug);

    try {
      const result = await getRegionForAdminEdit(row.slug);

      if (result.success && result.data) {
        setEditingRow(result.data);
        return;
      }

      setEditError(d.errorDefault);
    } catch {
      setEditError(d.errorDefault);
    } finally {
      setPendingEditSlug(null);
    }
  }, [d.errorDefault, pendingEditSlug]);

  const handleCloseEdit = useCallback(() => {
    setEditingRow(null);
    setEditError(null);
  }, []);

  const handleDeleteClick = useCallback((row: RegionDoc) => {
    setDeleteNotice(null);
    setRowToDelete(row);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!rowToDelete || deletingSlug) return;

    setDeletingSlug(rowToDelete.slug);
    setDeleteNotice(null);

    try {
      const result = await deleteRegion(rowToDelete.slug);

      if (result.success) {
        setDeletedSlugs((prev) => {
          const next = new Set(prev);
          next.add(rowToDelete.slug);
          return next;
        });
        setActiveOverrides((prev) => {
          const next = { ...prev };
          delete next[rowToDelete.slug];
          return next;
        });
        setDeleteNotice({
          variant:
            result.data?.activationStatus === "deferred"
              ? "warning"
              : "success",
          message:
            result.data?.activationStatus === "deferred"
              ? result.data?.publicationRequired
                ? DICTIONARY.admin.publicPublicationRequiredWarning
                : DICTIONARY.admin.publicActivationDeferredWarning
              : d.deleteSuccess,
        });
        setRowToDelete(null);
        return;
      }

      setDeleteNotice({
        variant: "error",
        message: result.error === "REGION_IN_USE" ? d.deleteInUseError : d.deleteError,
      });
      setRowToDelete(null);
    } catch {
      setDeleteNotice({ variant: "error", message: d.deleteError });
      setRowToDelete(null);
    } finally {
      setDeletingSlug(null);
    }
  }, [d.deleteError, d.deleteInUseError, d.deleteSuccess, deletingSlug, rowToDelete]);

  const columns: AdminEntityColumn<RegionDoc>[] = [
    {
      key: "name",
      header: d.table.name,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "slug",
      header: d.table.slug,
      render: (row) => row.slug,
    },
    {
      key: "status",
      header: d.table.status,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Switch
            disabled={pendingToggleIds.has(row.slug)}
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
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="unstyled"
            size="none"
            onClick={() => handleEdit(row)}
            disabled={!!pendingEditSlug}
            className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
            title={d.editRegion}
            aria-label={`${d.editRegion}: ${row.name}`}
          >
            {pendingEditSlug === row.slug ? (
              <Loader2 size={ICON_SIZE} className="animate-spin" aria-hidden="true" />
            ) : (
              <Edit2 size={ICON_SIZE} aria-hidden="true" />
            )}
          </Button>
          {row.isActive && (
            <a
              href={`/bolge/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-brand-sm p-2.5 text-text-muted transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
              aria-label={`${d.viewPublicPage}: ${row.name}`}
              title={d.viewPublicPage}
            >
              <ExternalLink size={ICON_SIZE} aria-hidden="true" />
            </a>
          )}
          <Button
            variant="unstyled"
            size="none"
            onClick={() => handleDeleteClick(row)}
            disabled={deletingSlug === row.slug}
            className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-error-bg hover:text-error-text disabled:cursor-not-allowed disabled:opacity-60"
            title={d.delete}
            aria-label={`${d.delete}: ${row.name}`}
          >
            {deletingSlug === row.slug ? (
              <Loader2 size={ICON_SIZE} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={ICON_SIZE} aria-hidden="true" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {editError && (
        <Alert variant="error" message={editError} className="mb-4" />
      )}
      {deleteNotice && (
        <Alert
          variant={
            deleteNotice.variant === "warning"
              ? "info"
              : deleteNotice.variant
          }
          message={deleteNotice.message}
          className="mb-4"
        />
      )}

      <AdminEntityTable
        emptyMessage={d.empty}
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.slug}
      />

      <Modal
        isOpen={!!editingRow}
        onClose={handleCloseEdit}
        title={d.editRegion}
        className="max-w-4xl"
      >
        {editingRow && (
          <RegionForm
            key={editingRow.slug}
            mode="edit"
            initialData={{
              ...editingRow,
              description: editingRow.description || "",
              cardDescription: editingRow.cardDescription || "",
              title: editingRow.title || "",
              h1: editingRow.h1 || "",
              metaDesc: editingRow.metaDesc || "",
              content: editingRow.content || "",
              faq: editingRow.faq || [],
              isActive: editingRow.isActive ?? true,
            }}
            onSuccess={handleCloseEdit}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!rowToDelete}
        onClose={() => setRowToDelete(null)}
        title={d.delete}
      >
        <p className="mb-6 text-text-secondary">{d.deleteConfirm}</p>
        <div className="mt-2 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setRowToDelete(null)}
            disabled={!!deletingSlug}
          >
            {DICTIONARY.global.ui.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={!!deletingSlug}
          >
            {deletingSlug ? DICTIONARY.global.loading : d.delete}
          </Button>
        </div>
      </Modal>
    </>
  );
};
