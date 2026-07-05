"use client";

import { useState, useCallback } from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils/cn";
import { togglePestStatus } from "../../actions";
import type { PestDoc } from "@/types";
import { Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PestForm } from "./PestForm";

type PestsTableProps = {
  initialRows: PestDoc[];
};

export const PestsTable = ({ initialRows }: PestsTableProps) => {
  const d = DICTIONARY.admin.pests;
  const [rows, setRows] = useState(initialRows);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<PestDoc | null>(null);
  const [prevInitialRows, setPrevInitialRows] = useState(initialRows);

  if (initialRows !== prevInitialRows) {
    setPrevInitialRows(initialRows);
    setRows(initialRows);
  }

  const handleToggleActive = useCallback(async (row: PestDoc, isActive: boolean) => {
    if (pendingToggleIds.has(row.slug)) return;

    setPendingToggleIds((prev) => {
      const next = new Set(prev);
      next.add(row.slug);
      return next;
    });

    setRows((prev) => prev.map((r) => r.slug === row.slug ? { ...r, isActive } : r));
    
    try {
      const result = await togglePestStatus(row.slug, isActive);
      if (!result.success) {
        setRows((prev) => prev.map((r) => r.slug === row.slug ? { ...r, isActive: !isActive } : r));
      }
    } catch {
      setRows((prev) => prev.map((r) => r.slug === row.slug ? { ...r, isActive: !isActive } : r));
    } finally {
      setPendingToggleIds((prev) => {
        const next = new Set(prev);
        next.delete(row.slug);
        return next;
      });
    }
  }, [pendingToggleIds]);

  const columns: AdminEntityColumn<PestDoc>[] = [
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
          onClick={() => setEditingRow(row)}
          className="min-h-10 min-w-10 rounded-brand-sm p-2.5 text-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
          title={d.editPest}
          aria-label={`${d.editPest}: ${row.name}`}
        >
          <Edit2 size={16} aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <>
      <AdminEntityTable
        emptyMessage={d.empty}
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.slug}
      />

      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title={d.editPest}
        className="max-w-4xl"
      >
        {editingRow && (
          <PestForm
            mode="edit"
            initialData={{
              ...editingRow,
              description: editingRow.description || "",
              title: editingRow.title || "",
              h1: editingRow.h1 || "",
              metaDesc: editingRow.metaDesc || "",
              content: editingRow.content || "",
              faq: editingRow.faq || [],
              isActive: editingRow.isActive ?? true,
            }}
            onSuccess={() => setEditingRow(null)}
          />
        )}
      </Modal>
    </>
  );
};
