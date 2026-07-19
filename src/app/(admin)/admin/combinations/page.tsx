import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { connection } from "next/server";
import { getEditableGlobalData } from "@/features/settings/data";
import { getAdminCombinationsPage } from "@/features/combinations/actions";
import { CombinationForm } from "@/features/combinations/components/admin/CombinationForm";
import { CombinationsTable } from "@/features/combinations/components/admin/CombinationsTable";
import { BulkGeneratePanel } from "@/features/combinations/components/admin/BulkGeneratePanel";
import { BulkMutationPanel } from "@/features/combinations/components/admin/BulkMutationPanel";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.combinations.title} | ${DICTIONARY.global.brand} ${DICTIONARY.admin.dashboard.subtitle}`,
  robots: { index: false, follow: false },
};

const AdminCombinationsPage = async () => {
  await connection();
  const [globalData, combinationsResult] = await Promise.all([
    getEditableGlobalData(),
    getAdminCombinationsPage(50, null),
  ]);

  const regions = globalData.regions || [];
  const pests = globalData.pests || [];
  const allRows = combinationsResult.success && combinationsResult.data ? combinationsResult.data.items : [];
  const nextCursor = combinationsResult.success && combinationsResult.data ? combinationsResult.data.nextCursor : null;
  const hasMore = combinationsResult.success && combinationsResult.data ? combinationsResult.data.hasMore : false;

  // Generate a deterministic key so the table remounts and resets local state when server data changes
  const tableKey = allRows.map((row) => `${row.id}:${row.region}:${row.pest}:${row.regionName ?? ""}:${row.pestName ?? ""}:${row.isActive ? "active" : "inactive"}:${row.isArchived ? "archived" : "visible"}`).join("|") || "empty";

  return (
    <div className="space-y-8">
      <header className="border-b border-brand-border pb-6">
        <p className="text-text-muted text-xs font-medium tracking-widest uppercase mb-1">
          {DICTIONARY.admin.dashboard.subtitle}
        </p>
        <h1 className="font-heading font-bold text-text-primary text-3xl">
          {DICTIONARY.admin.combinations.title}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {DICTIONARY.admin.combinations.description}
        </p>
      </header>

      <div className="space-y-10">
        <CombinationForm regions={regions} pests={pests} />
        <BulkGeneratePanel regions={regions} pests={pests} />
        <BulkMutationPanel regions={regions} pests={pests} />
        <CombinationsTable
          key={tableKey}
          initialRows={allRows}
          initialNextCursor={nextCursor}
          initialHasMore={hasMore}
        />
      </div>
    </div>
  );
};

export default AdminCombinationsPage;
