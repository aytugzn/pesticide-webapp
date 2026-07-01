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
    ["Telefon", settings.phone || "-"],
    ["E-posta", settings.email || "-"],
    ["Adres", settings.address || "-"],
    ["Calisma saatleri", settings.workingHours || "-"],
    ["Ruhsat no", settings.licenseNumber || "-"],
  ];

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.settings.title}
      description={DICTIONARY.admin.settings.description}
      icon={Settings}
    >
      <AdminDataTable
        emptyText="Ayar bulunamadı."
        columns={["Alan", "Değer"]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminSettingsPage;
