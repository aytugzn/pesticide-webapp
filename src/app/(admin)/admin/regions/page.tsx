import type { Metadata } from "next";
import { connection } from "next/server";
import { Map } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { parseRegionDoc } from "@/utils/parsers";
import { AdminListPage } from "@/components/layouts/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.regions.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminRegionsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("regions").get();
  const rows = snap.docs.map((doc) => {
    const region = parseRegionDoc(doc.data());
    return [
      region.name,
      region.slug || doc.id,
      region.isActive ? DICTIONARY.admin.regions.table.active : DICTIONARY.admin.regions.table.passive,
    ];
  });

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.regions.title}
      description={DICTIONARY.admin.regions.description}
      icon={Map}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.regions.empty}
        columns={[
          DICTIONARY.admin.regions.table.name,
          DICTIONARY.admin.regions.table.slug,
          DICTIONARY.admin.regions.table.status,
        ]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminRegionsPage;
