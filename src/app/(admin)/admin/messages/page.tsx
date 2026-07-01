import type { Metadata } from "next";
import { connection } from "next/server";
import { MessageSquare } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { AdminListPage } from "@/components/layouts/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";
import type { ContactRequestDoc } from "@/types";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.messages.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminMessagesPage = async () => {
  await connection();
  const snap = await getAdminDb()
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  const rows = snap.docs.map((doc) => {
    const data = doc.data() as Partial<ContactRequestDoc>;
    return [
      data.name || "-",
      data.phone || "-",
      data.service || "-",
      data.region || "-",
      data.status || "-",
    ];
  });

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.messages.title}
      description={DICTIONARY.admin.messages.description}
      icon={MessageSquare}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.messages.empty}
        columns={[
          DICTIONARY.admin.messages.table.name,
          DICTIONARY.admin.messages.table.phone,
          DICTIONARY.admin.messages.table.service,
          DICTIONARY.admin.messages.table.region,
          DICTIONARY.admin.messages.table.status,
        ]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminMessagesPage;
