import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { connection } from "next/server";
import { getGlobalData } from "@/features/settings/actions";
import { getAdminCombinations } from "@/features/combinations/actions";
import { CombinationForm } from "@/features/combinations/components/admin/CombinationForm";
import { CombinationsTable } from "@/features/combinations/components/admin/CombinationsTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.combinations.title} | ${DICTIONARY.global.brand} ${DICTIONARY.admin.dashboard.subtitle}`,
  robots: { index: false, follow: false },
};

const AdminCombinationsPage = async () => {
  await connection();
  const [globalData, combinationsResult] = await Promise.all([
    getGlobalData(),
    getAdminCombinations(),
  ]);

  const regions = globalData.regions || [];
  const pests = globalData.pests || [];
  const rows = combinationsResult.success && combinationsResult.data ? combinationsResult.data : [];

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
        <CombinationsTable initialRows={rows} />
      </div>
    </div>
  );
};

export default AdminCombinationsPage;
