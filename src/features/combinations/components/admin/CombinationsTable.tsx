"use client";

import { useState, useCallback } from "react";
import { deleteCombination } from "../../actions";
import { DICTIONARY } from "@/constants/dictionary";
import type { CombinationRow } from "../../types";
import { CombinationTableRow } from "./CombinationTableRow";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type CombinationsTableProps = {
  initialRows: CombinationRow[];
};

/**
 * Admin table displaying all generated combinations with status and actions.
 */
export const CombinationsTable = ({ initialRows }: CombinationsTableProps) => {
  const d = DICTIONARY.admin.combinations;
  const [rows, setRows] = useState(initialRows);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowToDelete, setRowToDelete] = useState<CombinationRow | null>(null);

  const confirmDelete = useCallback(async () => {
    if (!rowToDelete) return;

    setDeletingId(rowToDelete.id);
    const result = await deleteCombination(
      rowToDelete.region,
      rowToDelete.pest,
    );

    if (result.success) {
      setRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
    }
    setDeletingId(null);
    setRowToDelete(null);
  }, [rowToDelete]);

  const handleDeleteClick = useCallback((row: CombinationRow) => {
    setRowToDelete(row);
  }, []);

  if (rows.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border/60 rounded-xl p-12 text-center shadow-sm">
        <p className="text-text-muted text-sm font-medium">{d.tableEmpty}</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-brand-border/60 bg-surface-neutral/30">
        <h2 className="font-heading font-bold text-text-primary text-lg tracking-tight">
          {d.tableTitle}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border/60 bg-surface-neutral/50">
              <th className="text-left px-6 py-4 font-semibold text-text-secondary tracking-wide uppercase text-xs">
                {d.table.region}
              </th>
              <th className="text-left px-6 py-4 font-semibold text-text-secondary tracking-wide uppercase text-xs">
                {d.table.pest}
              </th>
              <th className="text-left px-6 py-4 font-semibold text-text-secondary tracking-wide uppercase text-xs">
                {d.table.status}
              </th>
              <th className="text-right px-6 py-4 font-semibold text-text-secondary tracking-wide uppercase text-xs">
                {d.table.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CombinationTableRow
                key={row.id}
                row={row}
                isDeleting={deletingId === row.id}
                onDelete={handleDeleteClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!rowToDelete}
        onClose={() => setRowToDelete(null)}
        title={d.delete}
      >
        <p className="text-text-secondary mb-6">{d.deleteConfirm}</p>
        <div className="flex items-center justify-end gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => setRowToDelete(null)}
            disabled={!!deletingId}
          >
            {DICTIONARY.admin.regions.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={!!deletingId}
          >
            {deletingId ? DICTIONARY.global.loading : d.delete}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
