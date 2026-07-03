"use client";

import { useState, useCallback } from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { AdminEntityTable, type AdminEntityColumn } from "@/components/ui/AdminEntityTable";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils/cn";
import { toggleRegionStatus } from "../../actions";
import type { RegionDoc } from "@/types";

type RegionsTableProps = {
  initialRows: RegionDoc[];
};

export const RegionsTable = ({ initialRows }: RegionsTableProps) => {
  const d = DICTIONARY.admin.regions;
  const [rows, setRows] = useState(initialRows);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());

  const handleToggleActive = useCallback(async (row: RegionDoc, isActive: boolean) => {
    if (pendingToggleIds.has(row.slug)) return;

    setPendingToggleIds((prev) => {
      const next = new Set(prev);
      next.add(row.slug);
      return next;
    });

    setRows((prev) => prev.map((r) => r.slug === row.slug ? { ...r, isActive } : r));
    
    try {
      const result = await toggleRegionStatus(row.slug, isActive);
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
  ];

  return (
    <AdminEntityTable
      emptyMessage={d.empty}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.slug}
    />
  );
};
