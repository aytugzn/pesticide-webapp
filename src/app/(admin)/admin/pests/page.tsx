import type { Metadata } from "next";
import { connection } from "next/server";
import { Bug } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { parsePestDoc } from "@/utils/parsers";
import { AdminListPage } from "@/components/layout/AdminListPage";

import { PestForm } from "@/features/pests/components/admin/PestForm";
import { PestsTable } from "@/features/pests/components/admin/PestsTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.pests.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminPestsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("pests").get();
  const rows = snap.docs.map((doc) => parsePestDoc(doc.data()));

  const tableKey = rows.map((r) => r.slug).join("|");

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.pests.title}
      description={DICTIONARY.admin.pests.description}
      icon={Bug}
    >
      <div className="space-y-10">
        <PestForm />
        <PestsTable key={tableKey} initialRows={rows} />
      </div>
    </AdminListPage>
  );
};

export default AdminPestsPage;
