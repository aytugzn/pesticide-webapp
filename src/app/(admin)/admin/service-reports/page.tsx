import type { Metadata } from "next";
import { connection } from "next/server";
import { FileText } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { AdminListPage } from "@/components/layouts/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.reports.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminReportsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("service-reports").limit(50).get();
  const rows = snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return [
      String(data.customerName || data.name || doc.id),
      String(data.service || "-"),
      String(data.region || "-"),
      String(data.status || "-"),
    ];
  });

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.reports.title}
      description={DICTIONARY.admin.reports.description}
      icon={FileText}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.reports.empty}
        columns={[
          DICTIONARY.admin.reports.table.customer,
          DICTIONARY.admin.reports.table.service,
          DICTIONARY.admin.reports.table.region,
          DICTIONARY.admin.reports.table.status,
        ]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminReportsPage;
