import type { Metadata } from "next";
import { connection } from "next/server";
import { Settings } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { parseSettingsDoc } from "@/utils/parsers";
import { AdminListPage } from "@/components/layouts/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.settings.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminSettingsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("settings").doc("general").get();
  const settings = parseSettingsDoc(snap.data());
  const rows = [
    [DICTIONARY.admin.settings.table.phone, settings.phone || "-"],
    [DICTIONARY.admin.settings.table.email, settings.email || "-"],
    [DICTIONARY.admin.settings.table.address, settings.address || "-"],
    [DICTIONARY.admin.settings.table.workingHours, settings.workingHours || "-"],
    [DICTIONARY.admin.settings.table.licenseNumber, settings.licenseNumber || "-"],
  ];

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.settings.title}
      description={DICTIONARY.admin.settings.description}
      icon={Settings}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.settings.empty}
        columns={[DICTIONARY.admin.settings.table.field, DICTIONARY.admin.settings.table.value]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminSettingsPage;
