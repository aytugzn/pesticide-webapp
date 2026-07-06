"use client";

import { useCallback, useState } from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Switch } from "@/components/ui/Switch";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/utils/cn";
import { getRegionForAdminEdit, toggleRegionStatus } from "../../actions";
import type { RegionDoc } from "@/types";
import { Edit2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { RegionForm } from "./RegionForm";

type RegionsTableProps = {
  initialRows: RegionDoc[];
};

export const RegionsTable = ({ initialRows }: RegionsTableProps) => {
  const d = DICTIONARY.admin.regions;
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<RegionDoc | null>(null);
  const [pendingEditSlug, setPendingEditSlug] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const rows = initialRows.map((row) =>
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
  }, [pendingToggleIds]);

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
        <button
          onClick={() => handleEdit(row)}
          disabled={!!pendingEditSlug}
          className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
          title={d.editRegion}
          aria-label={`${d.editRegion}: ${row.name}`}
        >
          {pendingEditSlug === row.slug ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Edit2 size={16} aria-hidden="true" />
          )}
        </button>
      ),
    },
  ];

  return (
    <>
      {editError && (
        <Alert variant="error" message={editError} className="mb-4" />
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
    </>
  );
};
