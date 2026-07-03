"use client";

import { useState, useCallback } from "react";
import { archiveCombination, toggleCombinationStatus, getAdminCombination } from "../../actions";
import { DICTIONARY } from "@/constants/dictionary";
import type { CombinationRow, CombinationLightRow } from "../../types";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ExternalLink, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { CombinationEditModal } from "./CombinationEditModal";

type CombinationsTableProps = {
  initialRows: CombinationLightRow[];
};

const ICON_SIZE = 18;

export const CombinationsTable = ({ initialRows }: CombinationsTableProps) => {
  const d = DICTIONARY.admin.combinations;
  const [rows, setRows] = useState(initialRows);

  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [rowToArchive, setRowToArchive] = useState<CombinationLightRow | null>(null);
  const [rowToEdit, setRowToEdit] = useState<CombinationRow | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());

  const confirmArchive = useCallback(async () => {
    if (!rowToArchive) return;

    setArchivingId(rowToArchive.id);
    const result = await archiveCombination(rowToArchive.region, rowToArchive.pest);

    if (result.success) {
      setRows((prev) => prev.filter((r) => r.id !== rowToArchive.id));
    }
    setArchivingId(null);
    setRowToArchive(null);
  }, [rowToArchive]);

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
        alert(d.errorDefault);
      }
    } catch {
      alert(d.errorDefault);
    } finally {
      setLoadingEditId(null);
    }
  }, [loadingEditId, d.errorDefault]);

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
      }
    } catch {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, isActive: !isActive } : r));
    } finally {
      setPendingToggleIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  }, [pendingToggleIds]);

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
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="unstyled"
            size="none"
            onClick={() => handleEditClick(row)}
            disabled={loadingEditId === row.id}
            className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-brand-sm transition-colors disabled:opacity-50"
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
              className="p-2 rounded-lg text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
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
            className="p-2 text-text-secondary hover:text-error-text hover:bg-error-bg rounded-brand-sm transition-colors disabled:opacity-50"
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
