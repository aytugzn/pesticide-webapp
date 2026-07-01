import type { Metadata } from "next";
import { connection } from "next/server";
import { Bug } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { parsePestDoc } from "@/utils/parsers";
import { AdminListPage } from "@/components/layouts/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.pests.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminPestsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("pests").get();
  const rows = snap.docs.map((doc) => {
    const pest = parsePestDoc(doc.data());
    return [
      pest.name,
      pest.slug || doc.id,
      pest.isActive ? DICTIONARY.admin.pests.table.active : DICTIONARY.admin.pests.table.passive,
    ];
  });

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.pests.title}
      description={DICTIONARY.admin.pests.description}
      icon={Bug}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.pests.empty}
        columns={[
          DICTIONARY.admin.pests.table.name,
          DICTIONARY.admin.pests.table.slug,
          DICTIONARY.admin.pests.table.status,
        ]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminPestsPage;
