import type { Metadata } from "next";
import { connection } from "next/server";
import { Map } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { parseRegionDoc } from "@/utils/parsers";
import { AdminListPage } from "@/components/layout/AdminListPage";

import { RegionForm } from "@/features/regions/components/admin/RegionForm";
import { RegionsTable } from "@/features/regions/components/admin/RegionsTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.regions.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminRegionsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("regions").get();
  const rows = snap.docs.map((doc) => {
    const parsed = parseRegionDoc(doc.data());

    return {
      ...parsed,
      slug: doc.id,
    };
  });

  const tableKey = rows.map((r) => r.slug).join("|");

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.regions.title}
      description={DICTIONARY.admin.regions.description}
      icon={Map}
    >
      <div className="space-y-10">
        <RegionForm />
        <RegionsTable key={tableKey} initialRows={rows} />
      </div>
    </AdminListPage>
  );
};

export default AdminRegionsPage;
